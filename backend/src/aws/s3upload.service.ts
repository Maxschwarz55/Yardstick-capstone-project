import {Injectable} from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3UploadService{
    private s3: AWS.S3;
    private bucket = process.env.S3_BUCKET_NAME!;

    constructor(){
        AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
        AWS.config.update({region: process.env.AWS_REGION});
        this.s3 = new AWS.S3();
    }

    async exists(key: string): Promise<boolean>{
        try{
            await this.s3
                .headObject({
                    Bucket: this.bucket,
                    Key: key,
                })
                .promise();
            return true;
        } catch (err: any){
            if(err.code === 'NotFound') return false;
            throw err;
        }
    }

    async uploadMugshotFromUrl(url: string, key: string): Promise<string> {
        try {
            console.log('[S3UploadService] downloading mugshot:', url);
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Failed to download mugshot: HTTP ${res.status}`);
            }
            const buffer = Buffer.from(await res.arrayBuffer());

            console.log('[S3UploadService] uploading to S3 bucket:', this.bucket, 'key:', key);
            await this.s3.upload({
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: 'image/jpeg',
            }).promise();

            console.log('[S3UploadService] upload success:', key);
            return key;
        } catch (err) {
            console.error('[S3UploadService] upload failed for', url, err);
            throw err;
        }
    }

}
