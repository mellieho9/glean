from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

# ============================================
# Question Generation Agent Schemas
# ============================================

class Question(BaseModel):
    """A single clarifying question for the user"""
    id: str = Field(description="Unique identifier like q1, q2, etc.")
    field: str = Field(description="The schema field this relates to, or 'general'")
    question: str = Field(description="The question to ask the user")
    question_type: Literal["text", "select", "multiselect", "boolean"] = Field(
        description="Type of input expected"
    )
    options: Optional[List[str]] = Field(
        default=None,
        description="Options for select/multiselect types"
    )
    why_asking: str = Field(description="Brief explanation of why this matters")
    default_suggestion: Any = Field(description="Reasonable default if user skips")

class QuestionGenerationOutput(BaseModel):
    """Output from Question Generation Agent"""
    schema_summary: str = Field(
        description="Brief description of what this database captures"
    )
    questions: List[Question] = Field(
        description="4-8 clarifying questions for the user",
        min_length=3,
        max_length=8
    )

# ============================================
# Prompt Generation Agent Schemas
# ============================================

class FieldSchema(BaseModel):
    """Schema definition for a single extracted field"""
    field_name: str = Field(description="Name of the field")
    type: Literal["string", "number", "array", "boolean", "place"]
    description: str
    required: bool = True
    constraints: Optional[str] = None


class FieldMapping(BaseModel):
    """Maps an extracted field name to a database column name"""
    extracted_field: str = Field(description="Field name in extraction output")
    database_column: str = Field(description="Column name in the database")


class ToolRequirement(BaseModel):
    """Specifies a grounding tool requirement for extraction"""
    tool_name: Literal["google_maps", "google_search"] = Field(
        description="Name of the grounding tool"
    )
    usage_hint: str = Field(
        description="When and how the extraction agent should use this tool"
    )


class ExtractionConfig(BaseModel):
    """Frozen extraction configuration for a database"""
    extraction_prompt: str = Field(
        description="The exact prompt to use for all extractions"
    )
    output_schema: List[FieldSchema] = Field(
        description="Schema definition for each output field"
    )
    field_mappings: List[FieldMapping] = Field(
        description="Maps extracted field names to database column names"
    )
    classification_hints: List[str] = Field(
        description="Keywords that identify this content type for routing"
    )
    required_tools: List[ToolRequirement] = Field(
        default_factory=list,
        description="Grounding tools needed for accurate extraction"
    )

# ============================================
# Content Extraction Agent Schemas
# ============================================

# Note: Extraction output is dynamic based on the frozen config
# We validate against the stored output_schema at runtime

class ExtractionOutput(BaseModel):
    """Wrapper for dynamic extraction results"""
    data: Dict[str, Any] = Field(description="Extracted data matching the schema")
    confidence: float = Field(
        description="Overall confidence in extraction quality",
        ge=0.0,
        le=1.0
    )

# ============================================
# Critique Agent Schemas
# ============================================

class ValidationIssue(BaseModel):
    """A single validation issue found"""
    field: str = Field(description="Field name with the issue")
    issue: str = Field(description="Description of the problem")
    severity: Literal["critical", "warning"] = Field(
        description="Critical issues require retry, warnings are informational"
    )
    suggestion: str = Field(description="How to fix this issue")

class CritiqueOutput(BaseModel):
    """Output from Critique Agent"""
    valid: bool = Field(description="Whether the extraction is acceptable")
    issues: List[ValidationIssue] = Field(
        default_factory=list,
        description="List of validation issues found"
    )
    retry_guidance: Optional[str] = Field(
        default=None,
        description="Specific instructions for re-extraction if valid=false"
    )
    confidence_score: float = Field(
        description="Overall confidence in the extraction quality",
        ge=0.0,
        le=1.0
    )