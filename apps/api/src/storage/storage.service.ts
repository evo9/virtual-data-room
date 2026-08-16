import { createClient } from '@supabase/supabase-js';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SIGNED_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class StorageService {
  private readonly client: ReturnType<typeof createClient>;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
    this.bucket = config.getOrThrow<string>('SUPABASE_BUCKET');
  }

  async createUploadUrl(storageKey: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(storageKey);
    if (error || !data) {
      throw new InternalServerErrorException('Could not prepare the upload');
    }
    return data.signedUrl;
  }

  async createDownloadUrl(
    storageKey: string,
    fileName: string,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(storageKey, SIGNED_URL_TTL_SECONDS, {
        download: fileName,
      });
    if (error || !data) {
      throw new InternalServerErrorException('Could not prepare the download');
    }
    return data.signedUrl;
  }

  async createViewUrl(storageKey: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(storageKey, SIGNED_URL_TTL_SECONDS);
    if (error || !data) {
      throw new InternalServerErrorException('Could not prepare the file');
    }
    return data.signedUrl;
  }

  async removeObject(storageKey: string): Promise<void> {
    await this.removeObjects([storageKey]);
  }

  async removeObjects(storageKeys: string[]): Promise<void> {
    if (storageKeys.length === 0) return;
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove(storageKeys);
    if (error) {
      throw new InternalServerErrorException('Could not delete the file');
    }
  }
}
