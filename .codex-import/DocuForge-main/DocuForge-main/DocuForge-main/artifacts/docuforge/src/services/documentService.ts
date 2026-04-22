import type { ProjectDetails } from "../types";

export async function generateDocumentation(details: ProjectDetails): Promise<string> {
  const apiBase = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const url = `${apiBase}/api/generate`.replace("//api", "/api");

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Generation failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { content: string; source: string };
  if (!data.content) throw new Error("No content returned from server.");
  return data.content;
}
