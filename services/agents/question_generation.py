from google.adk.agents import LlmAgent
from models.agents import QuestionGenerationOutput
from utils.prompt import QUESTION_GENERATION_INSTRUCTION

question_generation_agent = LlmAgent(
    name="QuestionGenerationAgent",
    model="gemini-2.0-flash",  # Fast model for analysis
    instruction=QUESTION_GENERATION_INSTRUCTION,
    description="Analyzes database schema and generates clarifying questions for users",
    output_schema=QuestionGenerationOutput,
    output_key="generated_questions"
)