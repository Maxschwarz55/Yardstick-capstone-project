import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SelfieService{
    private s3: AWS.S3;
    private bucket = process.env.S3_BUCKET_NAME!;

    constructor(){
        AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
        AWS.config.update({ region: process.env.AWS_REGION });
        this.s3 = new AWS.S3();
    }

    async createUploadUrl(personId: string){
        //gen unique key
        const s3Key = `selfies/${personId}-${uuidv4()}.jpg`;

        const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
            Bucket: this.bucket,
            Key: s3Key,
            ContentType: 'image/jpeg',
            Expires: 60*5, //5 min
        });

        return{
            uploadUrl,
            s3Key,
        };
    }
}
