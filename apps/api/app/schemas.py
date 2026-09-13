from typing import Literal
from pydantic import BaseModel, Field

DocumentType = Literal[
    "resume", "research_paper", "academic_report", "project_report",
    "technical_documentation", "business_proposal", "presentation",
    "cover_letter", "statement_of_purpose", "general_document",
]


class Section(BaseModel):
    id: str
    title: str
    level: int = Field(ge=1, le=6)
    order: int = Field(ge=1)
    start_page: int = Field(ge=1)
    content_preview: str = ""


class Issue(BaseModel):
    id: str
    category: Literal["missing_section", "ordering", "content_quality", "duplicate", "parse"]
    severity: Literal["critical", "high", "medium", "low"]
    explanation: str
    evidence: list[str]
    recommendation: str
    confidence: float = Field(ge=0, le=1)
    affected_section: str | None = None


class Scores(BaseModel):
    overall: int = Field(ge=0, le=100)
    completeness: int = Field(ge=0, le=100)
    structure: int = Field(ge=0, le=100)
    content_quality: int = Field(ge=0, le=100)
    compliance: int = Field(ge=0, le=100)


class Report(BaseModel):
    document_id: str
    filename: str
    document_type: DocumentType
    confidence: float = Field(ge=0, le=1)
    title: str
    pages: int = Field(ge=0)
    sections: list[Section]
    missing_sections: list[str]
    ordering_issues: list[Issue]
    content_issues: list[Issue]
    recommendations: list[str]
    restructured_outline: list[str]
    scores: Scores
    processing: dict[str, list[str]]

