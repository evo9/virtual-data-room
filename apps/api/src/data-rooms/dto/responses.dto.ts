import { ApiProperty } from '@nestjs/swagger';
import { PageOf } from '@/common/swagger/page-of';

export class DataRoomResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Project Falcon - Series A' })
  name!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class DataRoomDetailResponseDto extends DataRoomResponseDto {
  @ApiProperty({
    enum: ['OWNER', 'VIEWER'],
    description:
      "The caller's level on this room. `OWNER` can modify it, `VIEWER` (room shared with the caller) is read-only.",
  })
  accessLevel!: 'OWNER' | 'VIEWER';
}

export class FolderNodeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Financials' })
  name!: string;

  @ApiProperty({
    description:
      'Whether the folder has subfolders. Lets a tree UI render an expand arrow without loading the children first.',
  })
  hasChildren!: boolean;
}

export class DataRoomPageDto extends PageOf({ type: [DataRoomResponseDto] }) {}

export class FolderNodePageDto extends PageOf({
  type: [FolderNodeResponseDto],
}) {}
