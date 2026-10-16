import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDataRoomDto {
  @ApiProperty({ example: 'Project Falcon - Series A', maxLength: 200 })
  @IsString()
  @IsNotEmpty({ message: 'Enter a data room name' })
  @MaxLength(200)
  name!: string;
}
