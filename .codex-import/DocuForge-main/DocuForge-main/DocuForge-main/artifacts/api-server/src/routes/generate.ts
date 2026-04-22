import { Router, type IRouter } from "express";
import { generateGeminiWithFallback } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

interface GenerateBody {
  title?: string;
  description?: string;
  scale?: "academic" | "startup" | "enterprise";
  structureMode?: "strict" | "assistive";
  documentationType?: "technical-spec" | "api-reference" | "sop" | "proposal" | "runbook" | "user-manual";
  customHeadings?: string;
  advancedPrompt?: string;
  apiDetails?: string;
}

type DocumentationType = NonNullable<GenerateBody["documentationType"]>;

interface DocumentBlueprint {
  label: string;
  minimumWords: number;
  sections: string[];
}

function normalizeDocumentationType(value: string | undefined): DocumentationType {
  const normalized = (value || "technical-spec").trim().toLowerCase();
  if (normalized === "api-reference") return "api-reference";
  if (normalized === "sop") return "sop";
  if (normalized === "proposal") return "proposal";
  if (normalized === "runbook") return "runbook";
  if (normalized === "user-manual") return "user-manual";
  return "technical-spec";
}

function getDocumentBlueprint(docType: DocumentationType): DocumentBlueprint {
  const map: Record<DocumentationType, DocumentBlueprint> = {
    "technical-spec": {
      label: "Technical Specification (SRS/PRD)",
      minimumWords: 2500,
      sections: [
        "Executive Summary",
        "Project Overview",
        "Problem Statement",
        "Proposed Solution",
        "System Requirements",
        "Technology Stack",
        "System Architecture",
        "Data Flow",
        "Database Design",
        "API Design",
        "Implementation Methodology",
        "Testing Strategy",
        "Deployment Architecture",
        "Risk Assessment",
        "Performance & Scalability",
        "Monitoring & Logging",
        "Backup & Recovery Strategy",
        "Security & Compliance",
        "Future Roadmap",
        "Conclusion",
      ],
    },
    "api-reference": {
      label: "API Reference",
      minimumWords: 1600,
      sections: [
        "Overview",
        "Authentication",
        "Base URL and Versioning",
        "Rate Limits and Quotas",
        "Error Model",
        "Core Resources",
        "Endpoints",
        "Request and Response Examples",
        "Pagination and Filtering",
        "Webhooks and Events",
        "SDK Usage",
        "Operational Notes",
      ],
    },
    sop: {
      label: "Standard Operating Procedure",
      minimumWords: 1400,
      sections: [
        "Purpose",
        "Scope",
        "Roles and Responsibilities",
        "Prerequisites",
        "Safety and Compliance",
        "Step-by-Step Procedure",
        "Quality Checks",
        "Exception Handling",
        "Escalation Matrix",
        "Documentation and Records",
        "Review Cadence",
        "Appendix",
      ],
    },
    proposal: {
      label: "Project Proposal",
      minimumWords: 1400,
      sections: [
        "Executive Summary",
        "Business Context",
        "Objectives",
        "Proposed Approach",
        "Scope and Deliverables",
        "Timeline and Milestones",
        "Team and Governance",
        "Budget Estimate",
        "Risk and Mitigation",
        "Success Metrics",
        "Assumptions",
        "Approval Request",
      ],
    },
    runbook: {
      label: "Operational Runbook",
      minimumWords: 1300,
      sections: [
        "Service Overview",
        "Architecture Snapshot",
        "Access Requirements",
        "Daily Operations",
        "Alert Triage",
        "Incident Response",
        "Recovery Procedures",
        "Maintenance Tasks",
        "On-call Handover",
        "KPIs and SLOs",
        "Known Issues",
        "Appendix",
      ],
    },
    "user-manual": {
      label: "User Manual",
      minimumWords: 1400,
      sections: [
        "Introduction",
        "Getting Started",
        "Navigation Overview",
        "Core Features",
        "Step-by-Step Workflows",
        "Settings and Configuration",
        "Troubleshooting",
        "FAQs",
        "Best Practices",
        "Security Tips",
        "Glossary",
        "Support",
      ],
    },
  };
  return map[docType];
}

function normalizeGeneratedMarkdown(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
  }
  return cleaned.replace(/\r\n/g, "\n");
}

function isHighQualityMarkdown(text: string, sectionCount: number, minimumWords: number): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const topLevelSections = (text.match(/^##\s+\d+\.\s+/gm) ?? []).length;
  const hasPlaceholder = /(\bTBD\b|to be determined|lorem ipsum|\[insert|leave empty)/i.test(text);
  const hasTable = /\|\s*[^|]+\s*\|\s*[^|]+\s*\|/.test(text);
  const hasCodeBlock = /```[\s\S]*?```/.test(text);
  return words >= minimumWords && topLevelSections >= Math.max(6, Math.floor(sectionCount * 0.6)) && !hasPlaceholder && (hasTable || hasCodeBlock);
}

function sanitizeCustomHeadings(value: string): string[] {
  const bannedPatterns = [
    /leave empty/i,
    /full\s+\d+\s*[- ]?section/i,
    /custom headings/i,
    /suggested additional sections/i,
    /assistive mode/i,
    /do not/i,
    /generate\s+documentation/i,
    /enter\s+custom/i,
    /optional/i,
  ];

  return value
    .split(/[\n,]/)
    .map((heading) => heading.trim())
    .map((heading) => heading.replace(/^[\d.\-*)\s]+/, "").replace(/^[-*]\s*/, "").trim())
    .map((heading) => heading.replace(/^['\"]|['\"]$/g, "").trim())
    .filter((heading) => heading.length > 0)
    .filter((heading) => heading.length <= 80)
    .filter((heading) => heading.split(/\s+/).length <= 12)
    .filter((heading) => !bannedPatterns.some((pattern) => pattern.test(heading)));
}

function buildPrompt(d: Required<GenerateBody>): string {
  const customHeadings = sanitizeCustomHeadings(d.customHeadings);
  const docType = normalizeDocumentationType(d.documentationType);
  const blueprint = getDocumentBlueprint(docType);
  let modeInstruction = "";
  if (customHeadings.length > 0) {
    modeInstruction = `
IMPORTANT MODE LOGIC (CUSTOM HEADINGS DETECTED):
The user has provided custom headings:
${customHeadings.map((heading, index) => `${index + 1}. ${heading}`).join("\n")}

- Generate documentation ONLY for the provided headings.
- Do NOT add extra sections.
- Do NOT insert default template sections.
- Respect exact heading names.
- Maintain proper numbering hierarchy (1, 1.1, 1.1.1).
- If user gives N headings, generate exactly N sections.
- VALIDATION: Recheck that number of generated headings = number of user headings.

Structure Mode: ${d.structureMode}
${d.structureMode === "strict" ? "STRICT: No extra content or suggestions allowed." : "ASSISTIVE: Suggest optional missing sections at the end separately under a clearly marked '## Suggested Additional Sections' block, but do not auto-insert into the main numbered structure."}
`;
  } else {
    modeInstruction = `
MODE: AUTOMATIC ENTERPRISE STRUCTURE
Generate the full ${blueprint.sections.length}-section ${blueprint.label} structure listed below. Do not skip any section. Each section must contain real, implementable content with concrete numbers, specific technologies, and practical examples — no placeholders.
`;
  }

  const sectionScaffold = blueprint.sections
    .map((section, idx) => `## ${idx + 1}. ${section}`)
    .join("\n");

  return `You are a Senior Software Architect and Technical Writer. Your task is to generate a complete, professional, industry-standard ${blueprint.label} for the project described below.

CRITICAL RULES:
- Output MUST be clean GitHub-Flavored Markdown.
- Do NOT leave any section empty.
- Do NOT use vague filler. Every paragraph must include concrete details (specific tools, version numbers, metrics, latencies, RPO/RTO, throughput, etc.).
- Use proper Markdown tables (with header row and separator row) wherever tabular data is appropriate.
- Use hierarchical numbering inside section bodies (1.1, 1.1.1) where helpful.
- Use fenced code blocks for ASCII diagrams, JSON examples, SQL, and API request/response samples.
- Professional, corporate tone aimed at CTOs, senior engineers, and investors.
- Zero placeholders: never use "TBD", "To be determined", "Lorem ipsum", or "[insert ...]".
- The total document should be substantial — aim for at least ${blueprint.minimumWords}-${blueprint.minimumWords + 1600} words of real content.

DOCUMENT TYPE:
- Requested type: ${docType}
- Canonical format: ${blueprint.label}

MANDATORY DOCUMENT STRUCTURE (use these EXACT top-level "## N. Title" headings, in this order, unless custom headings are provided):

# ${d.title}

(Cover page metadata block: Project Name, Version 1.0.0, Prepared By: DocuForge Enterprise Engine, Date, Document ID, Confidentiality Notice. Render as bold "**Field:** value" lines.)

## Revision History
(Markdown table: Version | Date | Description | Author)

## Table of Contents
(Numbered list of all sections below.)

${sectionScaffold}

${modeInstruction}

USER INPUT:
- Project Title: ${d.title}
- Project Scale: ${d.scale}
- Project Description / Purpose: ${d.description}
- Advanced Requirements: ${d.advancedPrompt || "None provided — infer reasonable enterprise-grade requirements from the description."}
- API / Technical Details: ${d.apiDetails || "None provided — design a reasonable RESTful API surface that fits the description."}

OUTPUT REQUIREMENTS:
- Pure Markdown only. Do NOT wrap the entire response in a single code block.
- Do NOT include any conversational text before or after the document.
- Begin the response directly with the "# ${d.title}" cover heading.`;
}

function inferModules(d: Required<GenerateBody>): string[] {
  const fromApiDetails = (d.apiDetails || "")
    .replace(/^modules\s*:\s*/i, "")
    .split(/[,\n]/)
    .map((m) => m.trim())
    .filter(Boolean);

  if (fromApiDetails.length > 0) {
    return fromApiDetails.slice(0, 12);
  }

  const text = `${d.title} ${d.description}`.toLowerCase();

  if (/hospital|patient|clinical|opd|ipd|doctor|pharmacy|lab|insurance/.test(text)) {
    return [
      "Patient Registration",
      "Appointment Scheduling",
      "OPD Workflow",
      "IPD Management",
      "Lab Reporting",
      "Pharmacy Billing",
      "Insurance Claims",
      "Doctor Dashboard",
    ];
  }

  if (/logistics|shipment|warehouse|carrier|route|freight|customs/.test(text)) {
    return [
      "Shipment Booking",
      "Route Optimization",
      "Carrier Assignment",
      "Customs Documentation",
      "Warehouse Inventory Sync",
      "Invoice Processing",
      "Live Tracking",
      "Customer Portal",
    ];
  }

  return [
    "Authentication",
    "Core Workflow",
    "Reporting",
    "Billing",
    "Notifications",
    "Admin Console",
    "Audit Logging",
    "Analytics",
  ];
}

function slugifySegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildNonTechnicalSectionContent(
  docType: DocumentationType,
  section: string,
  index: number,
  d: Required<GenerateBody>,
  modules: string[],
  topEndpoints: string,
): string {
  const sectionNumber = index + 1;
  const commonIntro = `## ${sectionNumber}. ${section}\n`;
  const scopeLine = `Context: ${d.title} (${d.scale}) - ${d.description}\n\n`;

  if (docType === "sop") {
    if (section === "Roles and Responsibilities") {
      return `${commonIntro}${scopeLine}| Role | Responsibility | Coverage |\n|---|---|---|\n| Incident Commander | Owns incident lifecycle and decisions | 24x7 on-call |\n| Communications Lead | Stakeholder updates and status page | Business hours + escalation |\n| Service Owner | Technical diagnosis and recovery | Domain-specific |\n| Scribe | Timeline capture and postmortem notes | During active incidents |\n\n`;
    }
    if (section === "Step-by-Step Procedure") {
      return `${commonIntro}${scopeLine}1. Detect incident via monitoring alert, user report, or synthetic check failure.\n2. Assign Incident Commander and classify severity (SEV-1 to SEV-4) within 5 minutes.\n3. Start incident bridge, assign resolver and comms owner, and capture timeline.\n4. Contain blast radius (feature flag disable, traffic drain, rollback, or circuit break).\n5. Validate service health against SLOs and confirm customer impact reduction.\n6. Publish status update every 15 minutes for SEV-1/SEV-2 incidents.\n7. Close incident only after recovery validation and owner sign-off.\n\n`;
    }
    if (section === "Escalation Matrix") {
      return `${commonIntro}${scopeLine}| Severity | Trigger | Initial Response | Escalation Target | Update Cadence |\n|---|---|---|---|---|\n| SEV-1 | Full outage, data loss risk | <= 5 min | Incident Commander + Engineering Director | Every 15 min |\n| SEV-2 | Major degradation | <= 10 min | Service Owner + Team Lead | Every 30 min |\n| SEV-3 | Partial feature issue | <= 30 min | Module Owner | Every 60 min |\n| SEV-4 | Minor non-critical issue | <= 1 business day | Backlog triage | Daily summary |\n\n`;
    }
  }

  if (docType === "api-reference") {
    if (section === "Endpoints") {
      return `${commonIntro}${scopeLine}| Method | Endpoint | Description |\n|---|---|---|\n${topEndpoints}\n\n`;
    }
    if (section === "Error Model") {
      return `${commonIntro}${scopeLine}| HTTP Code | Meaning | Client Action |\n|---|---|---|\n| 400 | Validation failed | Correct payload and retry |\n| 401 | Unauthorized | Refresh token / re-authenticate |\n| 403 | Forbidden | Verify role and tenant scope |\n| 404 | Resource not found | Validate ID and endpoint path |\n| 429 | Rate limit exceeded | Exponential backoff and retry |\n| 500 | Internal error | Retry with correlation ID and alert support |\n\n`;
    }
  }

  if (docType === "proposal") {
    if (section === "Budget Estimate") {
      return `${commonIntro}${scopeLine}| Cost Area | Monthly Estimate | Assumption |\n|---|---|---|\n| Cloud Infrastructure | USD 18,000 | Multi-region production workload |\n| Observability Stack | USD 3,500 | Logs, metrics, traces retention |\n| Security Tooling | USD 2,800 | SAST/DAST + secret scanning |\n| Delivery Team | USD 95,000 | 7-9 person cross-functional squad |\n\n`;
    }
  }

  if (docType === "runbook" && section === "KPIs and SLOs") {
    return `${commonIntro}${scopeLine}| KPI/SLO | Target | Alert Threshold |\n|---|---|---|\n| Availability | >= 99.95% monthly | burn rate > 2x for 30m |\n| P95 Latency | <= 300 ms | > 450 ms for 10m |\n| Error Rate | < 1.0% | > 2.0% for 5m |\n| MTTR | <= 45 min for SEV-2 | > 60 min active incident |\n\n`;
  }

  if (docType === "user-manual" && section === "Step-by-Step Workflows") {
    const sampleModules = modules.slice(0, 4).map((m, i) => `${i + 1}. ${m}: open module, complete required fields, validate, and submit.`).join("\n");
    return `${commonIntro}${scopeLine}${sampleModules}\n\n`; 
  }

  return `${commonIntro}${scopeLine}- Scope owner: Product + Engineering leadership\n- Expected deliverable: Approved, review-ready artifact\n- Acceptance criteria: Measurable quality checks and stakeholder sign-off\n\n`;
}

function templateFallback(d: Required<GenerateBody>): string {
  const date = new Date().toLocaleDateString();
  const docId = "DF-" + Math.random().toString(36).slice(2, 9).toUpperCase();
  const customHeadings = sanitizeCustomHeadings(d.customHeadings);
  const docType = normalizeDocumentationType(d.documentationType);
  const blueprint = getDocumentBlueprint(docType);
  const modules = inferModules(d);
  const functionalRows = modules.slice(0, 6).map((module, index) => {
    const id = `FR-${String(index + 1).padStart(2, "0")}`;
    return `| ${id} | ${module} | End-to-end implementation of ${module.toLowerCase()} with validation, auditability, and role-based access control. | High |\n`;
  }).join("");
  const topEndpoints = modules.slice(0, 5).map((module) => {
    const seg = slugifySegment(module);
    return [
      `| GET | /api/${seg} | List ${module.toLowerCase()} records |`,
      `| POST | /api/${seg} | Create ${module.toLowerCase()} record |`,
    ].join("\n");
  }).join("\n");
  const descriptionSample = d.description.replace(/"/g, '\\"').slice(0, 240);

  let out = "";
  out += `# ${d.title}\n\n`;
  out += `**Project Name:** ${d.title}  \n`;
  out += `**Version:** 1.0.0  \n`;
  out += `**Prepared By:** DocuForge Enterprise Engine  \n`;
  out += `**Date:** ${date}  \n`;
  out += `**Document ID:** ${docId}  \n`;
  out += `**Project Scale:** ${d.scale}  \n\n`;
  out += `**Confidentiality Notice:** This document contains proprietary and confidential information.\n\n---\n\n`;

  if (customHeadings.length > 0) {
    const headings = customHeadings;
    out += `## Table of Contents\n`;
    headings.forEach((h, i) => (out += `${i + 1}. ${h}  \n`));
    out += `\n---\n\n`;
    headings.forEach((h, i) => {
      out += `## ${i + 1}. ${h}\n\n`;
      out += `Detailed specification for **${h}** in the context of the ${d.scale}-scale project "${d.title}". `;
      out += `${d.description}\n\n`;
      out += `Key considerations for this section include scope, owners, deliverables, acceptance criteria, dependencies, and measurable outcomes.\n\n`;
    });
    if (d.structureMode === "assistive") {
      out += `---\n\n## Suggested Additional Sections (Assistive Mode)\n- Risk Assessment\n- Future Roadmap\n- Appendix\n`;
    }
    return out;
  }

  out += `## Revision History\n| Version | Date | Description | Author |\n|---|---|---|---|\n| 1.0.0 | ${date} | Initial draft | DocuForge |\n\n`;
  out += `## Table of Contents\n`;
  blueprint.sections.forEach((section, i) => {
    out += `${i + 1}. ${section}\n`;
  });
  out += `\n---\n\n`;

  if (docType !== "technical-spec") {
    blueprint.sections.forEach((section, idx) => {
      out += buildNonTechnicalSectionContent(docType, section, idx, d, modules, topEndpoints);
    });
    return out;
  }

  out += `## 1. Executive Summary\nThe **${d.title}** initiative establishes a high-performance, ${d.scale}-grade platform addressing the documented problem space. ${d.description}\n\nThis specification serves as the canonical technical blueprint for stakeholders, engineering leadership, and implementation teams.\n\n`;
  out += `## 2. Project Overview\nThe system delivers a robust solution targeting the ${d.scale} segment, focusing on reliability, security, observability, and operational excellence. Stakeholders include product owners, engineering teams, SRE, security, and end users.\n\n`;
  if (d.advancedPrompt.trim()) {
    out += `### 2.1 Advanced Requirements\n${d.advancedPrompt.trim()}\n\n`;
  }
  out += `### 2.2 Core Business Modules\n`;
  modules.forEach((m) => {
    out += `- ${m}\n`;
  });
  out += `\n`;
  out += `## 3. Problem Statement\nCurrent workflows are fragmented, manually intensive, and lack consistency. This results in slower delivery cycles, increased technical debt, and higher operational risk.\n\n`;
  out += `## 4. Proposed Solution\nA modern cloud-native, API-first solution with a clear separation between presentation, application, and data layers. The platform standardises core flows while exposing extension points for domain-specific behaviour.\n\n`;
  out += `## 5. System Requirements\n### 5.1 Functional Requirements\n| ID | Requirement | Description | Priority |\n|---|---|---|---|\n`;
  out += functionalRows;
  out += `\n### 5.2 Non-Functional Requirements\n- **Security:** TLS 1.3 in transit, AES-256 at rest, RBAC with least-privilege roles, encrypted PII/PHI fields, and immutable audit logs.\n- **Performance:** P95 API latency < 300 ms; sustained 500 RPS per node with horizontal scaling.\n- **SLA:** 99.95% monthly uptime, error budget < 0.05%, automated failover for critical services.\n- **Rate Limiting:** Token-bucket, 120 req/min per user, 1000 req/min per tenant, burst allowance of 2x for 60s.\n\n`;
  out += `## 6. Technology Stack\n| Layer | Technology | Justification |\n|---|---|---|\n| Frontend | React 19 + Vite + Tailwind | Mature, fast HMR, broad talent pool |\n| Backend | Node.js 24 + Express 5 | High concurrency, ecosystem maturity |\n| Database | PostgreSQL 16 | ACID, JSONB, mature ecosystem |\n| AI | Google Gemini | Strong technical reasoning |\n| Cache | Redis 7 | Sub-ms reads, pub/sub |\n| Infra | Docker + Kubernetes | Portable, declarative orchestration |\n\n`;
  out += `## 7. System Architecture\nA decoupled three-tier architecture ensuring independent scalability of presentation, application, and data layers.\n\n\`\`\`text\n[ Browser / Client ]\n        |\n        v\n[ CDN + WAF ] -> [ API Gateway ] -> [ Application Services ]\n                                          |        |        |\n                                          v        v        v\n                                     [ Cache ] [ DB ] [ Object Store ]\n\`\`\`\n\n`;
  out += `## 8. Data Flow\n1. Client submits a request through the CDN.\n2. API gateway authenticates and rate-limits.\n3. Application service validates input, calls domain logic.\n4. Cache is consulted; on miss, database is queried.\n5. Response is rendered, logged, and returned to the client.\n\n`;
  out += `## 9. Database Design\n**Tenants**\n| Field | Type | Constraints | Description |\n|---|---|---|---|\n| id | UUID | PK | Tenant identifier |\n| name | VARCHAR(200) | NOT NULL | Tenant name |\n| region | VARCHAR(100) | NOT NULL | Primary region |\n| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |\n\n**Users**\n| Field | Type | Constraints | Description |\n|---|---|---|---|\n| id | UUID | PK | Unique identifier |\n| tenant_id | UUID | FK -> tenants.id | Tenant scope |\n| email | VARCHAR(255) | UNIQUE NOT NULL | Login email |\n| role | VARCHAR(80) | NOT NULL | Access role |\n| created_at | TIMESTAMPTZ | DEFAULT now() | Registration time |\n\n**Core Records**\n| Field | Type | Constraints | Description |\n|---|---|---|---|\n| id | UUID | PK | Unique identifier |\n| tenant_id | UUID | FK -> tenants.id | Tenant ownership |\n| module | VARCHAR(100) | NOT NULL | Business module (e.g., ${modules[0] ?? "core"}) |\n| payload | JSONB | NOT NULL | Structured domain data |\n| status | VARCHAR(40) | NOT NULL | Record lifecycle state |\n| created_at | TIMESTAMPTZ | DEFAULT now() | Creation time |\n\n`;
  out += `## 10. API Design\n| Method | Endpoint | Description |\n|---|---|---|\n${topEndpoints}\n\n\`\`\`json\nPOST /api/${slugifySegment(modules[0] ?? "records")}\n{\n  "title": "${d.title}",\n  "summary": "${descriptionSample}"\n}\n\`\`\`\n\n`;
  out += `## 11. Implementation Methodology\nAgile Scrum with two-week sprints, daily stand-ups, sprint review, and retrospective. GitFlow branching: \`main\`, \`develop\`, \`feature/*\`, \`hotfix/*\`. CI/CD pipeline: lint -> test -> build -> security scan -> deploy.\n\n`;
  out += `## 12. Testing Strategy\nUnit tests (Vitest), integration tests (supertest), E2E tests (Playwright). Coverage target: 80% lines / 70% branches. AI-validated outputs are rerun against a golden set of prompts on every release.\n\n`;
  out += `## 13. Deployment Architecture\nContainerised with Docker, orchestrated with Kubernetes (EKS/GKE). Three environments: dev, staging, prod. Blue/green deployments with automated rollback on SLO breach.\n\n`;
  out += `## 14. Risk Assessment\n| Risk ID | Risk | Probability | Impact | Mitigation |\n|---|---|---|---|---|\n| R-01 | LLM hallucination | Medium | Medium | Strict prompt + template fallback |\n| R-02 | Data exfiltration | Low | High | E2E encryption, RBAC, audit log |\n| R-03 | Traffic spike | Medium | Medium | HPA + Redis cache + CDN |\n| R-04 | API latency regression | Medium | Medium | P95 SLO + canary deploys |\n| R-05 | Vendor outage | Low | High | Multi-region active-passive |\n\n`;
  out += `## 15. Performance & Scalability\nRedis caches hot reads (60s TTL). DB indexes on \`(user_id, created_at DESC)\`. Horizontal pod autoscaler triggers at 70% CPU. Read replicas for analytics queries.\n\n`;
  out += `## 16. Monitoring & Logging\nPrometheus + Grafana for metrics, Loki for logs, OpenTelemetry tracing. Key SLIs: availability, P95 latency, error rate. PagerDuty alerts on SLO burn-rate > 2x.\n\n`;
  out += `## 17. Backup & Recovery Strategy\nNightly logical backups + continuous WAL streaming. RPO 5 minutes, RTO 1 hour. Quarterly disaster-recovery drills with restore validation.\n\n`;
  out += `## 18. Security & Compliance\nMitigations for OWASP Top 10. SOC 2 Type II posture, GDPR-compliant data subject access workflows. Secrets stored in a managed KMS; quarterly key rotation.\n\n`;
  out += `## 19. Future Roadmap\n- **Phase 1 (0-3m):** Core platform GA, single region.\n- **Phase 2 (3-6m):** Multi-region active-passive, SSO/SAML.\n- **Phase 3 (6-12m):** Advanced analytics, marketplace integrations, mobile clients.\n\n`;
  out += `## 20. Conclusion\nThis specification provides the definitive guide for the implementation and operation of **${d.title}**. Approval of this document constitutes the architectural sign-off required to begin Phase 1 execution.\n\n`;

  return out;
}

router.post("/generate", async (req, res) => {
  const body = (req.body ?? {}) as GenerateBody;
  if (!body.title || !body.description) {
    return res.status(400).json({ error: "title and description are required" });
  }
  const filled: Required<GenerateBody> = {
    title: body.title,
    description: body.description,
    scale: body.scale ?? "startup",
    structureMode: body.structureMode ?? "assistive",
    documentationType: normalizeDocumentationType(body.documentationType),
    customHeadings: body.customHeadings ?? "",
    advancedPrompt: body.advancedPrompt ?? "",
    apiDetails: body.apiDetails ?? "",
  };

  try {
    const blueprint = getDocumentBlueprint(filled.documentationType);
    const prompt = buildPrompt(filled);
    let text = await generateGeminiWithFallback({
      model: "gemini-2.5-flash",
      prompt,
      maxOutputTokens: 8192,
      temperature: 0.55,
    });

    text = normalizeGeneratedMarkdown(text);

    if (!isHighQualityMarkdown(text, blueprint.sections.length, blueprint.minimumWords)) {
      const repairPrompt = `You are a strict Markdown quality fixer. Rewrite the following content into a high-quality ${blueprint.label}.

Rules:
- Keep the original project intent and details.
- Ensure numbered top-level headings (## 1. ...).
- Remove placeholders and weak filler.
- Keep Markdown tables valid.
- Keep output pure Markdown.

Content to fix:
${text}`;

      const repaired = normalizeGeneratedMarkdown(
        await generateGeminiWithFallback({
          model: "gemini-2.5-flash",
          prompt: repairPrompt,
          maxOutputTokens: 8192,
          temperature: 0.35,
        }),
      );

      if (isHighQualityMarkdown(repaired, blueprint.sections.length, blueprint.minimumWords)) {
        return res.json({ content: repaired, source: "ai" });
      }
    }

    if (!text || text.length < 400) {
      req.log.warn("Gemini returned an unusably short response, falling back to template.");
      return res.json({ content: templateFallback(filled), source: "template" });
    }
    return res.json({ content: text, source: "ai" });
  } catch (err) {
    req.log.error({ err }, "Gemini generation failed; using template fallback");
    return res.json({ content: templateFallback(filled), source: "template" });
  }
});

export default router;
