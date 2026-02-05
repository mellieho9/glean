"""Content extraction agent with grounding tool support."""

from google.adk.agents import LlmAgent
from utils.grounding import AVAILABLE_TOOLS
from utils.prompt import EXTRACTION_INSTRUCTION


def create_extraction_agent(extraction_config: dict) -> LlmAgent:
    tools = []
    tool_instructions = []

    required_tools = extraction_config.get('required_tools', [])
    for tool_req in required_tools:
        if isinstance(tool_req, dict):
            tool_name = tool_req.get('tool_name')
            usage_hint = tool_req.get('usage_hint', '')
        else:
            tool_name = tool_req.tool_name
            usage_hint = tool_req.usage_hint

        if tool_name in AVAILABLE_TOOLS:
            tools.append(AVAILABLE_TOOLS[tool_name])
            tool_instructions.append(f"- **{tool_name}**: {usage_hint}")

    tool_section = ""
    if tool_instructions:
        tool_section = f"""

## Available Grounding Tools:
Use these tools to enhance extraction accuracy:
{chr(10).join(tool_instructions)}

Call the appropriate tool when you need verified information beyond what's in the video.
"""

    full_instruction = f"""{EXTRACTION_INSTRUCTION}
{tool_section}
## Your Extraction Instructions:
{extraction_config['extraction_prompt']}

## Expected Output Schema:
{extraction_config['output_schema']}
"""

    return LlmAgent(
        name="ContentExtractionAgent",
        model="gemini-3-flash-preview",
        instruction=full_instruction,
        description="Extracts structured data from YouTube videos",
        tools=tools if tools else None,
        output_key="extracted_content"
    )
