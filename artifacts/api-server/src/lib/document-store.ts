import { and, desc, eq, ilike } from "drizzle-orm";

export type StoredDocument = {
  id: number;
  title: string;
  type: string;
  content: string;
  description: string | null;
  status: string;
  wordCount: number;
  version: string;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateStoredDocumentInput = {
  title: string;
  type: string;
  content: string;
  description: string | null;
  status: string;
  wordCount: number;
  version: string;
  tags: string | null;
};

export type UpdateStoredDocumentInput = Partial<
  Omit<StoredDocument, "id" | "createdAt" | "updatedAt">
>;

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

function cloneDocument(doc: StoredDocument): StoredDocument {
  return {
    ...doc,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

function createSeedDocument(
  id: number,
  input: Omit<StoredDocument, "id" | "wordCount">,
): StoredDocument {
  return {
    ...input,
    id,
    wordCount: countWords(input.content),
  };
}

const memoryDocuments: StoredDocument[] = [
  createSeedDocument(1, {
    title: "DocuForge Product README",
    type: "readme",
    content: `# DocuForge

## Overview

DocuForge helps teams generate polished technical documentation with templates, export tooling, and an editor built for structured writing.

## Quick Start

1. Create a new document from the dashboard.
2. Pick a template or start from scratch.
3. Write in Markdown and export when ready.
`,
    description: "High-level introduction to the product and workflow.",
    status: "published",
    version: "1.0",
    tags: "readme, onboarding",
    createdAt: new Date("2026-04-12T09:00:00Z"),
    updatedAt: new Date("2026-04-20T14:30:00Z"),
  }),
  createSeedDocument(2, {
    title: "API Authentication Reference",
    type: "api-reference",
    content: `# API Authentication

## Overview

All API requests require a bearer token.

## Header

\`\`\`http
Authorization: Bearer <token>
\`\`\`

## Errors

| Code | Meaning |
|------|---------|
| 401 | Missing or invalid token |
| 403 | Insufficient scope |
`,
    description: "Reference material for auth headers and auth-related errors.",
    status: "review",
    version: "0.9",
    tags: "api, auth",
    createdAt: new Date("2026-04-14T11:00:00Z"),
    updatedAt: new Date("2026-04-21T08:15:00Z"),
  }),
  createSeedDocument(3, {
    title: "Incident Response SOP",
    type: "sop",
    content: `# Incident Response SOP

## Purpose

Define the first-response process for production incidents.

## Procedure

1. Acknowledge the alert.
2. Assess severity and customer impact.
3. Open an incident channel and assign roles.
4. Record the timeline and mitigation steps.
`,
    description: "Standard operating procedure for handling production incidents.",
    status: "draft",
    version: "1.2",
    tags: "ops, sop",
    createdAt: new Date("2026-04-10T16:45:00Z"),
    updatedAt: new Date("2026-04-18T10:00:00Z"),
  }),
];

let nextMemoryId = Math.max(...memoryDocuments.map((doc) => doc.id)) + 1;

async function getDatabaseContext() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { db, documentsTable } = await import("@workspace/db");
  return { db, documentsTable };
}

export async function listDocuments(filters: {
  type?: string;
  search?: string;
}): Promise<StoredDocument[]> {
  const database = await getDatabaseContext();

  if (database) {
    const { db, documentsTable } = database;
    const conditions = [];

    if (filters.type) {
      conditions.push(eq(documentsTable.type, filters.type));
    }

    if (filters.search) {
      conditions.push(ilike(documentsTable.title, `%${filters.search}%`));
    }

    const docs =
      conditions.length > 0
        ? await db
            .select()
            .from(documentsTable)
            .where(and(...conditions))
            .orderBy(desc(documentsTable.updatedAt))
        : await db
            .select()
            .from(documentsTable)
            .orderBy(desc(documentsTable.updatedAt));

    return docs.map(cloneDocument);
  }

  return memoryDocuments
    .filter((doc) => {
      if (filters.type && doc.type !== filters.type) {
        return false;
      }

      if (
        filters.search &&
        !doc.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map(cloneDocument);
}

export async function getDocumentById(
  id: number,
): Promise<StoredDocument | null> {
  const database = await getDatabaseContext();

  if (database) {
    const { db, documentsTable } = database;
    const [doc] = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, id));

    return doc ? cloneDocument(doc) : null;
  }

  const doc = memoryDocuments.find((item) => item.id === id);
  return doc ? cloneDocument(doc) : null;
}

export async function createDocument(
  input: CreateStoredDocumentInput,
): Promise<StoredDocument> {
  const database = await getDatabaseContext();

  if (database) {
    const { db, documentsTable } = database;
    const [doc] = await db.insert(documentsTable).values(input).returning();
    return cloneDocument(doc);
  }

  const now = new Date();
  const doc: StoredDocument = {
    ...input,
    id: nextMemoryId++,
    createdAt: now,
    updatedAt: now,
  };

  memoryDocuments.unshift(doc);
  return cloneDocument(doc);
}

export async function updateDocument(
  id: number,
  input: UpdateStoredDocumentInput,
): Promise<StoredDocument | null> {
  const database = await getDatabaseContext();

  if (database) {
    const { db, documentsTable } = database;
    const [doc] = await db
      .update(documentsTable)
      .set(input)
      .where(eq(documentsTable.id, id))
      .returning();

    return doc ? cloneDocument(doc) : null;
  }

  const index = memoryDocuments.findIndex((doc) => doc.id === id);

  if (index === -1) {
    return null;
  }

  const updated: StoredDocument = {
    ...memoryDocuments[index],
    ...input,
    updatedAt: new Date(),
  };

  memoryDocuments[index] = updated;
  return cloneDocument(updated);
}

export async function deleteDocument(
  id: number,
): Promise<StoredDocument | null> {
  const database = await getDatabaseContext();

  if (database) {
    const { db, documentsTable } = database;
    const [doc] = await db
      .delete(documentsTable)
      .where(eq(documentsTable.id, id))
      .returning();

    return doc ? cloneDocument(doc) : null;
  }

  const index = memoryDocuments.findIndex((doc) => doc.id === id);

  if (index === -1) {
    return null;
  }

  const [removed] = memoryDocuments.splice(index, 1);
  return cloneDocument(removed);
}

export async function duplicateDocument(
  id: number,
): Promise<StoredDocument | null> {
  const original = await getDocumentById(id);

  if (!original) {
    return null;
  }

  return createDocument({
    title: `${original.title} (Copy)`,
    type: original.type,
    content: original.content,
    description: original.description,
    status: "draft",
    wordCount: original.wordCount,
    version: "1.0",
    tags: original.tags,
  });
}

export async function getRecentDocuments(
  limit = 10,
): Promise<StoredDocument[]> {
  const docs = await listDocuments({});
  return docs.slice(0, limit);
}

export async function getDocumentStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalWords: number;
  recentCount: number;
}> {
  const docs = await listDocuments({});
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalWords = 0;

  for (const doc of docs) {
    byType[doc.type] = (byType[doc.type] ?? 0) + 1;
    byStatus[doc.status] = (byStatus[doc.status] ?? 0) + 1;
    totalWords += doc.wordCount;
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return {
    total: docs.length,
    byType,
    byStatus,
    totalWords,
    recentCount: docs.filter((doc) => doc.updatedAt >= oneWeekAgo).length,
  };
}
