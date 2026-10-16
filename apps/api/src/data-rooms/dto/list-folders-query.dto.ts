import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class ListFoldersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Folder whose direct subfolders to list. Omit to list the folders at the room root.',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
