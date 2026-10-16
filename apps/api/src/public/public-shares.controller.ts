import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PublicSharesService } from './public-shares.service';
import {
  PublicFileSummaryResponseDto,
  PublicShareSummaryResponseDto,
} from './dto/responses.dto';
import { Public } from '@/common/decorators/public.decorator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { ContentPageDto } from '@/common/dto/content-item.dto';
import { SignedUrlResponseDto } from '@/files/dto/responses.dto';
import {
  ApiBadRequest,
  ApiGone,
  ApiNotFound,
} from '@/common/swagger/error-responses';

const TOKEN_PARAM = {
  name: 'token',
  description:
    'Secret from the `token` field of a `PUBLIC_LINK` share (the last segment of the shared URL).',
} as const;
const FOLDER_ID_PARAM = {
  name: 'id',
  format: 'uuid',
  description:
    'Folder id. Must be the shared folder itself or lie inside it (or, for a room link, anywhere in the room).',
} as const;
const FILE_ID_PARAM = {
  name: 'id',
  format: 'uuid',
  description:
    'File id. Must be the shared file or lie inside the shared folder / room.',
} as const;
const REVOKED = 'The link has been revoked: "This link has been revoked".';
const OUT_OF_SCOPE =
  'Unknown token, or the requested item is outside what the link shares. Both look the same, so ids from other rooms cannot be probed.';

@ApiTags('Public links')
@Public()
@Controller('public')
export class PublicSharesController {
  constructor(private readonly publicSharesService: PublicSharesService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Resolve a public link',
    description:
      'Entry point of the public viewer, no authentication. Tells what the link points at so the client knows where to go next (see `resourceType`). All `/public/{token}/...` endpoints are read-only and limited to the shared subtree.',
  })
  @ApiParam(TOKEN_PARAM)
  @ApiOkResponse({ type: PublicShareSummaryResponseDto })
  @ApiNotFound('Unknown token.')
  @ApiGone(REVOKED)
  getShare(@Param('token') token: string) {
    return this.publicSharesService.getShare(token);
  }

  @Get(':token/contents')
  @ApiOperation({
    summary: 'List the shared room root',
    description:
      'Only for links that share a whole data room. For folder and file links use the folder / file endpoints below; this one answers 404.',
  })
  @ApiParam(TOKEN_PARAM)
  @ApiOkResponse({ type: ContentPageDto })
  @ApiBadRequest('Invalid `limit` or malformed `cursor`.')
  @ApiNotFound('Unknown token, or the link does not share a whole room.')
  @ApiGone(REVOKED)
  getRootContents(
    @Param('token') token: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.publicSharesService.getRootContents(token, query);
  }

  @Get(':token/folders/:id/contents')
  @ApiOperation({
    summary: 'List a folder inside the shared subtree',
    description:
      'Same listing as `GET /folders/{id}/contents` (folders first, then files, sorted by name), but authorised by the link. For a folder link, start with the `resourceId` from `GET /public/{token}` and descend from there.',
  })
  @ApiParam(TOKEN_PARAM)
  @ApiParam(FOLDER_ID_PARAM)
  @ApiOkResponse({ type: ContentPageDto })
  @ApiBadRequest('`id` is not a UUID, invalid `limit` or malformed `cursor`.')
  @ApiNotFound(OUT_OF_SCOPE)
  @ApiGone(REVOKED)
  getFolderContents(
    @Param('token') token: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.publicSharesService.getFolderContents(token, id, query);
  }

  @Get(':token/files/:id/view-url')
  @ApiOperation({
    summary: 'Signed URL for viewing a shared file inline',
    description: 'Short-lived (5 minutes) URL for an in-browser PDF viewer.',
  })
  @ApiParam(TOKEN_PARAM)
  @ApiParam(FILE_ID_PARAM)
  @ApiOkResponse({ type: SignedUrlResponseDto })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(OUT_OF_SCOPE)
  @ApiGone(REVOKED)
  getFileViewUrl(
    @Param('token') token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.publicSharesService.getFileViewUrl(token, id);
  }

  @Get(':token/files/:id/download-url')
  @ApiOperation({
    summary: 'Signed URL for downloading a shared file',
    description:
      'Short-lived (5 minutes) URL served with `Content-Disposition: attachment`.',
  })
  @ApiParam(TOKEN_PARAM)
  @ApiParam(FILE_ID_PARAM)
  @ApiOkResponse({ type: SignedUrlResponseDto })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(OUT_OF_SCOPE)
  @ApiGone(REVOKED)
  getFileDownloadUrl(
    @Param('token') token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.publicSharesService.getFileDownloadUrl(token, id);
  }

  @Get(':token/files/:id')
  @ApiOperation({
    summary: 'Metadata of a shared file',
    description: "Name, size and MIME type, for the viewer's header.",
  })
  @ApiParam(TOKEN_PARAM)
  @ApiParam(FILE_ID_PARAM)
  @ApiOkResponse({ type: PublicFileSummaryResponseDto })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(OUT_OF_SCOPE)
  @ApiGone(REVOKED)
  getFileSummary(
    @Param('token') token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.publicSharesService.getFileSummary(token, id);
  }
}
