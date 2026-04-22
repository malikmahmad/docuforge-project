import type { DocumentationType, ProjectDetails } from "../types";

const DOC_TYPE_MAP: Record<DocumentationType, string> = {
  "technical-spec": "technical-spec",
  "api-reference": "api-reference",
  sop: "sop",
  proposal: "product-requirements",
  runbook: "technical-spec",
  "user-manual": "user-manual",
};

type GenerateResponse = {
  content?: string;
  error?: string;
};

export async function generateDocumentation(
  details: ProjectDetails,
): Promise<string> {
  const payload = {
    title: details.title,
    description: details.description,
    scale: details.scale,
    structureMode: details.structureMode,
    docType: DOC_TYPE_MAP[details.documentationType],
    customHeadings: details.customHeadings,
    advancedRequirements: details.advancedPrompt,
    apiDetails: details.apiDetails,
  };

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as GenerateResponse;

    if (!response.ok) {
      throw new Error(
        data.error ||
          `Generation failed with status ${response.status}.`,
      );
    }

    if (!data.content?.trim()) {
      throw new Error("Generation completed but returned no content.");
    }

    return data.content.trim();
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      text.trim() || `Generation failed with status ${response.status}.`,
    );
  }

  if (!text.trim()) {
    throw new Error("Generation completed but returned no content.");
  }

  return text.trim();
}
