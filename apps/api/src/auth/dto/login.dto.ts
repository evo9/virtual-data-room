import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'jane@example.com', maxLength: 255 })
  @IsEmail({}, { message: 'Enter a valid email' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'correct-horse-battery', maxLength: 72 })
  @IsString()
  @IsNotEmpty({ message: 'Enter your password' })
  @MaxLength(72)
  password!: string;
}
