import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { resolveAccess, requireAccess } from './resolve-access';

function fakePrisma(ownerId: string | null): PrismaService {
  return {
    dataRoom: {
      findUnique: jest
        .fn()
        .mockResolvedValue(ownerId === null ? null : { ownerId }),
    },
  } as unknown as PrismaService;
}

describe('resolveAccess', () => {
  it('grants OWNER when the caller owns the data room', async () => {
    const prisma = fakePrisma('owner-1');
    await expect(resolveAccess(prisma, 'owner-1', 'room-1')).resolves.toBe(
      'OWNER',
    );
  });

  it('grants NONE to a different, real user who is not the owner', async () => {
    const prisma = fakePrisma('owner-1');
    await expect(resolveAccess(prisma, 'stranger-2', 'room-1')).resolves.toBe(
      'NONE',
    );
  });

  it('grants NONE when the data room does not exist', async () => {
    const prisma = fakePrisma(null);
    await expect(
      resolveAccess(prisma, 'owner-1', 'missing-room'),
    ).resolves.toBe('NONE');
  });
});

describe('requireAccess', () => {
  it('throws NotFoundException (404) for NONE against OWNER requirement', async () => {
    const prisma = fakePrisma('owner-1');
    await expect(
      requireAccess(prisma, 'stranger-2', 'room-1', 'OWNER'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException (404) for NONE against VIEWER requirement', async () => {
    const prisma = fakePrisma('owner-1');
    await expect(
      requireAccess(prisma, 'stranger-2', 'room-1', 'VIEWER'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not throw for OWNER against OWNER requirement', async () => {
    const prisma = fakePrisma('owner-1');
    await expect(
      requireAccess(prisma, 'owner-1', 'room-1', 'OWNER'),
    ).resolves.toBe('OWNER');
  });

  it('does not throw for OWNER against VIEWER requirement', async () => {
    const prisma = fakePrisma('owner-1');
    await expect(
      requireAccess(prisma, 'owner-1', 'room-1', 'VIEWER'),
    ).resolves.toBe('OWNER');
  });
});
