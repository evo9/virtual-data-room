import { IsEmail, IsEnum, IsUUID, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShareMode, ShareResourceType } from '@prisma/client';

export class CreateShareDto {
  @ApiProperty({ enum: ShareResourceType, enumName: 'ShareResourceType' })
  @IsEnum(ShareResourceType)
  resourceType!: ShareResourceType;

  @ApiProperty({
    format: 'uuid',
    description:
      'Id of the data room, folder or file to share. The caller must own it.',
  })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({
    enum: ShareMode,
    enumName: 'ShareMode',
    description:
      '`PUBLIC_LINK` - anyone with the generated link can view, no account needed. `USER` - a specific registered user, identified by `granteeEmail`.',
  })
  @IsEnum(ShareMode)
  mode!: ShareMode;

  @ApiPropertyOptional({
    example: 'colleague@example.com',
    description:
      'Required when `mode` is `USER`, ignored otherwise. Trimmed and lowercased. The person does not need to be registered yet - the share applies as soon as an account with this email exists.',
  })
  @ValidateIf((dto: CreateShareDto) => dto.mode === 'USER')
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Enter a valid email' })
  granteeEmail?: string;
}
