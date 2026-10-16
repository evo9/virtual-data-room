import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShareMode, ShareResourceType } from '@prisma/client';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class ListSharesQueryDto extends PaginationQueryDto {
  @ApiProperty({ enum: ShareResourceType, enumName: 'ShareResourceType' })
  @IsEnum(ShareResourceType)
  resourceType!: ShareResourceType;

  @ApiProperty({
    format: 'uuid',
    description: 'Id of the resource whose shares to list.',
  })
  @IsUUID()
  resourceId!: string;

  @ApiPropertyOptional({
    enum: ShareMode,
    enumName: 'ShareMode',
    description: 'Return only shares of this mode.',
  })
  @IsOptional()
  @IsEnum(ShareMode)
  mode?: ShareMode;
}
