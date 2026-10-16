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
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';
import {
  BreadcrumbsResponseDto,
  DeletePreviewResponseDto,
  FolderResponseDto,
} from './dto/responses.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/decorators/current-user.decorator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { ContentPageDto } from '@/common/dto/content-item.dto';
import {
  ApiBadRequest,
  ApiConflict,
  ApiNotFound,
  ApiUnauthorized,
  MISSING_TOKEN_DESCRIPTION,
} from '@/common/swagger/error-responses';

const FOLDER_ID_PARAM = {
  name: 'id',
  format: 'uuid',
  description: 'Folder id.',
} as const;
const FOLDER_NOT_FOUND =
  'The folder does not exist, or the caller has no access to it (the two cases are deliberately indistinguishable).';
const OWNER_ONLY_NOT_FOUND =
  'The folder does not exist, or the caller is not the owner of its room (a viewer gets 404 on mutations too).';

@ApiTags('Folders')
@ApiBearerAuth()
@ApiUnauthorized(MISSING_TOKEN_DESCRIPTION)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a folder',
    description:
      'Creates a folder at the room root, or inside `parentId`. Nesting depth is unlimited. Owner only.',
  })
  @ApiCreatedResponse({ type: FolderResponseDto })
  @ApiBadRequest(
    'Validation failed (empty or over-long name, ids that are not UUIDs).',
  )
  @ApiNotFound(
    'The room is not owned by the caller, or `parentId` does not exist in that room.',
  )
  @ApiConflict(
    'A folder with this name (ignoring case) already exists in the target location.',
  )
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFolderDto) {
    return this.foldersService.create(user.id, dto);
  }

  @Get(':id/contents')
  @ApiOperation({
    summary: "List a folder's contents",
    description:
      'Direct children only: subfolders first, then files, each group sorted by name (case-insensitive). Files whose upload has not been confirmed are not listed. Also works for a viewer when the folder, or any folder above it, has been shared with them.',
  })
  @ApiParam(FOLDER_ID_PARAM)
  @ApiOkResponse({ type: ContentPageDto })
  @ApiBadRequest('`id` is not a UUID, invalid `limit` or malformed `cursor`.')
  @ApiNotFound(FOLDER_NOT_FOUND)
  getContents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.foldersService.getContents(user.id, id, query);
  }

  @Get(':id/breadcrumbs')
  @ApiOperation({
    summary: 'Breadcrumb trail',
    description:
      'Path from the room down to the folder. A viewer who only received a share on some folder sees the trail starting at that folder - names of anything above the share boundary are never revealed. Bounded by tree depth, so it is not paginated.',
  })
  @ApiParam(FOLDER_ID_PARAM)
  @ApiOkResponse({ type: BreadcrumbsResponseDto })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(FOLDER_NOT_FOUND)
  getBreadcrumbs(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.foldersService.getBreadcrumbs(user.id, id);
  }

  @Get(':id/delete-preview')
  @ApiOperation({
    summary: 'Preview what deleting a folder removes',
    description:
      'Counts of nested folders, files and bytes that `DELETE /folders/{id}` would remove. Intended for the confirmation dialog. Owner only.',
  })
  @ApiParam(FOLDER_ID_PARAM)
  @ApiOkResponse({ type: DeletePreviewResponseDto })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(OWNER_ONLY_NOT_FOUND)
  getDeletePreview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.foldersService.getDeletePreview(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Rename a folder',
    description: 'Owner only. Moving folders is not supported.',
  })
  @ApiParam(FOLDER_ID_PARAM)
  @ApiOkResponse({ type: FolderResponseDto })
  @ApiBadRequest(
    'Validation failed (`id` is not a UUID, empty or over-long name).',
  )
  @ApiNotFound(OWNER_ONLY_NOT_FOUND)
  @ApiConflict(
    'A sibling folder with this name (ignoring case) already exists.',
  )
  rename(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameFolderDto,
  ) {
    return this.foldersService.rename(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a folder with everything inside',
    description:
      'Removes the folder, all nested folders and all files in one database transaction, then deletes the stored objects. If the storage cleanup fails the objects stay orphaned in the bucket but the data room is already consistent. Not reversible. Owner only.',
  })
  @ApiParam(FOLDER_ID_PARAM)
  @ApiNoContentResponse({ description: 'Deleted.' })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(OWNER_ONLY_NOT_FOUND)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.foldersService.remove(user.id, id);
  }
}
