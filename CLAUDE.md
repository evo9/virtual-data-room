# CLAUDE.md

## Project

Data Room MVP - a take-home assignment. Virtual data room for due diligence: nested folders, PDF uploads, read-only sharing (public link + per-user). Deadline is tight (3 days), so scope discipline matters more than architectural ambition.

Evaluation priorities from the assignment, in order:
1. UX and functionality (edge cases, error states)
2. Design and polish (no unimplemented features visible in UI)
3. Code quality and readability

When a trade-off comes up, resolve it in that order.

## Stack

- `apps/web` - React 18 + TypeScript + Vite, Tailwind, shadcn/ui, TanStack Query. Deployed on Vercel.
- `apps/api` - NestJS + Prisma + PostgreSQL. Deployed on Railway.
- File storage: Supabase Storage, private bucket, signed URLs only.
- Auth: email/password, JWT (single access token, no refresh - deliberate MVP cut).

## Commands

```bash
# api
cd apps/api
npm run start:dev        # dev server
npx prisma migrate dev   # create/apply migration locally
npx prisma migrate deploy # apply on prod
npm run seed             # test user + demo data room

# web
cd apps/web
npm run dev
npm run build            # must pass before any commit that touches web
```

## Architecture rules

- **No DDD/CQRS here.** Plain NestJS modules: controller -> service -> Prisma. No repositories, no command buses, no domain events. This is intentional for the scope; do not "improve" it.
- **One module per resource:** auth, data-rooms, folders, files, shares. Shared helpers in `src/common`.
- **All authorization goes through `resolveAccess(actor, resource) -> OWNER | VIEWER | NONE`** in `src/common/access`. Never inline ownership checks in controllers. Mutations require OWNER, reads require >= VIEWER. Unauthorized reads return 404, not 403.
- **Folder tree uses a materialized path** (`Folder.path`, string of ids like `/rootId/childId/`). Subtree queries via `path LIKE 'prefix%'`. Do not add recursive CTEs.
- **File name vs storage key are independent.** `storageKey` is a uuid, never derived from the file name. Rename = row update only.
- **Name conflicts** are resolved by the single helper `resolveName(dataRoomId, folderId, name)` -> "name (1).pdf". Used by upload, rename, move. Case-insensitive comparison.
- **Uploads are presigned:** api issues an upload intent + signed URL, browser uploads directly to storage via XMLHttpRequest (fetch has no upload progress), then confirms via `/files/:id/complete`. The api never proxies file bytes.
- **Signed download/view URLs are short-lived** (minutes), so revoking a share actually revokes access.

## Frontend rules

- shadcn/ui components as-is; do not hand-roll dialogs, dropdowns, toasts.
- TanStack Query for all server state; after mutations invalidate the affected folder keys (source and target on move).
- Every list has a loading skeleton and an empty state. Every mutation shows a toast on success and on error.
- Public share pages (`/share/:token`) are a separate read-only view: no disabled edit buttons, no edit UI at all.
- Do not add features outside the assignment scope (dark mode, i18n, custom PDF viewer). Browser-native PDF rendering via `<object>` is enough.

## Validation and errors

- class-validator DTOs on every endpoint; frontend validation is a convenience, backend is the source of truth.
- Errors return a message the frontend can show directly in a toast.
- Login failures return one generic message (no email enumeration).

## Definition of done for any task

- Works on the deployed prod URLs, not just localhost (CORS on both api and storage bucket is a known trap - verify on prod).
- Error and empty states handled, not just the happy path.
- `npm run build` passes in both apps.

## Process

- After completing any meaningful chunk, append 1-2 lines to `ai-notes.md` in the repo root: what was delegated, what was rewritten by hand, where the model got it wrong. This file feeds the "AI usage" section of the README and is part of the deliverable.
- Keep commits small and scoped to one task file from the plan (01-10).
