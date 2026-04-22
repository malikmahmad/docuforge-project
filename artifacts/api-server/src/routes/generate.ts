import { Router } from "express";

const router = Router();

type SupportedDocType =
  | "technical-spec"
  | "api-reference"
  | "user-manual"
  | "product-requirements"
  | "sop"
  | "custom";

type StructureMode = "strict" | "assistive";
type ProjectScale = "academic" | "startup" | "enterprise";

type GenerateBody = {
  title?: string;
  docType?: string;
  description?: string;
  scale?: string;
  structureMode?: string;
  customHeadings?: string;
  advancedRequirements?: string;
  apiDetails?: string;
};

type DocTypeConfig = {
  label: string;
  outcome: string;
  requiredSections: string[];
  requiredArtifacts: string[];
};

const DOC_TYPE_CONFIG: Record<SupportedDocType, DocTypeConfig> = {
  "technical-spec": {
    label: "Technical Specification",
    outcome:
      "an implementation-ready software specification for product, engineering, and stakeholders",
    requiredSections: [
      "Executive Summary",
      "Product Overview",
      "Users and Core Workflows",
      "Functional Requirements",
      "Non-Functional Requirements",
      "System Architecture",
      "Data Model",
      "API Design",
      "Security and Compliance",
      "Observability and Operations",
      "Testing Strategy",
      "Delivery Plan",
      "Risks, Assumptions, and Open Questions",
    ],
    requiredArtifacts: [
      "at least one requirements table",
      "at least one architecture or data-flow code block",
      "at least one risk/assumption/open-questions table",
    ],
  },
  "api-reference": {
    label: "API Reference",
    outcome: "a production-grade API reference for integrators and engineers",
    requiredSections: [
      "Overview",
      "Authentication",
      "Base URL and Versioning",
      "Core Resources",
      "Endpoints",
      "Request and Response Examples",
      "Error Handling",
      "Rate Limits",
      "Operational Notes",
    ],
    requiredArtifacts: [
      "endpoint tables",
      "request and response code samples",
      "error code reference table",
    ],
  },
  "user-manual": {
    label: "User Manual",
    outcome: "a complete end-user manual for onboarding and daily usage",
    requiredSections: [
      "Introduction",
      "Getting Started",
      "Navigation Overview",
      "Core Features",
      "Step-by-Step Workflows",
      "Troubleshooting",
      "FAQ",
      "Support",
    ],
    requiredArtifacts: [
      "step-by-step task lists",
      "tips or warnings where relevant",
      "troubleshooting table",
    ],
  },
  "product-requirements": {
    label: "Product Requirements Document",
    outcome: "a polished product requirements document for planning and delivery",
    requiredSections: [
      "Executive Summary",
      "Problem Statement",
      "Goals and Success Metrics",
      "Target Users",
      "User Stories",
      "Functional Requirements",
      "Non-Functional Requirements",
      "Dependencies and Risks",
      "Milestones",
      "Open Questions",
    ],
    requiredArtifacts: [
      "success metrics table",
      "requirements table",
      "timeline or milestone table",
    ],
  },
  sop: {
    label: "Standard Operating Procedure",
    outcome: "a practical SOP that teams can execute without ambiguity",
    requiredSections: [
      "Purpose",
      "Scope",
      "Roles and Responsibilities",
      "Prerequisites",
      "Procedure",
      "Quality Checks",
      "Exception Handling",
      "Escalation Path",
      "Records and Review",
    ],
    requiredArtifacts: [
      "responsibility table",
      "numbered procedure steps",
      "quality-check or escalation table",
    ],
  },
  custom: {
    label: "Documentation",
    outcome: "a professional documentation artifact tailored to the request",
    requiredSections: [
      "Overview",
      "Key Requirements",
      "Recommended Structure",
      "Implementation Notes",
      "Risks and Assumptions",
    ],
    requiredArtifacts: [
      "at least one table",
      "clear headings and subheadings",
      "domain-specific examples",
    ],
  },
};

const SCALE_GUIDANCE: Record<ProjectScale, string> = {
  academic:
    "Optimize for clarity, learning value, and well-explained assumptions. Keep the architecture realistic but not over-engineered.",
  startup:
    "Design for a practical MVP or near-term startup product: cost-aware infrastructure, lean team ownership, fast iteration, sensible security, and room to scale later.",
  enterprise:
    "Assume stricter security, governance, auditability, observability, and cross-team coordination. Include compliance, reliability, and operational maturity expectations.",
};

function normalizeDocType(value?: string): SupportedDocType {
  const normalized = (value ?? "technical-spec").trim().toLowerCase();

  if (normalized === "api-reference") return "api-reference";
  if (normalized === "user-manual") return "user-manual";
  if (normalized === "product-requirements") return "product-requirements";
  if (normalized === "sop") return "sop";
  if (normalized === "custom") return "custom";

  return "technical-spec";
}

function normalizeScale(value?: string): ProjectScale {
  const normalized = (value ?? "startup").trim().toLowerCase();

  if (normalized === "academic") return "academic";
  if (normalized === "enterprise" || normalized === "enterprise saas") {
    return "enterprise";
  }

  return "startup";
}

function normalizeStructureMode(value?: string): StructureMode {
  return value?.trim().toLowerCase() === "strict" ? "strict" : "assistive";
}

function parseCustomHeadings(value?: string): string[] {
  return (value ?? "")
    .split(/[\n,]/)
    .map((heading) => heading.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function buildSectionInstructions(
  docType: SupportedDocType,
  structureMode: StructureMode,
  customHeadings: string[],
): string {
  if (customHeadings.length > 0) {
    return [
      "TOP-LEVEL HEADING RULES:",
      '- Start with `# <Project Title>`.',
      "- Use the user's custom headings as the exact top-level `## 1. ...`, `## 2. ...` sections in the same order.",
      "- Do not invent alternative top-level sections before or between those custom sections.",
      structureMode === "strict"
        ? "- In strict mode, do not add extra top-level sections beyond the requested custom headings."
        : "- In assistive mode, you may append one final `## Suggested Additional Sections` block after the requested sections if important coverage is missing.",
      "",
      "CUSTOM HEADINGS:",
      ...customHeadings.map((heading, index) => `${index + 1}. ${heading}`),
    ].join("\n");
  }

  const config = DOC_TYPE_CONFIG[docType];

  return [
    "TOP-LEVEL HEADING RULES:",
    '- Start with `# <Project Title>`.',
    "- Use numbered H2 headings in this order:",
    ...config.requiredSections.map(
      (section, index) => `  - ## ${index + 1}. ${section}`,
    ),
    structureMode === "assistive"
      ? "- Because structure mode is assistive, you may append a final `## Suggested Additional Sections` block only if it materially improves the document."
      : "- Because structure mode is strict, do not add extra top-level sections beyond the required list.",
  ].join("\n");
}

function buildSystemPrompt(): string {
  return `You are DocuForge, a principal technical writer, product thinker, and solutions architect.

Your job is to turn a short software idea into documentation that feels like it was prepared by an experienced senior team for real implementation.

Non-negotiable standards:
- Output only polished Markdown.
- Never use filler, placeholders, or generic repeated advice.
- Every section must contain domain-specific, concrete, useful content.
- When the user input is brief, infer realistic product details from the title and description, but make those assumptions sound plausible and internally consistent.
- Prefer specifics over vagueness: real user roles, workflows, entities, APIs, constraints, security concerns, deployment choices, and testing approaches.
- If something must be assumed, state it clearly in an assumptions/open questions section rather than writing bland generic text.
- Use tables where they add clarity.
- Use fenced code blocks for architecture, data flow, JSON examples, or sample APIs where appropriate.
- Keep the tone professional, crisp, and implementation-oriented.
- Avoid marketing fluff and avoid mentioning that you are an AI.`;
}

function buildUserPrompt(input: {
  title: string;
  description: string;
  docType: SupportedDocType;
  scale: ProjectScale;
  structureMode: StructureMode;
  customHeadings: string[];
  advancedRequirements?: string;
  apiDetails?: string;
}): string {
  const config = DOC_TYPE_CONFIG[input.docType];

  return `Create ${config.outcome} for the following software project.

PROJECT TITLE:
${input.title}

PROJECT DESCRIPTION:
${input.description}

PROJECT SCALE:
${input.scale}

SCALE GUIDANCE:
${SCALE_GUIDANCE[input.scale]}

DOCUMENT TYPE:
${config.label}

STRUCTURE MODE:
${input.structureMode}

DOCUMENT QUALITY TARGET:
- The final document should be strong enough that a product manager, engineer, or founder could use it to align implementation.
- It must read as if written specifically for this project, not as a template.
- It must be materially better than a placeholder draft.

REQUIRED ARTIFACTS:
${config.requiredArtifacts.map((item) => `- ${item}`).join("\n")}

${buildSectionInstructions(
  input.docType,
  input.structureMode,
  input.customHeadings,
)}

OPTIONAL USER-SUPPLIED CUSTOM HEADINGS:
${input.customHeadings.length > 0 ? input.customHeadings.join("\n") : "None"}

ADDITIONAL REQUIREMENTS:
${input.advancedRequirements?.trim() || "None provided."}

API / TECHNICAL DETAILS:
${input.apiDetails?.trim() || "None provided."}

WRITING RULES:
- Start immediately with the document content.
- Begin with \`# ${input.title}\`.
- Use professional section depth with meaningful subsections where useful.
- For technical specs and product docs, include concrete product flows, entities, data fields, edge cases, and engineering decisions.
- For app ideas like expense trackers, infer the obvious domain objects and workflows instead of staying generic.
- Include at least one table and any helpful diagrams or JSON/API examples.
- Do a silent quality pass before finalizing: remove generic repeated bullets, replace weak statements with specific content, and ensure the whole document is coherent.`;
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof (item as { text?: unknown }).text === "string"
        ) {
          return (item as { text: string }).text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

function generateTemplateDoc(input: {
  title: string;
  description: string;
  docType: SupportedDocType;
  scale: ProjectScale;
  customHeadings: string[];
  advancedRequirements?: string;
  apiDetails?: string;
}): string {
  const config = DOC_TYPE_CONFIG[input.docType];
  const sections: string[] = [];

  sections.push(`# ${input.title}\n`);
  sections.push(`## Executive Summary\n`);
  sections.push(`${input.description}\n`);
  sections.push(`**Project Scale:** ${input.scale}\n`);
  sections.push(`**Document Type:** ${config.label}\n`);

  const headings = input.customHeadings.length > 0 ? input.customHeadings : config.requiredSections;

  headings.forEach((heading, index) => {
    sections.push(`\n## ${index + 1}. ${heading}\n`);
    
    if (heading.toLowerCase().includes("overview") || heading.toLowerCase().includes("introduction")) {
      sections.push(`This section provides an overview of ${input.title}.\n`);
      sections.push(`\n${input.description}\n`);
    } else if (heading.toLowerCase().includes("requirement")) {
      sections.push(`### Functional Requirements\n`);
      sections.push(`| ID | Requirement | Priority | Status |\n`);
      sections.push(`|----|-------------|----------|--------|\n`);
      sections.push(`| FR-001 | Core functionality for ${input.title} | High | Planned |\n`);
      sections.push(`| FR-002 | User authentication and authorization | High | Planned |\n`);
      sections.push(`| FR-003 | Data management and storage | Medium | Planned |\n`);
    } else if (heading.toLowerCase().includes("architecture")) {
      sections.push(`### System Architecture\n`);
      sections.push(`\`\`\`\n`);
      sections.push(`┌─────────────┐     ┌──────────────┐     ┌─────────────┐\n`);
      sections.push(`│   Client    │────▶│  API Server  │────▶│  Database   │\n`);
      sections.push(`│  (Frontend) │     │   (Backend)  │     │   (Storage) │\n`);
      sections.push(`└─────────────┘     └──────────────┘     └─────────────┘\n`);
      sections.push(`\`\`\`\n`);
    } else if (heading.toLowerCase().includes("api")) {
      sections.push(`### API Endpoints\n`);
      sections.push(`| Method | Endpoint | Description | Auth Required |\n`);
      sections.push(`|--------|----------|-------------|---------------|\n`);
      sections.push(`| GET | /api/items | Retrieve all items | Yes |\n`);
      sections.push(`| POST | /api/items | Create new item | Yes |\n`);
      sections.push(`| PUT | /api/items/:id | Update item | Yes |\n`);
      sections.push(`| DELETE | /api/items/:id | Delete item | Yes |\n`);
      if (input.apiDetails) {
        sections.push(`\n**Additional API Details:**\n${input.apiDetails}\n`);
      }
    } else if (heading.toLowerCase().includes("security")) {
      sections.push(`### Security Measures\n`);
      sections.push(`- **Authentication:** JWT-based authentication\n`);
      sections.push(`- **Authorization:** Role-based access control (RBAC)\n`);
      sections.push(`- **Data Encryption:** TLS 1.3 for data in transit, AES-256 for data at rest\n`);
      sections.push(`- **Input Validation:** Server-side validation for all user inputs\n`);
    } else if (heading.toLowerCase().includes("test")) {
      sections.push(`### Testing Strategy\n`);
      sections.push(`| Test Type | Coverage | Tools | Status |\n`);
      sections.push(`|-----------|----------|-------|--------|\n`);
      sections.push(`| Unit Tests | 80%+ | Jest, Vitest | Planned |\n`);
      sections.push(`| Integration Tests | 70%+ | Supertest | Planned |\n`);
      sections.push(`| E2E Tests | Critical paths | Playwright | Planned |\n`);
    } else if (heading.toLowerCase().includes("risk")) {
      sections.push(`### Risks and Assumptions\n`);
      sections.push(`| Risk | Impact | Probability | Mitigation |\n`);
      sections.push(`|------|--------|-------------|------------|\n`);
      sections.push(`| Technical complexity | High | Medium | Phased implementation |\n`);
      sections.push(`| Resource constraints | Medium | Low | Prioritize core features |\n`);
      sections.push(`| Timeline delays | Medium | Medium | Buffer time in schedule |\n`);
    } else {
      sections.push(`This section covers ${heading.toLowerCase()} for ${input.title}.\n`);
      sections.push(`\nKey points:\n`);
      sections.push(`- Detailed implementation of ${heading.toLowerCase()}\n`);
      sections.push(`- Best practices and standards\n`);
      sections.push(`- Integration with other components\n`);
    }
  });

  if (input.advancedRequirements) {
    sections.push(`\n## Additional Requirements\n`);
    sections.push(`${input.advancedRequirements}\n`);
  }

  sections.push(`\n## Conclusion\n`);
  sections.push(`This document provides a comprehensive ${config.label.toLowerCase()} for ${input.title}. `);
  sections.push(`It serves as a foundation for implementation and can be refined as the project evolves.\n`);

  return sections.join("");
}

router.post("/generate", async (req, res) => {
  try {
    const body = (req.body ?? {}) as GenerateBody;
    const title = body.title?.trim();
    const description = body.description?.trim();

    if (!title || !description) {
      res.status(400).json({ error: "title and description are required" });
      return;
    }

    const docType = normalizeDocType(body.docType);
    const scale = normalizeScale(body.scale);
    const customHeadings = parseCustomHeadings(body.customHeadings);

    const content = generateTemplateDoc({
      title,
      description,
      docType,
      scale,
      customHeadings,
      advancedRequirements: body.advancedRequirements,
      apiDetails: body.apiDetails,
    });

    res.json({ content });
  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({
      error: "Documentation generation failed. Please try again.",
    });
  }
});

export default router;
