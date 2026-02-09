import json
from google.adk.agents import LoopAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from models.agents import (
    QuestionGenerationOutput,
    ExtractionConfig,
    ProcessingResult,
)
from services.agents.question_generation import question_generation_agent
from services.agents.prompt_generation import prompt_generation_agent
from services.agents.content_extraction import create_extraction_agent
from services.agents.critique import create_critique_agent
from services.schema_handler import SchemaHandler


async def run_onboarding_chain(
    schema: dict, tag: str, db_type: str = "notion"
) -> QuestionGenerationOutput:
    session_service = InMemorySessionService()
    runner = Runner(
        agent=question_generation_agent,
        app_name="glean",
        session_service=session_service,
    )

    user_message = f"""
## Database Information
Tag: {tag}
Database Type: {db_type}

## Schema:
{json.dumps(schema, indent=2)}

Generate clarifying questions for this database schema.
"""

    session = await session_service.create_session(app_name="glean", user_id="system")

    content = types.Content(
        role="user",
        parts=[types.Part(text=user_message)],
    )

    final_response = None
    async for event in runner.run_async(
        session_id=session.id,
        user_id="system",
        new_message=content,
    ):
        if event.is_final_response():
            final_response = (
                event.content.parts[0].text
                if event.content and event.content.parts
                else None
            )

    state_result = session.state.get("generated_questions")
    if state_result:
        if isinstance(state_result, QuestionGenerationOutput):
            return state_result
        return QuestionGenerationOutput(**state_result)

    if final_response:
        try:
            parsed = json.loads(final_response)
            return QuestionGenerationOutput(**parsed)
        except (json.JSONDecodeError, TypeError) as e:
            raise ValueError(f"Failed to parse question generation response: {e}")

    raise ValueError("No response received from question generation agent")


async def run_prompt_generation(
    schema: dict, tag: str, user_answers: dict, db_type: str = "notion"
) -> ExtractionConfig:
    session_service = InMemorySessionService()
    runner = Runner(
        agent=prompt_generation_agent,
        app_name="glean",
        session_service=session_service,
    )

    user_message = f"""
## Database Information
Tag: {tag}
Database Type: {db_type}

## Schema:
{json.dumps(schema, indent=2)}

## User's Answers to Clarifying Questions:
{json.dumps(user_answers, indent=2)}

Generate the frozen extraction configuration.
"""

    session = await session_service.create_session(app_name="glean", user_id="system")

    content = types.Content(
        role="user",
        parts=[types.Part(text=user_message)],
    )

    final_response = None
    async for event in runner.run_async(
        session_id=session.id,
        user_id="system",
        new_message=content,
    ):
        if event.is_final_response():
            final_response = (
                event.content.parts[0].text
                if event.content and event.content.parts
                else None
            )

    state_result = session.state.get("extraction_config")
    if state_result:
        if isinstance(state_result, ExtractionConfig):
            return state_result
        return ExtractionConfig(**state_result)

    if final_response:
        try:
            parsed = json.loads(final_response)
            return ExtractionConfig(**parsed)
        except (json.JSONDecodeError, TypeError) as e:
            raise ValueError(f"Failed to parse extraction config response: {e}")

    raise ValueError("No response received from prompt generation agent")


def _parse_extracted_data(raw) -> dict:
    if not isinstance(raw, str):
        return raw
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


async def process_video(
    youtube_url: str,
    extraction_config: dict,
    handler: SchemaHandler,
    source_id: str,
    max_retries: int = 2,
) -> ProcessingResult:
    session_service = InMemorySessionService()
    output_schema = extraction_config.get("output_schema", [])
    field_mappings = extraction_config.get("field_mappings", [])

    processing_chain = LoopAgent(
        name="ProcessingChain",
        sub_agents=[
            create_extraction_agent(extraction_config),
            create_critique_agent(output_schema),
        ],
        max_iterations=max_retries + 1,
    )

    runner = Runner(
        agent=processing_chain,
        app_name="glean",
        session_service=session_service,
    )

    session = await session_service.create_session(app_name="glean", user_id="user")

    content = types.Content(
        role="user",
        parts=[
            types.Part(file_data=types.FileData(file_uri=youtube_url)),
            types.Part(
                text="Extract information from this video following the instructions. Output valid JSON."
            ),
        ],
    )

    try:
        extraction_text = None
        async for event in runner.run_async(
            session_id=session.id, user_id="user", new_message=content,
        ):
            if getattr(event, "author", None) == "ContentExtractionAgent":
                for part in (event.content and event.content.parts) or []:
                    if getattr(part, "text", None):
                        extraction_text = part.text

        raw_content = session.state.get("extracted_content") or extraction_text
        critique_result = session.state.get("critique_result")
        attempts = session.state.get("loop_iteration", 1)

        if raw_content is None:
            return ProcessingResult(success=False, error="No extracted content found", attempts=attempts)

        try:
            extracted_data = _parse_extracted_data(raw_content)
            print("Extracted_data", extracted_data)
            if not isinstance(extracted_data, list):
                extracted_data = [extracted_data]
        except (json.JSONDecodeError, TypeError):
            return ProcessingResult(success=False, extracted_data=[{"raw_output": raw_content}], error="Failed to parse extracted data", attempts=attempts)

        critique_valid = getattr(critique_result, "valid", None) if not isinstance(critique_result, dict) else critique_result.get("valid", False)

        if not (critique_valid or critique_result is None):
            return ProcessingResult(success=False, extracted_data=extracted_data, critique=critique_result, error="Critique rejected extraction", attempts=attempts)

        try:
            result = handler.write_data(source_id, extracted_data)
            wrote = result.get("success", False) if isinstance(result, dict) else False
            return ProcessingResult(
                success=wrote,
                extracted_data=extracted_data,
                critique=critique_result,
                attempts=attempts,
                error=None if wrote else f"Write failed: {result}",
            )
        except Exception as e:
            return ProcessingResult(success=False, extracted_data=extracted_data, critique=critique_result, error=f"Write exception: {e}", attempts=attempts)

    except Exception as e:
        return ProcessingResult(success=False, error=f"Processing failed: {e}", attempts=0)
