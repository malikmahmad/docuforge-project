import { Router, type IRouter } from "express";
import {
  ListDocumentsQueryParams,
  CreateDocumentBody,
  GetDocumentParams,
  UpdateDocumentParams,
  UpdateDocumentBody,
  DeleteDocumentParams,
  DuplicateDocumentParams,
} from "@workspace/api-zod";
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  getDocumentById,
  getDocumentStats,
  getRecentDocuments,
  listDocuments,
  updateDocument,
} from "../lib/document-store";

const router: IRouter = Router();

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

router.get("/documents/stats", async (req, res): Promise<void> => {
  res.json(await getDocumentStats());
});

router.get("/documents/recent", async (req, res): Promise<void> => {
  res.json(await getRecentDocuments(10));
});

router.get("/documents", async (req, res): Promise<void> => {
  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, search } = parsed.data;
  res.json(await listDocuments({ type, search }));
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, type, content, description, status, tags } = parsed.data;
  const wordCount = countWords(content ?? "");

  const doc = await createDocument({
    title,
    type: type ?? "custom",
    content: content ?? "",
    description: description ?? null,
    status: status ?? "draft",
    wordCount,
    version: "1.0",
    tags: tags ?? null,
  });

  res.status(201).json(doc);
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const doc = await getDocumentById(params.data.id);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json(doc);
});

router.patch("/documents/:id", async (req, res): Promise<void> => {
  const params = UpdateDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.content != null) {
    updateData.wordCount = countWords(parsed.data.content);
  }

  const doc = await updateDocument(params.data.id, updateData);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json(doc);
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const doc = await deleteDocument(params.data.id);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/documents/:id/duplicate", async (req, res): Promise<void> => {
  const params = DuplicateDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const duplicate = await duplicateDocument(params.data.id);

  if (!duplicate) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.status(201).json(duplicate);
});

export default router;
