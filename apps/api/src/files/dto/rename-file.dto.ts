import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RenameFileDto {
  @ApiProperty({
    example: 'Q3 report - final.pdf',
    maxLength: 255,
    description:
      'Trimmed. If another file in the same folder already has this name (ignoring case) a numeric suffix is added: `name (1).pdf`. The stored object is not touched.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Enter a file name' })
  @MaxLength(255)
  name!: string;
}
