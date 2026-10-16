import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { HealthResponseDto } from './health-response.dto';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Liveness check',
    description:
      'No authentication. Returns 200 whenever the process is up; it does not touch the database or storage.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth() {
    return { status: 'ok' };
  }
}
