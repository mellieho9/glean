from google.adk.agents import LlmAgent
from models.agents import ExtractionConfig
from utils.prompt import PROMPT_GENERATION_INSTRUCTION

FULL_INSTRUCTION = (
    PROMPT_GENERATION_INSTRUCTION
    + """

## Example Output 1:
For a cooking database with user preference "estimate cook time if not stated":

{
  "extraction_prompt": "Extract the following from this cooking video:\\n\\n1. **Name**: Recipe title as stated\\n2. **Ingredients**: ALL ingredients with quantities as bullet list\\n3. **Steps**: Numbered steps with timing\\n4. **Cook Time**: Total minutes (integer). If not stated, estimate from steps.\\n\\nOutput as JSON.",
  "output_schema": [...],
  "field_mappings": [...],
  "classification_hints": ["recipe", "cooking", "ingredients", "chef"],
  "required_tools": []
}

## Example Output 2:
For a Places database with address and coordinate fields:

{
  "extraction_prompt": "Extract place information from this video:\\n\\n1. **Place**: Name of the restaurant/cafe/shop\\n2. **Address**: Full address. Use MapsGroundingAgent to verify and complete.\\n3. **Coordinate**: Get lat/lng from MapsGroundingAgent\\n4. **Category**: Pick closest from [Restaurant, Bakery, Cafe, Workshop, Stationery]\\n\\nOutput as JSON.",
  "output_schema": [...],
  "field_mappings": [...],
  "classification_hints": ["tokyo", "japan", "restaurant", "cafe", "food", "travel"],
  "required_tools": [
    {
      "tool_name": "google_maps",
      "usage_hint": "Use to verify place names, get full addresses, and retrieve coordinates for any location mentioned in the video"
    }
  ]
}
"""
)

prompt_generation_agent = LlmAgent(
    name="PromptGenerationAgent",
    model="gemini-3-flash-preview",
    instruction=FULL_INSTRUCTION,
    description="Generates frozen extraction config from schema and user answers",
    output_schema=ExtractionConfig,
    output_key="extraction_config",
)
