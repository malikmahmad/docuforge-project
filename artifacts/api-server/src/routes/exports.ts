import { Router, type IRouter } from "express";
import { ExportDocumentParams, ExportDocumentBody } from "@workspace/api-zod";
import { getDocumentById } from "../lib/document-store";

const router: IRouter = Router();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToHtml(markdown: string): string {
  let html = markdown;

  html = html.replace(/^#{6}\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#{5}\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#{4}\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^#{3}\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^#{2}\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#{1}\s+(.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  html = html.replace(/^\|(.+)\|$/gm, (line) => {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => `<td>${c.trim()}</td>`)
      .join("");
    return `<tr>${cells}</tr>`;
  });
  html = html.replace(/(<tr>.*?<\/tr>\n?)+/gs, (match) => `<table>${match}</table>`);

  html = html.replace(/^- \[x\] (.+)$/gm, "<li><input type='checkbox' checked disabled> $1</li>");
  html = html.replace(/^- \[ \] (.+)$/gm, "<li><input type='checkbox' disabled> $1</li>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>");
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`);

  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;

  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/<p>(<h[1-6]>)/g, "$1");
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<pre>)/g, "$1");
  html = html.replace(/(<\/pre>)<\/p>/g, "$1");
  html = html.replace(/<p>(<ul>)/g, "$1");
  html = html.replace(/(<\/ul>)<\/p>/g, "$1");
  html = html.replace(/<p>(<table>)/g, "$1");
  html = html.replace(/(<\/table>)<\/p>/g, "$1");

  return html;
}

function generatePdfHtml(doc: {
  title: string;
  type: string;
  content: string;
  description: string | null;
  status: string;
  version: string;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}): string {
  const bodyHtml = markdownToHtml(doc.content);
  const formattedDate = new Date(doc.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(doc.title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #1a1f2e;
    background: #fff;
    padding: 0;
  }
  
  .cover {
    page-break-after: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 60px;
    background: linear-gradient(135deg, #0f1729 0%, #1e2d4f 100%);
    color: white;
  }
  
  .cover-badge {
    display: inline-block;
    background: rgba(255,255,255,0.15);
    color: #93c5fd;
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 9pt;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid rgba(147,197,253,0.3);
    margin-bottom: 32px;
  }
  
  .cover-title {
    font-size: 36pt;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-bottom: 16px;
    color: #fff;
  }
  
  .cover-description {
    font-size: 13pt;
    color: rgba(255,255,255,0.65);
    line-height: 1.5;
    max-width: 480px;
  }
  
  .cover-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 24px;
  }
  
  .cover-meta-item label {
    display: block;
    font-size: 8pt;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }
  
  .cover-meta-item span {
    font-size: 10pt;
    color: rgba(255,255,255,0.85);
    font-weight: 500;
  }
  
  .main {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 60px;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #0f1729;
    margin-top: 28px;
    margin-bottom: 10px;
    line-height: 1.3;
  }
  
  h1 { font-size: 22pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
  h2 { font-size: 16pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
  h3 { font-size: 13pt; color: #1e3a5f; }
  h4 { font-size: 11pt; }
  h5 { font-size: 10pt; }
  h6 { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  
  p { margin-bottom: 14px; }
  
  strong { font-weight: 600; color: #0f1729; }
  em { font-style: italic; }
  
  a { color: #2563eb; text-decoration: none; }
  
  code {
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: 9.5pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }
  
  pre {
    background: #0f1729;
    color: #e2e8f0;
    padding: 20px 24px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 20px 0;
    page-break-inside: avoid;
  }
  
  pre code {
    background: none;
    border: none;
    color: #e2e8f0;
    padding: 0;
    font-size: 9pt;
    line-height: 1.6;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    page-break-inside: avoid;
    font-size: 10pt;
  }
  
  th, td {
    padding: 10px 14px;
    text-align: left;
    border: 1px solid #e2e8f0;
  }
  
  tr:first-child td, th {
    background: #f8fafc;
    font-weight: 600;
    color: #334155;
    font-size: 9.5pt;
  }
  
  tr:nth-child(even) td { background: #fafafa; }
  
  ul, ol {
    margin: 10px 0 14px 20px;
  }
  
  li {
    margin-bottom: 5px;
    line-height: 1.6;
  }
  
  blockquote {
    border-left: 4px solid #3b82f6;
    padding: 12px 20px;
    margin: 16px 0;
    background: #eff6ff;
    border-radius: 0 8px 8px 0;
    color: #1e40af;
    font-style: italic;
  }
  
  input[type="checkbox"] {
    margin-right: 6px;
  }
  
  .page-footer {
    margin-top: 60px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    color: #94a3b8;
    font-size: 8.5pt;
    display: flex;
    justify-content: space-between;
  }
  
  @media print {
    body { background: white; }
    .cover { min-height: 100vh; }
    pre { white-space: pre-wrap; }
  }
</style>
</head>
<body>
<div class="cover">
  <div>
    <div class="cover-badge">${escapeHtml(doc.type.replace(/-/g, " "))}</div>
    <h1 class="cover-title">${escapeHtml(doc.title)}</h1>
    ${doc.description ? `<p class="cover-description">${escapeHtml(doc.description)}</p>` : ""}
  </div>
  <div class="cover-meta">
    <div class="cover-meta-item">
      <label>Status</label>
      <span>${escapeHtml(doc.status)}</span>
    </div>
    <div class="cover-meta-item">
      <label>Version</label>
      <span>${escapeHtml(doc.version)}</span>
    </div>
    <div class="cover-meta-item">
      <label>Last Updated</label>
      <span>${formattedDate}</span>
    </div>
    ${doc.tags ? `<div class="cover-meta-item"><label>Tags</label><span>${escapeHtml(doc.tags)}</span></div>` : ""}
  </div>
</div>
<div class="main">
  ${bodyHtml}
  <div class="page-footer">
    <span>${escapeHtml(doc.title)}</span>
    <span>Version ${escapeHtml(doc.version)} &bull; ${formattedDate}</span>
  </div>
</div>
</body>
</html>`;
}

function generateDocxXml(doc: {
  title: string;
  type: string;
  content: string;
  description: string | null;
  status: string;
  version: string;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}): string {
  const lines = doc.content.split("\n");
  const xmlParagraphs: string[] = [];

  const formattedDate = new Date(doc.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  xmlParagraphs.push(`
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:t>${escapeHtml(doc.title)}</w:t></w:r>
    </w:p>`);

  if (doc.description) {
    xmlParagraphs.push(`
    <w:p>
      <w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>
      <w:r><w:t>${escapeHtml(doc.description)}</w:t></w:r>
    </w:p>`);
  }

  xmlParagraphs.push(`
    <w:p>
      <w:r>
        <w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr>
        <w:t>Status: ${escapeHtml(doc.status)} | Version: ${escapeHtml(doc.version)} | Updated: ${formattedDate}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>`);

  for (const line of lines) {
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    const h4Match = line.match(/^#### (.+)$/);
    const bulletMatch = line.match(/^- (.+)$/);
    const numberedMatch = line.match(/^\d+\. (.+)$/);
    const codeBlockMatch = line.match(/^```/);

    if (h1Match) {
      xmlParagraphs.push(`
      <w:p>
        <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
        <w:r><w:t>${escapeHtml(h1Match[1])}</w:t></w:r>
      </w:p>`);
    } else if (h2Match) {
      xmlParagraphs.push(`
      <w:p>
        <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
        <w:r><w:t>${escapeHtml(h2Match[1])}</w:t></w:r>
      </w:p>`);
    } else if (h3Match) {
      xmlParagraphs.push(`
      <w:p>
        <w:pPr><w:pStyle w:val="Heading3"/></w:pPr>
        <w:r><w:t>${escapeHtml(h3Match[1])}</w:t></w:r>
      </w:p>`);
    } else if (h4Match) {
      xmlParagraphs.push(`
      <w:p>
        <w:pPr><w:pStyle w:val="Heading4"/></w:pPr>
        <w:r><w:t>${escapeHtml(h4Match[1])}</w:t></w:r>
      </w:p>`);
    } else if (bulletMatch) {
      xmlParagraphs.push(`
      <w:p>
        <w:pPr>
          <w:pStyle w:val="ListParagraph"/>
          <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
        </w:pPr>
        <w:r><w:t>${escapeHtml(bulletMatch[1])}</w:t></w:r>
      </w:p>`);
    } else if (numberedMatch) {
      xmlParagraphs.push(`
      <w:p>
        <w:pPr>
          <w:pStyle w:val="ListParagraph"/>
          <w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>
        </w:pPr>
        <w:r><w:t>${escapeHtml(numberedMatch[1])}</w:t></w:r>
      </w:p>`);
    } else if (codeBlockMatch) {
      continue;
    } else if (line.trim() === "") {
      xmlParagraphs.push(`<w:p><w:r><w:t></w:t></w:r></w:p>`);
    } else {
      const processedLine = line
        .replace(/\*\*(.+?)\*\*/g, (_, text) => `</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeHtml(text)}</w:t></w:r><w:r><w:t xml:space="preserve">`)
        .replace(/\*(.+?)\*/g, (_, text) => `</w:t></w:r><w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${escapeHtml(text)}</w:t></w:r><w:r><w:t xml:space="preserve">`)
        .replace(/`(.+?)`/g, (_, text) => `</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Courier New"/><w:color w:val="1e3a5f"/></w:rPr><w:t xml:space="preserve">${escapeHtml(text)}</w:t></w:r><w:r><w:t xml:space="preserve">`);

      xmlParagraphs.push(`
      <w:p>
        <w:r><w:t xml:space="preserve">${processedLine}</w:t></w:r>
      </w:p>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">
  <w:body>
    ${xmlParagraphs.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

router.post("/documents/:id/export", async (req, res): Promise<void> => {
  const params = ExportDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ExportDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const doc = await getDocumentById(params.data.id);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const { format } = parsed.data;
  const safeTitle = doc.title.replace(/[^a-z0-9_-]/gi, "_");

  if (format === "pdf") {
    const htmlContent = generatePdfHtml(doc);
    const base64Content = Buffer.from(htmlContent).toString("base64");
    res.json({
      format: "pdf",
      filename: `${safeTitle}.html`,
      content: base64Content,
      mimeType: "text/html",
    });
  } else if (format === "doc") {
    const xmlContent = generateDocxXml(doc);
    const base64Content = Buffer.from(xmlContent).toString("base64");
    res.json({
      format: "doc",
      filename: `${safeTitle}.xml`,
      content: base64Content,
      mimeType: "application/msword",
    });
  } else {
    res.status(400).json({ error: "Invalid format. Use 'pdf' or 'doc'." });
  }
});

export default router;
