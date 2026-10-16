import { ApiProperty } from '@nestjs/swagger';
import { ShareResourceType } from '@prisma/client';

export class PublicShareSummaryResponseDto {
  @ApiProperty({
    enum: ShareResourceType,
    enumName: 'ShareResourceType',
    description:
      'What the link points at - decides how the UI should start: `DATAROOM` -> `GET /public/{token}/contents`; `FOLDER` -> `GET /public/{token}/folders/{resourceId}/contents`; `FILE` -> `GET /public/{token}/files/{resourceId}/view-url`.',
  })
  resourceType!: ShareResourceType;

  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  @ApiProperty({ example: 'Financials' })
  resourceName!: string;

  @ApiProperty({ format: 'uuid' })
  dataRoomId!: string;

  @ApiProperty({
    required: false,
    example: 1048576,
    description: 'Size in bytes. Only present for `FILE` links.',
  })
  size?: number;

  @ApiProperty({
    required: false,
    example: 'application/pdf',
    description: 'Only present for `FILE` links.',
  })
  mimeType?: string;
}

export class PublicFileSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Q3 report.pdf' })
  name!: string;

  @ApiProperty({ example: 1048576, description: 'Size in bytes.' })
  size!: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;
}
