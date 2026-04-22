import { Router, type IRouter } from "express";

const router: IRouter = Router();

const TEMPLATES = [
  {
    id: "api-reference",
    name: "API Reference",
    type: "api-reference",
    description: "Comprehensive API documentation with endpoints, parameters, and examples",
    icon: "code",
    content: `# API Reference

## Overview

Brief description of your API and what it does.

## Base URL

\`\`\`
https://api.example.com/v1
\`\`\`

## Authentication

Describe your authentication method here.

\`\`\`http
Authorization: Bearer <token>
\`\`\`

## Endpoints

### GET /resource

Returns a list of resources.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| limit | integer | No | Number of results (default: 20) |
| offset | integer | No | Pagination offset (default: 0) |

**Response:**

\`\`\`json
{
  "data": [],
  "total": 0,
  "limit": 20,
  "offset": 0
}
\`\`\`

### POST /resource

Creates a new resource.

**Request Body:**

\`\`\`json
{
  "name": "string",
  "description": "string"
}
\`\`\`

**Response:** \`201 Created\`

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request — Invalid input |
| 401 | Unauthorized — Authentication required |
| 404 | Not Found — Resource not found |
| 500 | Internal Server Error |
`,
  },
  {
    id: "technical-spec",
    name: "Technical Specification",
    type: "technical-spec",
    description: "Detailed technical design document for engineering teams",
    icon: "file-code",
    content: `# Technical Specification

## Document Information

- **Author:**
- **Date:**
- **Version:** 1.0
- **Status:** Draft

## Overview

High-level description of the feature or system being specified.

## Goals

- Goal 1
- Goal 2
- Goal 3

## Non-Goals

- Out of scope item 1
- Out of scope item 2

## Background

Context and motivation for this specification.

## Design

### Architecture

Describe the overall architecture and design decisions.

### Data Model

Describe the data structures and schema.

### API Design

Describe any APIs being introduced or modified.

### Security Considerations

Address security implications.

## Implementation Plan

### Phase 1: Foundation

- Task 1
- Task 2

### Phase 2: Core Features

- Task 1
- Task 2

## Testing Strategy

Describe how this will be tested.

## Open Questions

- Question 1?
- Question 2?

## References

- Reference 1
- Reference 2
`,
  },
  {
    id: "user-manual",
    name: "User Manual",
    type: "user-manual",
    description: "End-user documentation with step-by-step instructions",
    icon: "book-open",
    content: `# User Manual

## Welcome

Welcome to [Product Name]. This manual will help you get started and make the most of all features.

## Getting Started

### System Requirements

- Requirement 1
- Requirement 2

### Installation

1. Step 1
2. Step 2
3. Step 3

### Initial Setup

Walk the user through initial configuration.

## Core Features

### Feature 1

Description of the feature and how to use it.

**To use Feature 1:**

1. Navigate to...
2. Click on...
3. Enter...

### Feature 2

Description of the feature and how to use it.

## Advanced Features

### Advanced Feature 1

Detailed explanation for power users.

## Troubleshooting

### Common Issues

**Problem:** Describe the problem.
**Solution:** Describe the solution.

### Getting Help

Contact information and support resources.

## Frequently Asked Questions

**Q: Question 1?**
A: Answer 1.

**Q: Question 2?**
A: Answer 2.

## Glossary

| Term | Definition |
|------|------------|
| Term 1 | Definition 1 |
| Term 2 | Definition 2 |
`,
  },
  {
    id: "product-requirements",
    name: "Product Requirements Document",
    type: "product-requirements",
    description: "PRD outlining product features, user stories, and acceptance criteria",
    icon: "clipboard-list",
    content: `# Product Requirements Document

## Product Overview

**Product Name:**
**Version:**
**Date:**
**Owner:**

## Executive Summary

Brief description of the product and its purpose.

## Problem Statement

Describe the problem this product solves.

## Goals & Objectives

### Business Goals

- Goal 1
- Goal 2

### User Goals

- Goal 1
- Goal 2

## Target Users

### Primary User

Description of primary user persona.

### Secondary User

Description of secondary user persona.

## User Stories

### Epic 1: [Feature Area]

**As a** [user type], **I want to** [action], **so that** [benefit].

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

### Epic 2: [Feature Area]

**As a** [user type], **I want to** [action], **so that** [benefit].

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

## Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Description | High |
| FR-002 | Description | Medium |

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Performance | < 200ms response |
| NFR-002 | Availability | 99.9% uptime |

## Out of Scope

- Item 1
- Item 2

## Success Metrics

- Metric 1: Target value
- Metric 2: Target value

## Timeline

| Milestone | Date |
|-----------|------|
| Design complete | |
| Development complete | |
| Testing complete | |
| Launch | |
`,
  },
  {
    id: "changelog",
    name: "Changelog",
    type: "changelog",
    description: "Structured release history following Keep a Changelog format",
    icon: "history",
    content: `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature description

### Changed
- Changed feature description

### Fixed
- Bug fix description

## [1.0.0] - ${new Date().toISOString().split("T")[0]}

### Added
- Initial release
- Feature 1
- Feature 2

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A
`,
  },
  {
    id: "readme",
    name: "README",
    type: "readme",
    description: "Project README with installation, usage, and contribution guide",
    icon: "file-text",
    content: `# Project Name

> Short description of your project.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install project-name
\`\`\`

## Quick Start

\`\`\`javascript
const project = require('project-name');

// Basic usage
project.doSomething();
\`\`\`

## Documentation

Full documentation is available at [docs.example.com](https://docs.example.com).

## Usage

### Basic Example

\`\`\`javascript
// Example code here
\`\`\`

### Advanced Example

\`\`\`javascript
// Advanced example code here
\`\`\`

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| option1 | string | "default" | Description |
| option2 | boolean | false | Description |

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repo
2. Clone your fork: \`git clone https://github.com/username/project-name\`
3. Install dependencies: \`npm install\`
4. Make your changes
5. Run tests: \`npm test\`
6. Submit a pull request

## License

MIT — see [LICENSE](LICENSE) for details.

## Support

- Open an issue on [GitHub](https://github.com/username/project-name/issues)
- Join our [Discord](https://discord.gg/example)
`,
  },
  {
    id: "release-notes",
    name: "Release Notes",
    type: "release-notes",
    description: "Customer-facing release notes highlighting new features and improvements",
    icon: "rocket",
    content: `# Release Notes

## Version 1.0.0

**Release Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

We are excited to announce the release of Version 1.0.0!

### What's New

#### Feature 1

Description of the new feature and how it benefits users.

#### Feature 2

Description of the new feature and how it benefits users.

### Improvements

- Improvement 1: Description
- Improvement 2: Description
- Performance improvements across the board

### Bug Fixes

- Fixed issue where...
- Resolved problem with...

### Breaking Changes

> **Important:** The following changes may require action from you.

- Breaking change 1: How to migrate
- Breaking change 2: How to migrate

### Deprecations

The following features are deprecated and will be removed in a future release:

- Deprecated feature 1
- Deprecated feature 2

### Known Issues

- Known issue 1 (workaround: ...)

### Upgrading

To upgrade to this version:

\`\`\`bash
npm update package-name
\`\`\`

### Thank You

Thank you to all contributors who made this release possible.
`,
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    type: "meeting-notes",
    description: "Structured meeting notes with agenda, decisions, and action items",
    icon: "users",
    content: `# Meeting Notes

## Meeting Details

- **Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
- **Time:**
- **Location / Link:**
- **Facilitator:**
- **Note Taker:**

## Attendees

- Name (Role)
- Name (Role)
- Name (Role)

## Agenda

1. Agenda item 1
2. Agenda item 2
3. Agenda item 3

## Discussion

### Agenda Item 1

Key points discussed:
- Point 1
- Point 2

### Agenda Item 2

Key points discussed:
- Point 1
- Point 2

## Decisions Made

| Decision | Owner | Notes |
|----------|-------|-------|
| Decision 1 | Name | |
| Decision 2 | Name | |

## Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Action 1 | Name | Date | Pending |
| Action 2 | Name | Date | Pending |

## Next Steps

- Next step 1
- Next step 2

## Next Meeting

- **Date:**
- **Topics:**
`,
  },
  {
    id: "sop",
    name: "Standard Operating Procedure",
    type: "sop",
    description: "Step-by-step SOP for consistent process execution",
    icon: "check-square",
    content: `# Standard Operating Procedure

## Document Control

| Field | Details |
|-------|---------|
| SOP Title | |
| SOP Number | SOP-001 |
| Version | 1.0 |
| Effective Date | ${new Date().toLocaleDateString()} |
| Review Date | |
| Author | |
| Approved By | |

## Purpose

State the purpose of this SOP and why it exists.

## Scope

Define what this SOP covers and who it applies to.

## Definitions

| Term | Definition |
|------|------------|
| Term 1 | Definition |
| Term 2 | Definition |

## Responsibilities

| Role | Responsibility |
|------|---------------|
| Role 1 | Responsibility description |
| Role 2 | Responsibility description |

## Prerequisites

Before starting this procedure, ensure:

- [ ] Prerequisite 1
- [ ] Prerequisite 2
- [ ] Prerequisite 3

## Procedure

### Step 1: [First Action]

Detailed description of what to do.

**Expected outcome:** What should happen after this step.

### Step 2: [Second Action]

Detailed description of what to do.

**Expected outcome:** What should happen after this step.

### Step 3: [Third Action]

Detailed description of what to do.

**Expected outcome:** What should happen after this step.

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Problem 1 | Cause | Solution |
| Problem 2 | Cause | Solution |

## Quality Checks

- [ ] Check 1
- [ ] Check 2

## Related Documents

- Document 1
- Document 2

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | ${new Date().toLocaleDateString()} | | Initial version |
`,
  },
];

router.get("/templates", async (req, res): Promise<void> => {
  res.json(TEMPLATES);
});

export default router;
