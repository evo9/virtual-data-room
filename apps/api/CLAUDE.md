# apps/api - backend conventions

NestJS 11 + Prisma + PostgreSQL. File storage: Supabase Storage (private bucket, signed URLs). Deployed on Railway. Read root `CLAUDE.md` first for priorities and process.

## Architecture rules

- **No DDD/CQRS here.** Plain NestJS modules: controller -> service -> Prisma. No repositories, no command buses, no domain events. This is intentional for the scope; do not "improve" it.
- **One module per resource:** auth, data-rooms, folders, files, shares. Shared helpers in `src/common`.
- **All authorization goes through `resolveAccess(actor, resource) -> OWNER | VIEWER | NONE`** in `src/common/access`. Never inline ownership checks in controllers. Mutations require OWNER, reads require >= VIEWER. Unauthorized reads return 404, not 403 (do not reveal that a resource exists).
- **Public share endpoints** (`/public/:token/...`) carry no JWT, but every one of them must verify that the requested resource lies inside the shared subtree AND the share is not revoked. Token-scoped access is the main hole a reviewer will probe with id substitution.
- **Folder tree uses a materialized path** (`Folder.path`, string of ids like `/rootId/childId/`). Subtree queries via `path LIKE 'prefix%'`. Do not add recursive CTEs. Share inheritance (VIEWER on a folder covers its subtree) rides on the same path.
- **File name vs storage key are independent.** `storageKey` is a uuid, never derived from the file name. Rename = row update only; the bucket object is untouched.
- **Name conflicts** are resolved by the single helper `resolveName(dataRoomId, folderId, name)` -> "name (1).pdf". Used by upload, rename, move. Case-insensitive comparison. Move into the same folder is a no-op - don't mint "(1)".
- **Uploads are presigned:** api issues an upload intent (ownership check, mimeType `application/pdf`, size limit) + signed URL; the browser uploads directly to storage; then confirms via `/files/:id/complete`. The api never proxies file bytes.
- **Signed download/view URLs are short-lived** (minutes), so revoking a share actually revokes access.
- **Folder delete:** collect subtree storageKeys, delete DB rows in one transaction, then delete bucket objects after commit. Orphaned bucket objects on partial storage failure are acceptable for MVP (documented in README).

## Imports and TypeScript

- **Path alias `@/*` -> `src/*`** (tsconfig `paths`). Cross-directory imports use `@/...`; plain relative `./...` is allowed only for the same directory and below. **`../` imports are forbidden** - if you're reaching up, use the alias.
- The alias must work everywhere it's consumed: unit jest (`moduleNameMapper` in package.json), e2e jest (`test/jest-e2e.json`), and the compiled output - `npm run build` runs `tsc-alias` after `nest build` to rewrite `@/` into relative paths in `dist`. When adding a new consumer (scripts, seed), wire the alias there too, don't fall back to `../`.
- The Prisma Nest module lives in `src/prisma/` (service + module); only `schema.prisma` and migrations stay in the root `prisma/` folder.
- **DTO properties use the definite assignment assertion** (`email!: string;`) - DTOs are populated by ValidationPipe, not a constructor. Never silence TS2564 with a dummy initializer, `?`, or by weakening tsconfig.

## Validation and errors

- class-validator DTOs on every endpoint; frontend validation is a convenience, backend is the source of truth.
- Errors return a message the frontend can show directly in a toast.
- Login failures return one generic message (no email enumeration). Duplicate email on register -> 409.
- JWT guard is global; public routes are marked with a `@Public()` decorator.

## Prisma

- Schema in `prisma/schema.prisma`; every schema change goes through `npx prisma migrate dev` (never db push on shared/prod DB).
- No unique DB index on (folderId, name) - nullable folderId makes it unreliable in Postgres; the conflict check lives in `resolveName` at the application level. Deliberate compromise, don't "fix" it.
- Raw SQL is fine only for the `path LIKE` subtree aggregates (delete-preview counts/size); keep it inside the owning service.

## Tests (minimal by design)

Tests are not in the assignment's DoD; write them only where a bug is a security hole or data loss:
- `resolveAccess` - the full matrix: owner, direct share, inherited-via-path share, revoked share, foreign resource -> NONE/404.
- `resolveName` - conflicts, case-insensitivity, "(n)" increments, same-folder move no-op.
Prefer extracting pure decision logic so it tests without a DB. No testcontainers, no e2e infra - out of scope for the deadline.

## Commands

```bash
npm run start:dev
npx prisma migrate dev
npm run seed
npm run build && npm run lint && npm test
```
