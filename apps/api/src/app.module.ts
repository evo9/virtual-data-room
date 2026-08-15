import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [ConfigModule.forRoot(), PrismaModule],
    controllers: [AppController],
})
export class AppModule {
}
