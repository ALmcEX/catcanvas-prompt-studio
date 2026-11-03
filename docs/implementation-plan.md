# Prompt Studio Implementation Plan

**Goal:** Complete Assignment 8 as a separate deployable prompt chain tool.
**Architecture:** Reuse verified Google-superadmin auth; additive RLS tables and transactional RPCs; server-only provider calls and private PNG output.
**Tech Stack:** Next.js 16.4.2, React 19, Supabase, Gemini, Sharp, Vitest, PGlite.
**Spec:** docs/design.md

## Global Constraints
- Full step prompts and resolved runtime prompts must be visible to superadmins.
- Reuse current database; do not alter old workflows or grant new administrator roles.
- Create a separate repository and Vercel project; no course submission.

## Review Focus
- Concurrent edits and reorder preserve all steps or reject stale changes.
- Deleted chains preserve run history; run snapshots survive edits.
- Ordinary/anonymous users cannot read media or mutate data.
- Provider failures retain completed steps and never invent outputs.
- Oversized inputs, forward references and malformed images fail safely.

### Task 1: Protected persistence and validation
- [ ] Write database/validation acceptance tests, run RED.
- [ ] Add tables, RLS/storage policies, versioned mutation/reorder and run lifecycle RPCs.
- [ ] Implement prompt dependency resolution and safe input validation, run GREEN.

### Task 2: Chain execution and media
- [ ] Test serial execution, substitutions, failures, provider body validation and PNG output RED.
- [ ] Implement session-bound execution, provider calls, private image storage and media route; run GREEN.

### Task 3: Interface and themes
- [ ] Implement chain editor with full prompts, step CRUD/reorder, run form/history, generated media and run details.
- [ ] Add Light/Dark/System; check production build, authorization redirects and responsive UI.

### Task 4: Review, deploy and verify
- [ ] Fresh code review; fix material findings, full tests/lint/build/database suite.
- [ ] Apply additive migration; create repository/project; configure server environment and exact callback URLs.
- [ ] Deploy, disable Deployment Protection, verify live anonymous denial and real generation.
- [ ] Prepare three verified commit-specific deployment URLs.
