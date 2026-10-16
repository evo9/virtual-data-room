import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';
import { ListSharesQueryDto } from './dto/list-shares-query.dto';
import {
  ReceivedSharePageDto,
  SharePageDto,
  ShareResponseDto,
} from './dto/responses.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/decorators/current-user.decorator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import {
  ApiBadRequest,
  ApiNotFound,
  ApiUnauthorized,
  MISSING_TOKEN_DESCRIPTION,
} from '@/common/swagger/error-responses';

@ApiTags('Shares')
@ApiBearerAuth()
@ApiUnauthorized(MISSING_TOKEN_DESCRIPTION)
@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post()
  @ApiOperation({
    summary: 'Share a room, folder or file (read-only)',
    description: [
      'Grants read-only access. Sharing a room or folder covers everything inside it, including items added later.',
      '',
      '- `PUBLIC_LINK` - the response contains a `token`; anyone with it can browse through the `/public/{token}/...` endpoints without an account.',
      '- `USER` - the registered user with `granteeEmail` sees the resource under `GET /shares/received` and can read it with the regular endpoints.',
      '',
      'Idempotent: if an active share with the same resource, mode (and email for `USER`) already exists, it is returned instead of creating a duplicate. Owner only.',
    ].join('\n'),
  })
  @ApiCreatedResponse({ type: ShareResponseDto })
  @ApiBadRequest(
    'Validation failed (unknown `resourceType` or `mode`, `USER` share without a valid `granteeEmail`).',
  )
  @ApiNotFound('The resource does not exist or is not owned by the caller.')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateShareDto) {
    return this.sharesService.create(user.id, dto);
  }

  @Get('received')
  @ApiOperation({
    summary: 'Resources shared with me',
    description:
      "Active `USER` shares addressed to the caller's email, newest first. Shares whose resource has since been deleted are skipped. Open an item with the regular read endpoints: `GET /data-rooms/{resourceId}`, `GET /folders/{resourceId}/contents` or `GET /files/{resourceId}`. Public links are never listed here.",
  })
  @ApiOkResponse({ type: ReceivedSharePageDto })
  @ApiBadRequest('Invalid `limit` or malformed `cursor`.')
  getReceived(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.sharesService.getReceived(user.id, query);
  }

  @Get()
  @ApiOperation({
    summary: 'List active shares of a resource',
    description:
      'Feeds the "Share" dialog: who the resource is shared with and which public links exist. Newest first; revoked shares are excluded. Owner only.',
  })
  @ApiOkResponse({ type: SharePageDto })
  @ApiBadRequest(
    'Missing or invalid `resourceType` / `resourceId`, invalid `limit` or malformed `cursor`.',
  )
  @ApiNotFound('The resource does not exist or is not owned by the caller.')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSharesQueryDto,
  ) {
    return this.sharesService.list(
      user.id,
      query.resourceType,
      query.resourceId,
      query,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Revoke a share',
    description:
      'Takes effect immediately for new requests: a revoked public link answers `410 Gone`, and a user share stops resolving. Signed file URLs that were already handed out keep working until they expire (5 minutes). Owner only.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Share id.' })
  @ApiNoContentResponse({ description: 'Revoked.' })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(
    'The share does not exist, or its resource is not owned by the caller.',
  )
  async revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.sharesService.revoke(user.id, id);
  }
}
