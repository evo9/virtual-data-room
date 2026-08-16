import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DataRoomsModule } from '@/data-rooms/data-rooms.module';
import { FoldersModule } from '@/folders/folders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DataRoomsModule,
    FoldersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
