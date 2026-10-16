import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({
    example: 'Financials',
    maxLength: 200,
    description:
      'Trimmed. Must be unique among the siblings in the target location, ignoring case - otherwise 409.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Enter a folder name' })
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Room to create the folder in. Must be owned by the caller.',
  })
  @IsUUID()
  dataRoomId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Parent folder, which must belong to the same room. Omit to create the folder at the room root.',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
