import json
import os

import httpx
from bs4 import BeautifulSoup
from google import genai as google_genai
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


# ── Platform detection ──

def _is_youtube(url: str) -> bool:
    return any(x in url for x in ("youtube.com/watch", "youtube.com/shorts", "youtu.be/"))


def _is_tiktok(url: str) -> bool:
    return "tiktok.com/@" in url and "/video/" in url


def _is_pdf(url: str) -> bool:
    path = url.split("?")[0].lower()
    return path.endswith(".pdf")


async def _upload_tiktok_video(url: str) -> types.Part:
    raise NotImplementedError("TikTok video processing is not currently supported")


async def _fetch_pdf_inline(url: str) -> types.Part:
    """Fetch PDF bytes from URL and pass as inline data (per Gemini document processing docs)."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    return types.Part.from_bytes(data=resp.content, mime_type="application/pdf")


async def _fetch_webpage_part(url: str) -> types.Part:
    """Fetch a webpage and return its text content as a Gemini text Part."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    return types.Part(text=f"Web page from {url}:\n\n{text[:50000]}")


async def _get_content_part(url: str) -> types.Part:
    """Return the appropriate Gemini content Part for any URL type."""
    if _is_youtube(url):
        return types.Part(file_data=types.FileData(file_uri=url))
    if _is_tiktok(url):
        return await _upload_tiktok_video(url)
    if _is_pdf(url):
        return await _fetch_pdf_inline(url)
    return await _fetch_webpage_part(url)


async def process_video(
    url: str,
    extraction_config: dict,
    handler: SchemaHandler,
    source_id: str,
    max_retries: int = 2,
) -> ProcessingResult:
    session_service = InMemorySessionService()
    output_schema = extraction_config.get("output_schema", [])

    processing_chain = LoopAgent(
        name="ProcessingChain",
        sub_agents=[
            create_extraction_agent(extraction_config),
            create_critique_agent(output_schema, handler, source_id),
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
            await _get_content_part(url),
            types.Part(
                text="Extract information from this content following the instructions. Output valid JSON."
            ),
        ],
    )

    try:
        extraction_text = None
        attempts = 0
        async for event in runner.run_async(
            session_id=session.id, user_id="user", new_message=content,
        ):
            if getattr(event, "author", None) == "ContentExtractionAgent":
                for part in (event.content and event.content.parts) or []:
                    if getattr(part, "text", None):
                        extraction_text = part.text
                        attempts += 1

        raw_content = session.state.get("extracted_content") or extraction_text

        # Parse critique from state (stored as string via output_key)
        critique_raw = session.state.get("critique_result")
        critique_result = None
        if critique_raw:
            if isinstance(critique_raw, dict):
                critique_result = critique_raw
            elif isinstance(critique_raw, str):
                try:
                    critique_result = json.loads(critique_raw)
                except (json.JSONDecodeError, TypeError):
                    critique_result = {"raw": critique_raw}

        if raw_content is None:
            return ProcessingResult(success=False, error="No extracted content found", attempts=attempts)

        try:
            extracted_data = _parse_extracted_data(raw_content)
            if not isinstance(extracted_data, list):
                extracted_data = [extracted_data]
        except (json.JSONDecodeError, TypeError):
            return ProcessingResult(success=False, extracted_data=[{"raw_output": raw_content}], error="Failed to parse extracted data", critique=critique_result, attempts=attempts)

        # Write was attempted inside the critique agent's try_write_and_exit tool.
        write_result = session.state.get("write_result")
        if write_result is None:
            # Loop hit max_iterations without a successful write
            return ProcessingResult(
                success=False,
                extracted_data=extracted_data,
                critique=critique_result,
                attempts=attempts,
                error="Max retries reached without a successful write",
            )

        wrote = write_result.get("success", False)
        return ProcessingResult(
            success=wrote,
            extracted_data=extracted_data,
            critique=critique_result,
            attempts=attempts,
            error=None if wrote else f"Write failed: {write_result.get('errors')}",
        )

    except Exception as e:
        return ProcessingResult(success=False, error=f"Processing failed: {e}", attempts=0)
