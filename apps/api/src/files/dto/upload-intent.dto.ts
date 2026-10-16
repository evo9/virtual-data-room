import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export class UploadIntentDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Room to upload into. Must be owned by the caller.',
  })
  @IsUUID()
  dataRoomId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Target folder in the same room. Omit to upload to the room root.',
  })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiProperty({
    example: 'Q3 report.pdf',
    maxLength: 255,
    description:
      'Original file name, trimmed. A clash with an existing file in the folder (ignoring case) is resolved by renaming to `name (1).pdf` - read the final name from the response.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Enter a file name' })
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: 1048576,
    minimum: 1,
    maximum: MAX_FILE_SIZE_BYTES,
    description: 'File size in bytes, at most 50 MB.',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES, { message: 'File exceeds the 50 MB limit' })
  size!: number;

  @ApiProperty({
    enum: ['application/pdf'],
    description: 'Only PDF files are accepted.',
  })
  @IsIn(['application/pdf'], { message: 'Only PDF files are supported' })
  mimeType!: string;
}
