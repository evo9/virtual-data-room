import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoveFileDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    nullable: true,
    description:
      'Destination folder in the same room. `null` or omitted moves the file to the room root.',
  })
  @IsOptional()
  @IsUUID()
  targetFolderId?: string | null;
}
