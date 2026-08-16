import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { requireAccess } from '@/common/access';
import { ContentItem, fetchContents } from '@/common/contents';
import {
  decodeContentsCursor,
  decodeDataRoomsCursor,
  encodeCursor,
  Page,
} from '@/common/pagination';
import { parseCursor } from '@/common/parse-cursor';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { CreateDataRoomDto } from './dto/create-data-room.dto';

export const DEFAULT_DATA_ROOM_NAME = 'My Data Room';

export interface DataRoomSummary {
  id: string;
  name: string;
  createdAt: Date;
}

export interface FolderNode {
  id: string;
  name: string;
  hasChildren: boolean;
}

@Injectable()
export class DataRoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDataRoomDto) {
    return this.prisma.dataRoom.create({
      data: { name: dto.name.trim(), ownerId: userId },
      select: { id: true, name: true, createdAt: true },
    });
  }

  async findAllForUser(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Page<DataRoomSummary>> {
    const cursor = parseCursor(decodeDataRoomsCursor, query.cursor);
    const limit = query.limit;

    const where = cursor
      ? {
          ownerId: userId,
          OR: [
            { createdAt: { gt: new Date(cursor.c) } },
            { createdAt: new Date(cursor.c), id: { gt: cursor.i } },
          ],
        }
      : { ownerId: userId };

    const rows = await this.prisma.dataRoom.findMany({
      where,
      select: { id: true, name: true, createdAt: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    });

    if (rows.length > limit) {
      const items = rows.slice(0, limit);
      const last = items[items.length - 1];
      return {
        items,
        nextCursor: encodeCursor({
          t: 'dataRoom',
          c: last.createdAt.toISOString(),
          i: last.id,
        }),
      };
    }

    return { items: rows, nextCursor: null };
  }

  async getContents(
    userId: string,
    dataRoomId: string,
    query: PaginationQueryDto,
  ): Promise<Page<ContentItem>> {
    await requireAccess(this.prisma, userId, dataRoomId, 'VIEWER');
    const cursor = parseCursor(decodeContentsCursor, query.cursor);
    return fetchContents(this.prisma, dataRoomId, null, {
      cursor,
      limit: query.limit,
    });
  }

  async getFolders(
    userId: string,
    dataRoomId: string,
    parentId: string | null,
  ): Promise<FolderNode[]> {
    await requireAccess(this.prisma, userId, dataRoomId, 'VIEWER');
    const rows = await this.prisma.folder.findMany({
      where: { dataRoomId, parentId },
      select: { id: true, name: true, _count: { select: { children: true } } },
      orderBy: [{ nameLower: 'asc' }, { id: 'asc' }],
      take: 1000,
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      hasChildren: row._count.children > 0,
    }));
  }
}
