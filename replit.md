# DocuForge Workspace

## Overview

DocuForge is a professional documentation generator web app that allows users to create any type of documentation with well-formatted PDF and DOC exports.

## Architecture

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/docuforge)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Routing**: Wouter
- **UI**: Radix UI + Tailwind CSS
- **State**: TanStack React Query

## Features

- **Dashboard** — Stats overview, recent documents, quick-create buttons
- **Document Library** — Searchable/filterable list with type and status badges
- **Rich Editor** — Markdown editor with toolbar, live word count, metadata sidebar, preview mode
- **Template Gallery** — 9 professional templates (API Reference, Technical Spec, User Manual, PRD, Changelog, README, Release Notes, Meeting Notes, SOP)
- **PDF Export** — Beautiful HTML/PDF with cover page, styled headings, code blocks, tables
- **DOC Export** — Word-compatible XML document

## Theme

Deep navy sidebar (--sidebar: 215 40% 14%) with cyan/teal primary accent (--primary: 199 89% 42%). Light/dark mode support.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## API Routes

- `GET /api/documents` — list documents (search, type filter)
- `POST /api/documents` — create document
- `GET /api/documents/:id` — get document
- `PATCH /api/documents/:id` — update document
- `DELETE /api/documents/:id` — delete document
- `POST /api/documents/:id/duplicate` — duplicate document
- `GET /api/documents/stats` — dashboard statistics
- `GET /api/documents/recent` — recently modified documents
- `GET /api/templates` — list document templates
- `POST /api/documents/:id/export` — export as PDF or DOC

## Database Schema

- `documents` table: id, title, type, content, description, status, word_count, version, tags, created_at, updated_at

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
