export type ProjectScale = "academic" | "startup" | "enterprise";
export type StructureMode = "strict" | "assistive";
export type DocumentationType = "technical-spec" | "api-reference" | "sop" | "proposal" | "runbook" | "user-manual";

export interface ProjectDetails {
  title: string;
  description: string;
  scale: ProjectScale;
  structureMode: StructureMode;
  documentationType: DocumentationType;
  customHeadings?: string;
  advancedPrompt?: string;
  apiDetails?: string;
  pageLimit?: number;
}
