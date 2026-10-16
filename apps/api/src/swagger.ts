import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

const DESCRIPTION = `
REST API of a virtual data room: owners organise PDF documents in nested folders and share them read-only, either with a public link or with specific users.

## Quick start

1. \`POST /auth/register\` (or \`POST /auth/login\`) and copy \`accessToken\` from the response.
2. Click **Authorize** at the top right and paste the token (without the \`Bearer\` prefix). Every protected request in this page will now carry it.
3. \`GET /data-rooms\` returns your rooms - a default one is created at registration. Use its \`id\` with \`GET /data-rooms/{id}/contents\`, \`POST /folders\` and \`POST /files/upload-intent\`.

Operations marked with a lock need the token. Health, register, login and everything under **Public links** work without one.

## Concepts

| Term | Meaning |
| --- | --- |
| Data room | Top-level container owned by one user. |
| Folder | Nested arbitrarily deep inside a room. Names are unique among siblings, ignoring case. |
| File | A PDF (max 50 MB) living in a folder or at the room root. |
| Share | A read-only grant on a room, folder or file. |

## Access model

Every request resolves to one of two levels on the target resource:

- **OWNER** - the room's owner. Can read and modify everything in the room.
- **VIEWER** - read-only. Granted by a share on the resource itself **or on any folder/room above it**, so sharing a folder also shares everything inside it, including files added later.

Everything that creates, renames, moves, deletes, uploads or shares requires OWNER; reads require at least VIEWER.

**Missing and forbidden look the same.** A resource the caller may not see answers \`404 Not Found\`, never \`403\`, so ids cannot be probed to learn what exists. If you get a 404 for an id you are sure about, check that the token belongs to the owner (for mutations) or to a user the resource is shared with (for reads).

## Sharing

- **Public link** (\`mode: PUBLIC_LINK\`) - \`POST /shares\` returns a \`token\`; the web app builds the link \`<web app>/share/<token>\`. Anyone holding it can browse via the **Public links** endpoints, no account needed. The token only reaches the shared subtree. A revoked link answers \`410 Gone\`.
- **Specific user** (\`mode: USER\`) - identified by email. The recipient finds the item in \`GET /shares/received\` and reads it with the ordinary endpoints (\`/data-rooms\`, \`/folders\`, \`/files\`) using their own token.
- Shares are revoked with \`DELETE /shares/{id}\`.

## Uploading a file

The API never receives file bytes. Uploads are three steps:

1. \`POST /files/upload-intent\` - validates type (PDF) and size, returns \`fileId\` and a signed \`uploadUrl\`.
2. \`PUT\` the file to \`uploadUrl\` (straight to storage).
3. \`POST /files/{fileId}/complete\` - the API verifies the object exists and the file appears in listings.

Downloads work the other way round: \`GET /files/{id}/view-url\` and \`GET /files/{id}/download-url\` return signed URLs valid for **5 minutes**. Request a fresh one each time instead of storing it.

## Name conflicts

- Folders: creating or renaming to an existing sibling name (ignoring case) fails with \`409 Conflict\`.
- Files: never an error. Upload, rename and move resolve a clash automatically by appending a suffix - \`report.pdf\` becomes \`report (1).pdf\`. The response carries the final name.

## Pagination

Every list endpoint is cursor-paginated and returns \`{ "items": [...], "nextCursor": "..." | null }\`.

- Pass \`limit\` (1-100, default 50) and, for the next page, \`cursor\` set to the previous \`nextCursor\`.
- \`nextCursor: null\` means there are no more pages.
- Cursors are opaque - do not build or parse them. A malformed one is a \`400\`.
- Sort order is fixed by the server (by name, case-insensitive; shares newest first).
- The only unpaginated list is the breadcrumb trail, which is bounded by folder depth.

## Errors

Errors share one JSON shape: \`{ "statusCode": 404, "message": "Resource not found", "error": "Not Found" }\`. \`message\` is written for end users and can be shown as-is; for body validation failures (400) it is an array with one entry per invalid field.

| Status | When |
| --- | --- |
| 400 | Validation failed: bad body or query, a path id that is not a UUID, a malformed cursor. |
| 401 | Missing, malformed or expired token (tokens live 7 days; there is no refresh), or wrong credentials on login. |
| 404 | Not found **or** not accessible to the caller. |
| 409 | Duplicate email on register, duplicate folder name. |
| 410 | A public link that has been revoked. |

## Conventions

- Ids are UUIDs; timestamps are ISO 8601 in UTC; sizes are bytes.
- JSON in, JSON out. Mutations that return nothing answer \`204 No Content\`.
`;

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Data Room API')
    .setDescription(DESCRIPTION)
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Access token from `POST /auth/login` or `POST /auth/register`.',
    })
    .addTag('Health', 'Liveness probe.')
    .addTag('Auth', 'Registration, login and the current user.')
    .addTag(
      'Data rooms',
      'Top-level containers and their root listing. Folder navigation lives under Folders.',
    )
    .addTag(
      'Folders',
      'Create, browse, rename and delete folders. Deleting removes the whole subtree.',
    )
    .addTag(
      'Files',
      'Three-step PDF upload, rename, move, delete and signed view/download URLs.',
    )
    .addTag(
      'Shares',
      'Grant, list and revoke read-only access, and see what was shared with you.',
    )
    .addTag(
      'Public links',
      'Unauthenticated read-only access through a share token. Limited to the shared subtree.',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'Data Room API',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'none',
      operationsSorter: 'none',
      docExpansion: 'none',
      displayRequestDuration: true,
    },
  });
}
