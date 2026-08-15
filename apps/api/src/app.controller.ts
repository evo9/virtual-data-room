import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getHello() {
        return null;
    }

    @Get('health')
    getHealth() {
        return {status: 'ok'};
    }
}
