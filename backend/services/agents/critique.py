import asyncio
import json

from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext
from services.schema_handler import SchemaHandler
from utils.prompt import CRITIQUE_INSTRUCTION


def create_critique_agent(
    output_schema: dict, handler: SchemaHandler, source_id: str
) -> LlmAgent:
    async def try_write_and_exit(tool_context: ToolContext) -> dict:
        """Attempt to write the extracted data to the database.
        Call this when schema validation passes.
        If the write succeeds, the loop exits automatically.
        If it fails, the errors are returned so you can relay them as feedback.
        """
        raw = tool_context.state.get("extracted_content")
        if not raw:
            return {"error": "No extracted content found in state."}

        # Parse extracted content
        try:
            if isinstance(raw, str):
                cleaned = raw
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("```")[1]
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:]
                data = json.loads(cleaned)
            else:
                data = raw
            if not isinstance(data, list):
                data = [data]
        except Exception as e:
            return {
                "error": f"Failed to parse JSON: {e}. The extraction agent must output valid JSON."
            }

        # Attempt write (sync call moved to thread to avoid blocking the event loop)
        result = await asyncio.to_thread(handler.write_data, source_id, data)

        # Store result in session state so pipeline.py can read it after the loop
        tool_context.state["write_result"] = result

        if result.get("success"):
            tool_context.actions.escalate = True
            tool_context.actions.skip_summarization = True
            return {}

        return {
            "write_failed": True,
            "failed_count": result.get("failed_count", 0),
            "errors": result.get("errors", []),
        }

    full_instruction = f"""{CRITIQUE_INSTRUCTION}

## Target Schema to Validate Against:
{output_schema}

## Extracted Data to Validate:
{{extracted_content}}

## Actions:
1. Validate the extracted data above against the schema (field names, types, values).
2. If schema validation FAILS: output plain text describing exactly what is wrong. Do NOT call try_write_and_exit.
3. If schema validation PASSES: call `try_write_and_exit`.
   - If the write succeeds, the loop exits automatically.
   - If write errors are returned, output them as plain text feedback so the extraction agent knows exactly what to fix.
"""

    return LlmAgent(
        name="CritiqueAgent",
        model="gemini-flash-latest",
        instruction=full_instruction,
        description="Validates extracted data and attempts to write to the database",
        tools=[try_write_and_exit],
        output_key="critique_result",
    )
