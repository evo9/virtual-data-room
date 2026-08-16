import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DataRoomsModule } from '@/data-rooms/data-rooms.module';
import { FoldersModule } from '@/folders/folders.module';
import { StorageModule } from '@/storage/storage.module';
import { FilesModule } from '@/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    AuthModule,
    DataRoomsModule,
    FoldersModule,
    FilesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
