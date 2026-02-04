from google.adk.agents import LlmAgent
from utils.prompt import EXTRACTION_INSTRUCTION

def create_extraction_agent(extraction_config: dict) -> LlmAgent:
    """
    Creates an extraction agent with the frozen prompt baked in.
    
    Note: We don't use output_schema here because the schema is dynamic
    per database. Validation happens in the Critique agent.
    """
    
    # Build the full instruction with frozen prompt
    full_instruction = f"""{EXTRACTION_INSTRUCTION}

## Your Extraction Instructions:
{extraction_config['extraction_prompt']}

## Expected Output Schema:
{extraction_config['output_schema']}
"""
    
    return LlmAgent(
        name="ContentExtractionAgent",
        model="gemini-2.0-pro",  # Needs video understanding
        instruction=full_instruction,
        description="Extracts structured data from YouTube videos",
        output_key="extracted_content"
    )