import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Jane Doe', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'Enter your name' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'jane@example.com',
    maxLength: 255,
    description:
      'Unique, case-insensitive. Also the address others use to share with this user.',
  })
  @IsEmail({}, { message: 'Enter a valid email' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'correct-horse-battery',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72)
  password!: string;
}
