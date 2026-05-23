import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../config/config.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly config: AppConfigService) {
    this.s3 = new S3Client({
      region: this.config.awsRegion,
      ...(this.config.awsAccessKeyId && this.config.awsSecretAccessKey
        ? { credentials: { accessKeyId: this.config.awsAccessKeyId, secretAccessKey: this.config.awsSecretAccessKey } }
        : {}),
    });
  }

  validateFile(mimeType: string, sizeBytes: number) {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(`File type ${mimeType} is not allowed`);
    }
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.awsS3Bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    // Return the public CDN URL (configure bucket policy or CloudFront separately)
    return `https://${this.config.awsS3Bucket}.s3.${this.config.awsRegion}.amazonaws.com/${key}`;
  }

  async delete(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.config.awsS3Bucket,
        Key: key,
      }),
    );
    this.logger.log(`Deleted S3 object: ${key}`);
  }

  async presignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.awsS3Bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }
}
