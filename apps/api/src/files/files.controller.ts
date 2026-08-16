import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { FilesService } from './files.service';
import { UploadIntentDto } from './dto/upload-intent.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/decorators/current-user.decorator';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-intent')
  createUploadIntent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadIntentDto,
  ) {
    return this.filesService.createUploadIntent(user.id, dto);
  }

  @Post(':id/complete')
  completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.filesService.completeUpload(user.id, id);
  }
}
