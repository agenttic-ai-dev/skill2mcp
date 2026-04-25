export type ParseMode = "strict" | "tolerant";

export interface SkillMeta {
  name: string;
  version?: string;
  description: string;
  tags: string[];
}

export interface SkillParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

export interface SkillExample {
  input?: string;
  output?: string;
  description?: string;
}

export interface SkillDocument {
  path: string;
  meta: SkillMeta;
  parameters: SkillParameter[];
  examples: SkillExample[];
  triggers: string[];
  notes: string;
  raw: string;
}

export type DiagnosticLevel = "error" | "warning";

export interface ParseDiagnostic {
  level: DiagnosticLevel;
  code: string;
  message: string;
  file: string;
  section?: string;
  hint?: string;
}

export interface ParseResult {
  document: SkillDocument;
  diagnostics: ParseDiagnostic[];
}
