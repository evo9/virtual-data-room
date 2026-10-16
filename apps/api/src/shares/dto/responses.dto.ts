import { ApiProperty } from '@nestjs/swagger';
import { ShareMode, ShareResourceType } from '@prisma/client';
import { PageOf } from '@/common/swagger/page-of';

export class ShareResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ShareResourceType, enumName: 'ShareResourceType' })
  resourceType!: ShareResourceType;

  @ApiProperty({
    format: 'uuid',
    description: 'Id of the shared data room, folder or file.',
  })
  resourceId!: string;

  @ApiProperty({ enum: ShareMode, enumName: 'ShareMode' })
  mode!: ShareMode;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Zk3q0uYJc1sH7mT9wQvX2eN5rLpB8dAaFgKjC4oIuVyM',
    description:
      'URL-safe secret for a `PUBLIC_LINK` share - build the link as `<web app>/share/<token>`. `null` for `USER` shares.',
  })
  token!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'colleague@example.com',
    description:
      "Invited user's email (lowercase) for a `USER` share. `null` for `PUBLIC_LINK`.",
  })
  granteeEmail!: string | null;

  @ApiProperty({ format: 'uuid', description: 'User who created the share.' })
  createdById!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description:
      'Set once the share has been revoked. Listings only return active shares, so this is `null` in practice.',
  })
  revokedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class ReceivedShareResponseDto {
  @ApiProperty({ format: 'uuid' })
  shareId!: string;

  @ApiProperty({ enum: ShareResourceType, enumName: 'ShareResourceType' })
  resourceType!: ShareResourceType;

  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  @ApiProperty({
    example: 'Financials',
    description: 'Current name of the shared resource.',
  })
  resourceName!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Room that contains the shared resource.',
  })
  dataRoomId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  sharedAt!: Date;
}

export class SharePageDto extends PageOf({ type: [ShareResponseDto] }) {}

export class ReceivedSharePageDto extends PageOf({
  type: [ReceivedShareResponseDto],
}) {}
