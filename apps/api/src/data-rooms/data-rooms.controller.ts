import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DataRoomsService } from './data-rooms.service';
import { CreateDataRoomDto } from './dto/create-data-room.dto';
import {
  DataRoomDetailResponseDto,
  DataRoomPageDto,
  DataRoomResponseDto,
  FolderNodePageDto,
} from './dto/responses.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/decorators/current-user.decorator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { ContentPageDto } from '@/common/dto/content-item.dto';
import {
  ApiBadRequest,
  ApiNotFound,
  ApiUnauthorized,
  MISSING_TOKEN_DESCRIPTION,
} from '@/common/swagger/error-responses';
import { ListFoldersQueryDto } from './dto/list-folders-query.dto';

const ROOM_ID_PARAM = {
  name: 'id',
  format: 'uuid',
  description: 'Data room id.',
} as const;
const ROOM_NOT_FOUND =
  'The room does not exist, or the caller has no access to it (the two cases are deliberately indistinguishable).';

@ApiTags('Data rooms')
@ApiBearerAuth()
@ApiUnauthorized(MISSING_TOKEN_DESCRIPTION)
@Controller('data-rooms')
export class DataRoomsController {
  constructor(private readonly dataRoomsService: DataRoomsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a data room',
    description:
      'Every user already gets one room at registration; this creates an additional one owned by the caller.',
  })
  @ApiCreatedResponse({ type: DataRoomResponseDto })
  @ApiBadRequest('Validation failed (empty or over-long name).')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDataRoomDto,
  ) {
    return this.dataRoomsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List my data rooms',
    description:
      'Only rooms the caller owns, oldest first. Resources shared with the caller are listed by `GET /shares/received` instead.',
  })
  @ApiOkResponse({ type: DataRoomPageDto })
  @ApiBadRequest('Invalid `limit` or malformed `cursor`.')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.dataRoomsService.findAllForUser(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a data room',
    description:
      'Works for rooms the caller owns and for rooms shared with them as a whole; `accessLevel` tells which.',
  })
  @ApiParam(ROOM_ID_PARAM)
  @ApiOkResponse({ type: DataRoomDetailResponseDto })
  @ApiBadRequest('`id` is not a UUID.')
  @ApiNotFound(ROOM_NOT_FOUND)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dataRoomsService.findOne(user.id, id);
  }

  @Get(':id/contents')
  @ApiOperation({
    summary: 'List the room root',
    description:
      'Direct children of the room root: folders first, then files, each group sorted by name (case-insensitive). To open a folder use `GET /folders/{id}/contents`.',
  })
  @ApiParam(ROOM_ID_PARAM)
  @ApiOkResponse({ type: ContentPageDto })
  @ApiBadRequest('`id` is not a UUID, invalid `limit` or malformed `cursor`.')
  @ApiNotFound(ROOM_NOT_FOUND)
  getContents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.dataRoomsService.getContents(user.id, id, query);
  }

  @Get(':id/folders')
  @ApiOperation({
    summary: 'List subfolders (folder tree)',
    description:
      'Folders only, no files - the lazy-loading feed for a sidebar tree or a "move to" picker. Lists the root folders by default, or the children of `parentId`.',
  })
  @ApiParam(ROOM_ID_PARAM)
  @ApiOkResponse({ type: FolderNodePageDto })
  @ApiBadRequest(
    '`id` or `parentId` is not a UUID, invalid `limit` or malformed `cursor`.',
  )
  @ApiNotFound(
    `${ROOM_NOT_FOUND} Also returned when \`parentId\` does not belong to this room.`,
  )
  getFolders(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListFoldersQueryDto,
  ) {
    return this.dataRoomsService.getFolders(
      user.id,
      id,
      query.parentId ?? null,
      query,
    );
  }
}
