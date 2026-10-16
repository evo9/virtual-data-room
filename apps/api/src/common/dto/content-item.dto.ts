import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { PageOf } from '@/common/swagger/page-of';

export class ContentFolderItemDto {
  @ApiProperty({ enum: ['folder'] })
  type!: 'folder';

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

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class ContentFileItemDto {
  @ApiProperty({ enum: ['file'] })
  type!: 'file';

  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Q3 report.pdf' })
  name!: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Containing folder, or `null` for a file at the room root.',
  })
  folderId!: string | null;

  @ApiProperty({ example: 1048576, description: 'Size in bytes.' })
  size!: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/**
 * Folder contents listing: direct children only, folders first and then files,
 * each group sorted by name case-insensitively. Files whose upload was never
 * confirmed are not listed.
 */
@ApiExtraModels(ContentFolderItemDto, ContentFileItemDto)
export class ContentPageDto extends PageOf({
  type: 'array',
  items: {
    oneOf: [
      { $ref: getSchemaPath(ContentFolderItemDto) },
      { $ref: getSchemaPath(ContentFileItemDto) },
    ],
    discriminator: { propertyName: 'type' },
  },
}) {}
