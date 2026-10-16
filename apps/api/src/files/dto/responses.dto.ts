import { ApiProperty } from '@nestjs/swagger';

export class UploadIntentResponseDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Id of the pending file. Pass it to `POST /files/{id}/complete` once the upload has finished.',
  })
  fileId!: string;

  @ApiProperty({
    example: 'Q3 report (1).pdf',
    description:
      'Final file name. Differs from the requested name when it clashed with an existing file in the same folder.',
  })
  name!: string;

  @ApiProperty({
    example:
      'https://<project>.supabase.co/storage/v1/object/upload/sign/data-room/<key>?token=...',
    description:
      'Signed Supabase Storage URL. Upload the PDF straight to it with `PUT` and a multipart/form-data body (this is what supabase-js `uploadToSignedUrl` sends; the Storage `apikey` header is required). The API never receives the file bytes.',
  })
  uploadUrl!: string;
}

export class CompleteUploadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Q3 report.pdf' })
  name!: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  folderId!: string | null;
}

export class FileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Q3 report.pdf' })
  name!: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  folderId!: string | null;

  @ApiProperty({ format: 'uuid' })
  dataRoomId!: string;

  @ApiProperty({ example: 1048576, description: 'Size in bytes.' })
  size!: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the upload was confirmed.',
  })
  uploadedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class FileDetailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Q3 report.pdf' })
  name!: string;

  @ApiProperty({ example: 1048576, description: 'Size in bytes.' })
  size!: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  folderId!: string | null;

  @ApiProperty({ format: 'uuid' })
  dataRoomId!: string;
}

export class SignedUrlResponseDto {
  @ApiProperty({
    example:
      'https://<project>.supabase.co/storage/v1/object/sign/data-room/<key>?token=...',
    description:
      'Signed storage URL, valid for 5 minutes. Request a fresh one instead of caching it.',
  })
  url!: string;
}
