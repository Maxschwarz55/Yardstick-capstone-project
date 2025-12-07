import { Module } from '@nestjs/common';
import { SelfieController } from './selfie.controller';
import { SelfieService } from './selfie.service';
import { S3UploadService } from '../aws/s3upload.service';

@Module({
    controllers: [SelfieController],
    providers: [SelfieService, S3UploadService],
    exports: [SelfieService],
})
export class SelfieModule { }
