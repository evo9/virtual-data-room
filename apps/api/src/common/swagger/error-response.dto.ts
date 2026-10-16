import { ApiProperty } from '@nestjs/swagger';

/** Shape of every error body produced by Nest's exception layer. */
export class ErrorResponseDto {
  @ApiProperty({ example: 404, description: 'HTTP status code.' })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Resource not found',
    description:
      'Human-readable message that is safe to show to the user as-is. Body validation failures (400) return an array with one message per invalid field.',
  })
  message!: string | string[];

  @ApiProperty({
    required: false,
    example: 'Not Found',
    description:
      'HTTP status name. Absent on bare 401 responses from the auth guard.',
  })
  error?: string;
}
