import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIuLi4ifQ.signature',
    description:
      'JWT access token, valid for 7 days. Send it as `Authorization: Bearer <accessToken>`. There is no refresh token - log in again after expiry.',
  })
  accessToken!: string;
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: 'jane@example.com',
    description: 'Always lowercase.',
  })
  email!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
