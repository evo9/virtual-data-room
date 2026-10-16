import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { UploadIntentDto } from './dto/upload-intent.dto';
import { RenameFileDto } from './dto/rename-file.dto';
import { MoveFileDto } from './dto/move-file.dto';
import {
  CompleteUploadResponseDto,
  FileDetailResponseDto,
  FileResponseDto,
  SignedUrlResponseDto,
  UploadIntentResponseDto,
} from './dto/responses.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/decorators/current-user.decorator';
import {
  ApiBadRequest,
  ApiNotFound,
  ApiUnauthorized,
  MISSING_TOKEN_DESCRIPTION,
} from '@/common/swagger/error-responses';

const FILE_ID_PARAM = {
  name: 'id',
  format: 'uuid',
  description: 'File id.',
} as const;
const FILE_NOT_FOUND =
  'The file does not exist, is not fully uploaded yet, or the caller has no access to it (all indistinguishable on purpose).';
const OWNER_ONLY_NOT_FOUND =
  'The file does not exist, or the caller is not the owner of its room (a viewer gets 404 on mutations too).';

@ApiTags('Files')
@ApiBearerAuth()
@ApiUnauthorized(MISSING_TOKEN_DESCRIPTION)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-intent')
  @ApiOperation({
    summary: 'Step 1 of an upload: register the file and get a storage URL',
    description: [
      'Validates the request, reserves a (not yet visible) file record and returns a signed storage URL. The API never handles file bytes.',
      '',
      '**Full upload flow**',
      '1. `POST /files/upload-intent` -> `{ fileId, name, uploadUrl }`.',
      '2. Upload the PDF directly to `uploadUrl` with `PUT` (multipart/form-data, as supabase-js `uploadToSignedUrl` does).',
      '3. `POST /files/{fileId}/complete` - the API checks that the object really arrived and publishes the file.',
      '',
      'A file is invisible in listings until step 3 succeeds, so an abandoned upload never shows up. Only PDFs up to 50 MB are accepted. Owner only.',
    ].join('\n'),
  })
  @ApiCreatedResponse({ type: UploadIntentResponseDto })
  @ApiBadRequest(
    'Validation failed (not `application/pdf`, larger than 50 MB, empty name, ids that are not UUIDs).',
  )
  @ApiNotFound(
    'The room is not owned by the caller, or `folderId` does not exist in that room.',
  )
  createUploadIntent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadIntentDto,
  ) {
    return this.filesService.createUploadIntent(user.id, dto);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Step 3 of an upload: confirm that the bytes arrived',
    description:
      'Checks that the object exists in storage, records its actual size and makes the file visible in listings. Call it once the `PUT` to `uploadUrl` has succeeded. Owner only.',
  })
  @ApiParam({
    ...FILE_ID_PARAM,
    description: '`fileId` from the upload intent.',
  })
  @ApiCreatedResponse({ type: CompleteUploadResponseDto })
  @ApiBadRequest(
    '`id` is not a UUID, or the object is not in storage yet ("Upload did not finish - please try again"). Safe to retry.',
  )
  @ApiNotFound(OWNER_ONLY_NOT_FOUND)
  completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.filesService.completeUpload(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Rename a file',
    description:
      'Only the display name changes; the stored object is untouched. A name clash within the folder (ignoring case) is not an error: the API appends a suffix such as `report (1).pdf` and returns the final name. Owner only.',
  })
  @ApiParam(FILE_ID_PARAM)
  @ApiOkResponse({ type: FileResponseDto })
  @ApiBadRequest(
    'Validation failed (`id` is not a UUID, empty or over-long name).',
  )
  @ApiNotFound(OWNER_ONLY_NOT_FOUND)
  rename(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameFileDto,
  ) {
    return this.filesService.rename(user.id, id, dto);
  }

  @Patch(':id/move')
  @ApiOperation({
    summary: 'Move a file to another folder',
    description:
      'Moves within the same room; `targetFolderId: null` (or omitted) moves to the room root. On a name clash in the destination the file gets a `(1)`-style suffix. Moving into the folder the file is already in changes nothing. Owner only.',
  })
  @ApiParam(FILE_ID_PARAM)
  @ApiOkResponse({ type: FileResponseDto })
  @ApiBadRequest('Validation failed (`id` or `targetFolderId` is not a UUID).')
  @ApiNotFound(
    `${OWNER_ONLY_NOT_FOUND} Also returned when \`targetFolderId\` does not exist in the file's room.`,
  )
  move(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveFileDto,
  ) {
    return this.filesService.move(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a file',
    description:
      'Removes the record and the stored object. Not reversible. Owner only.',
  })
  @ApiParam(FILE_ID_PARAM)
  @ApiNoContentResponse({ description: 'Deleted.' })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(OWNER_ONLY_NOT_FOUND)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.filesService.remove(user.id, id);
  }

  @Get(':id/download-url')
  @ApiOperation({
    summary: 'Signed URL that downloads the file',
    description:
      "Short-lived (5 minutes) URL served with `Content-Disposition: attachment` and the file's name. Fetch it right before use; do not store it. Available to the owner and to anyone the file is shared with.",
  })
  @ApiParam(FILE_ID_PARAM)
  @ApiOkResponse({ type: SignedUrlResponseDto })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(FILE_NOT_FOUND)
  getDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.filesService.getDownloadUrl(user.id, id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get file metadata',
    description:
      'Name, size and location of an uploaded file. Available to the owner and to anyone the file is shared with (directly or through a folder or room share).',
  })
  @ApiParam(FILE_ID_PARAM)
  @ApiOkResponse({ type: FileDetailResponseDto })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(FILE_NOT_FOUND)
  getFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.filesService.getFile(user.id, id);
  }

  @Get(':id/view-url')
  @ApiOperation({
    summary: 'Signed URL for viewing the file inline',
    description:
      'Short-lived (5 minutes) URL for an in-browser PDF viewer (iframe / pdf.js). Same access rules as the download URL. Because the URL expires, revoking a share cuts off access within minutes.',
  })
  @ApiParam(FILE_ID_PARAM)
  @ApiOkResponse({ type: SignedUrlResponseDto })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(FILE_NOT_FOUND)
  getViewUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.filesService.getViewUrl(user.id, id);
  }
}
