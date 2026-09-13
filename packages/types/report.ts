export type DocumentType =
  | "resume"
  | "research_paper"
  | "academic_report"
  | "project_report"
  | "technical_documentation"
  | "business_proposal"
  | "presentation"
  | "cover_letter"
  | "statement_of_purpose"
  | "general_document";

export type Severity = "critical" | "high" | "medium" | "low";

export interface Section {
  id: string;
  title: string;
  level: number;
  order: number;
  start_page: number;
  content_preview: string;
}

export interface Issue {
  id: string;
  category: "missing_section" | "ordering" | "content_quality" | "duplicate" | "parse";
  severity: Severity;
  explanation: string;
  evidence: string[];
  recommendation: string;
  confidence: number;
  affected_section?: string;
}

export interface Report {
  document_id: string;
  filename: string;
  document_type: DocumentType;
  confidence: number;
  title: string;
  pages: number;
  sections: Section[];
  missing_sections: string[];
  ordering_issues: Issue[];
  content_issues: Issue[];
  recommendations: string[];
  restructured_outline: string[];
  scores: {
    overall: number;
    completeness: number;
    structure: number;
    content_quality: number;
    compliance: number;
  };
  processing: {
    stages: string[];
    warnings: string[];
  };
}

