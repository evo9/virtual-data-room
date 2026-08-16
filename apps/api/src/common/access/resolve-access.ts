import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AccessLevel, meetsAccessLevel } from './access.types';

/**
 * Determines what the user can do with a data room.
 */
export async function resolveAccess(
  prisma: PrismaService,
  userId: string,
  dataRoomId: string,
): Promise<AccessLevel> {
  const dataRoom = await prisma.dataRoom.findUnique({
    where: { id: dataRoomId },
    select: { ownerId: true },
  });

  if (!dataRoom) {
    return 'NONE';
  }

  if (dataRoom.ownerId === userId) {
    return 'OWNER';
  }

  return 'NONE';
}

/**
 * Resolves access and enforces a minimum level. Unauthorized access throws
 * 404, not 403 - the API never confirms that a resource exists to a caller
 * who cannot see it.
 */
export async function requireAccess(
  prisma: PrismaService,
  userId: string,
  dataRoomId: string,
  required: AccessLevel,
): Promise<AccessLevel> {
  const level = await resolveAccess(prisma, userId, dataRoomId);
  if (!meetsAccessLevel(level, required)) {
    throw new NotFoundException('Data room not found');
  }
  return level;
}
