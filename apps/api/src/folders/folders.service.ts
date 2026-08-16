import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Folder } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { StorageService } from '@/storage/storage.service';
import { requireAccess } from '@/common/access';
import { ContentItem, fetchContents } from '@/common/contents';
import { decodeContentsCursor } from '@/common/pagination';
import type { Page } from '@/common/pagination';
import { parseCursor } from '@/common/parse-cursor';
import { toNameLower } from '@/common/name-lower';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';

const FOLDER_SELECT = {
  id: true,
  name: true,
  parentId: true,
  dataRoomId: true,
  createdAt: true,
} as const;

export interface DeletePreview {
  folderCount: number;
  fileCount: number;
  totalSize: number;
}

@Injectable()
export class FoldersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(userId: string, dto: CreateFolderDto) {
    await requireAccess(this.prisma, userId, dto.dataRoomId, 'OWNER');

    let parentPath = '';
    if (dto.parentId) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: dto.parentId },
        select: { dataRoomId: true, path: true },
      });
      if (!parent || parent.dataRoomId !== dto.dataRoomId) {
        throw new NotFoundException('Parent folder not found');
      }
      parentPath = parent.path;
    }

    await this.assertNameAvailable(
      dto.dataRoomId,
      dto.parentId ?? null,
      dto.name,
    );

    const id = randomUUID();
    return this.prisma.folder.create({
      data: {
        id,
        name: dto.name,
        nameLower: toNameLower(dto.name),
        dataRoomId: dto.dataRoomId,
        parentId: dto.parentId ?? null,
        path: `${parentPath}${id}/`,
      },
      select: FOLDER_SELECT,
    });
  }

  async getContents(
    userId: string,
    folderId: string,
    query: PaginationQueryDto,
  ): Promise<Page<ContentItem>> {
    const folder = await this.getFolderOrThrow(folderId);
    await requireAccess(this.prisma, userId, folder.dataRoomId, 'VIEWER');
    const cursor = parseCursor(decodeContentsCursor, query.cursor);
    return fetchContents(this.prisma, folder.dataRoomId, folder.id, {
      cursor,
      limit: query.limit,
    });
  }

  async getBreadcrumbs(userId: string, folderId: string) {
    const folder = await this.getFolderOrThrow(folderId);
    await requireAccess(this.prisma, userId, folder.dataRoomId, 'VIEWER');

    const ancestorIds = folder.path.split('/').filter(Boolean);

    const [ancestors, dataRoom] = await Promise.all([
      this.prisma.folder.findMany({
        where: { id: { in: ancestorIds } },
        select: { id: true, name: true },
      }),
      this.prisma.dataRoom.findUniqueOrThrow({
        where: { id: folder.dataRoomId },
        select: { id: true, name: true },
      }),
    ]);
    const nameById = new Map(ancestors.map((a) => [a.id, a.name]));

    return {
      dataRoom,
      folders: ancestorIds.map((id) => ({ id, name: nameById.get(id) ?? '' })),
    };
  }

  async rename(userId: string, folderId: string, dto: RenameFolderDto) {
    const folder = await this.getFolderOrThrow(folderId);
    await requireAccess(this.prisma, userId, folder.dataRoomId, 'OWNER');

    await this.assertNameAvailable(
      folder.dataRoomId,
      folder.parentId,
      dto.name,
      folder.id,
    );

    return this.prisma.folder.update({
      where: { id: folder.id },
      data: { name: dto.name, nameLower: toNameLower(dto.name) },
      select: FOLDER_SELECT,
    });
  }

  async getDeletePreview(
    userId: string,
    folderId: string,
  ): Promise<DeletePreview> {
    const folder = await this.getFolderOrThrow(folderId);
    await requireAccess(this.prisma, userId, folder.dataRoomId, 'VIEWER');

    const prefix = `${folder.path}%`;

    const [[folderCountRow], [fileStatsRow]] = await Promise.all([
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) AS count
        FROM "Folder"
        WHERE path LIKE ${prefix} AND id <> ${folder.id}
      `,
      this.prisma.$queryRaw<{ fileCount: bigint; totalSize: bigint }[]>`
        SELECT COUNT(f.*) AS "fileCount", COALESCE(SUM(f.size), 0) AS "totalSize"
        FROM "File" f
        JOIN "Folder" fo ON fo.id = f."folderId"
        WHERE fo.path LIKE ${prefix} AND f."uploadedAt" IS NOT NULL
      `,
    ]);

    return {
      folderCount: Number(folderCountRow.count),
      fileCount: Number(fileStatsRow.fileCount),
      totalSize: Number(fileStatsRow.totalSize),
    };
  }

  async remove(userId: string, folderId: string): Promise<void> {
    const folder = await this.getFolderOrThrow(folderId);
    await requireAccess(this.prisma, userId, folder.dataRoomId, 'OWNER');

    const prefix = `${folder.path}%`;

    const deletedStorageKeys = await this.prisma.$transaction(async (tx) => {
      const subtreeFolders = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Folder" WHERE path LIKE ${prefix}
      `;
      const subtreeIds = subtreeFolders.map((f) => f.id);

      const files = await tx.file.findMany({
        where: { folderId: { in: subtreeIds } },
        select: { id: true, storageKey: true },
      });

      await tx.file.deleteMany({
        where: { id: { in: files.map((f) => f.id) } },
      });
      await tx.folder.deleteMany({ where: { id: { in: subtreeIds } } });

      return files.map((f) => f.storageKey);
    });

    // Row deletion already committed; an orphaned bucket object on storage
    // failure is an accepted MVP trade-off (apps/api/CLAUDE.md).
    await this.storage.removeObjects(deletedStorageKeys).catch(() => undefined);
  }

  private async getFolderOrThrow(id: string): Promise<Folder> {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    return folder;
  }

  private async assertNameAvailable(
    dataRoomId: string,
    parentId: string | null,
    name: string,
    excludeFolderId?: string,
  ): Promise<void> {
    const conflict = await this.prisma.folder.findFirst({
      where: {
        dataRoomId,
        parentId,
        nameLower: toNameLower(name),
        ...(excludeFolderId ? { id: { not: excludeFolderId } } : {}),
      },
      select: { id: true },
    });
    if (conflict) {
      throw new ConflictException(
        `A folder named "${name}" already exists here`,
      );
    }
  }
}
