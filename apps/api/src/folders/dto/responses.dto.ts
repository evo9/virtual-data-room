import { ApiProperty } from '@nestjs/swagger';

export class FolderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Financials' })
  name!: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Parent folder, or `null` for a folder at the room root.',
  })
  parentId!: string | null;

  @ApiProperty({ format: 'uuid' })
  dataRoomId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class BreadcrumbFolderDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Financials' })
  name!: string;
}

export class BreadcrumbsResponseDto {
  @ApiProperty({ format: 'uuid' })
  dataRoomId!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Room name for the first crumb. `null` when the caller only has access through a share on a folder inside the room - the room itself is not visible to them.',
  })
  dataRoomName!: string | null;

  @ApiProperty({
    type: [BreadcrumbFolderDto],
    description:
      'Folders from the top-most visible one down to the requested folder (inclusive). For a shared-folder viewer the trail starts at the shared folder, never above it.',
  })
  folders!: BreadcrumbFolderDto[];

  @ApiProperty({ enum: ['OWNER', 'VIEWER'] })
  accessLevel!: 'OWNER' | 'VIEWER';
}

export class DeletePreviewResponseDto {
  @ApiProperty({
    example: 3,
    description: 'Number of nested folders, not counting the folder itself.',
  })
  folderCount!: number;

  @ApiProperty({
    example: 12,
    description: 'Number of uploaded files anywhere in the subtree.',
  })
  fileCount!: number;

  @ApiProperty({
    example: 23068672,
    description: 'Combined size of those files in bytes.',
  })
  totalSize!: number;
}
