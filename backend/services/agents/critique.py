from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext
from utils.prompt import CRITIQUE_INSTRUCTION


def exit_loop(tool_context: ToolContext):
    """Call this tool when the extracted data is VALID and matches the schema. This ends the refinement loop."""
    tool_context.actions.escalate = True
    tool_context.actions.skip_summarization = True
    return {}


def create_critique_agent(output_schema: dict) -> LlmAgent:
    full_instruction = f"""{CRITIQUE_INSTRUCTION}

## Target Schema to Validate Against:
{output_schema}

## Actions:
- Review the extracted data from the previous agent's output in the conversation.
- If the extraction is VALID (field names match schema, types correct, values sensible): call the `exit_loop` tool to stop the loop.
- If the extraction is INVALID: explain what's wrong and provide specific retry guidance for re-extraction. Do NOT call exit_loop.
"""

    return LlmAgent(
        name="CritiqueAgent",
        model="gemini-flash-latest",
        instruction=full_instruction,
        description="Validates extracted data and decides if retry is needed",
        tools=[exit_loop],
        output_key="critique_result",
    )
