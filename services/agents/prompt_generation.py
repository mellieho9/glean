from google.adk.agents import LlmAgent
from models.agents import ExtractionConfig
from utils.prompt import PROMPT_GENERATION_INSTRUCTION

FULL_INSTRUCTION = PROMPT_GENERATION_INSTRUCTION + """

## Example Output:
For a cooking database with user preference "estimate cook time if not stated":

{
  "extraction_prompt": "Extract the following from this cooking video:\\n\\n1. **Name**: Recipe title as stated\\n2. **Ingredients**: ALL ingredients with quantities as bullet list\\n3. **Steps**: Numbered steps with timing\\n4. **Cook Time**: Total minutes (integer). If not stated, estimate from steps.\\n\\nOutput as JSON.",
  "output_schema": {...},
  "field_mappings": {"Name": "Name", ...},
  "classification_hints": ["recipe", "cooking", "ingredients", "chef"]
}
"""

prompt_generation_agent = LlmAgent(
    name="PromptGenerationAgent",
    model="gemini-2.0-pro",  # Smarter model for prompt writing
    instruction=FULL_INSTRUCTION,
    description="Generates frozen extraction config from schema and user answers",
    output_schema=ExtractionConfig,
    output_key="extraction_config"
)