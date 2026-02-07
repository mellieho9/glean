from google.adk.agents import LlmAgent
from models.agents import CritiqueOutput
from utils.prompt import CRITIQUE_INSTRUCTION


def create_critique_agent(output_schema: dict) -> LlmAgent:
    full_instruction = f"""{CRITIQUE_INSTRUCTION}

    ## Target Schema to Validate Against:
    {output_schema}
"""

    return LlmAgent(
        name="CritiqueAgent",
        model="gemini-flash-latest",
        instruction=full_instruction,
        description="Validates extracted data and decides if retry is needed",
        output_schema=CritiqueOutput,
        output_key="critique_result",
    )
