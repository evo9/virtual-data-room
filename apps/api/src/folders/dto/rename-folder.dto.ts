import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RenameFolderDto {
  @ApiProperty({
    example: 'Financials 2025',
    maxLength: 200,
    description:
      "Trimmed. Must be unique among the folder's siblings, ignoring case - otherwise 409.",
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Enter a folder name' })
  @MaxLength(200)
  name!: string;
}
