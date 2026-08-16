import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { StorageService } from '@/storage/storage.service';
import { requireAccess } from '@/common/access';
import { resolveName } from '@/common/resolve-name';
import { toNameLower } from '@/common/name-lower';
import { UploadIntentDto } from './dto/upload-intent.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createUploadIntent(userId: string, dto: UploadIntentDto) {
    await requireAccess(this.prisma, userId, dto.dataRoomId, 'OWNER');

    let folderId: string | null = null;
    if (dto.folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: dto.folderId },
        select: { dataRoomId: true },
      });
      if (!folder || folder.dataRoomId !== dto.dataRoomId) {
        throw new NotFoundException('Folder not found');
      }
      folderId = dto.folderId;
    }

    const name = await resolveName(
      this.prisma,
      { dataRoomId: dto.dataRoomId, folderId },
      dto.name,
    );

    const id = randomUUID();
    const storageKey = randomUUID();

    await this.prisma.file.create({
      data: {
        id,
        name,
        nameLower: toNameLower(name),
        dataRoomId: dto.dataRoomId,
        folderId,
        size: dto.size,
        mimeType: dto.mimeType,
        storageKey,
        uploadedAt: null,
      },
    });

    const uploadUrl = await this.storage.createUploadUrl(storageKey);

    return { fileId: id, name, uploadUrl };
  }

  async completeUpload(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: { id: true, dataRoomId: true },
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    await requireAccess(this.prisma, userId, file.dataRoomId, 'OWNER');

    return this.prisma.file.update({
      where: { id: fileId },
      data: { uploadedAt: new Date() },
      select: { id: true, name: true, folderId: true },
    });
  }
}
