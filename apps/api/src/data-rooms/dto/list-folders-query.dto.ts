import { IsOptional, IsUUID } from 'class-validator';

export class ListFoldersQueryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
