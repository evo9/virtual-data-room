import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Share, ShareResourceType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CoverageEntry,
  dataRoomScope,
  fileScope,
  folderScope,
  requireAccess,
} from '@/common/access';
import { CreateShareDto } from './dto/create-share.dto';

interface ResolvedResource {
  name: string;
  dataRoomId: string;
  chain: CoverageEntry[];
}

export interface ReceivedShare {
  shareId: string;
  resourceType: ShareResourceType;
  resourceId: string;
  resourceName: string;
  dataRoomId: string;
  sharedAt: Date;
}

@Injectable()
export class SharesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateShareDto): Promise<Share> {
    await this.resolveOwnedResource(userId, dto.resourceType, dto.resourceId);

    const existing = await this.prisma.share.findFirst({
      where: {
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        mode: dto.mode,
        revokedAt: null,
        ...(dto.mode === 'USER' ? { granteeEmail: dto.granteeEmail } : {}),
      },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.share.create({
      data: {
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        mode: dto.mode,
        granteeEmail: dto.mode === 'USER' ? dto.granteeEmail : null,
        token:
          dto.mode === 'PUBLIC_LINK'
            ? randomBytes(24).toString('base64url')
            : null,
        createdById: userId,
      },
    });
  }

  async list(
    userId: string,
    resourceType: ShareResourceType,
    resourceId: string,
  ): Promise<Share[]> {
    await this.resolveOwnedResource(userId, resourceType, resourceId);

    return this.prisma.share.findMany({
      where: { resourceType, resourceId, revokedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async revoke(userId: string, shareId: string): Promise<void> {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
    });
    if (!share) {
      throw new NotFoundException('Share not found');
    }
    await this.resolveOwnedResource(
      userId,
      share.resourceType,
      share.resourceId,
    );

    await this.prisma.share.update({
      where: { id: shareId },
      data: { revokedAt: new Date() },
    });
  }

  async getReceived(userId: string): Promise<ReceivedShare[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      return [];
    }

    const shares = await this.prisma.share.findMany({
      where: { mode: 'USER', granteeEmail: user.email, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const received: ReceivedShare[] = [];
    for (const share of shares) {
      const resource = await this.loadResource(
        share.resourceType,
        share.resourceId,
      );
      // The share outlives the resource it points at - polymorphic
      // reference, no FK. A dangling share is silently dropped rather than
      // surfaced as a dead link.
      if (!resource) {
        continue;
      }
      received.push({
        shareId: share.id,
        resourceType: share.resourceType,
        resourceId: share.resourceId,
        resourceName: resource.name,
        dataRoomId: resource.dataRoomId,
        sharedAt: share.createdAt,
      });
    }
    return received;
  }

  /** Only the owner of the underlying resource may manage shares on it. */
  private async resolveOwnedResource(
    userId: string,
    resourceType: ShareResourceType,
    resourceId: string,
  ): Promise<ResolvedResource> {
    const resource = await this.loadResource(resourceType, resourceId);
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    await requireAccess(
      this.prisma,
      { userId },
      resource.dataRoomId,
      resource.chain,
      'OWNER',
    );
    return resource;
  }

  private async loadResource(
    resourceType: ShareResourceType,
    resourceId: string,
  ): Promise<ResolvedResource | null> {
    if (resourceType === 'DATAROOM') {
      const dataRoom = await this.prisma.dataRoom.findUnique({
        where: { id: resourceId },
        select: { id: true, name: true },
      });
      if (!dataRoom) return null;
      const scope = dataRoomScope(dataRoom.id);
      return { name: dataRoom.name, ...scope };
    }

    if (resourceType === 'FOLDER') {
      const folder = await this.prisma.folder.findUnique({
        where: { id: resourceId },
      });
      if (!folder) return null;
      const scope = folderScope(folder);
      return { name: folder.name, ...scope };
    }

    const file = await this.prisma.file.findUnique({
      where: { id: resourceId },
    });
    if (!file) return null;
    const scope = await fileScope(this.prisma, file);
    return { name: file.name, ...scope };
  }
}
