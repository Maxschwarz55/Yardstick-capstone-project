import {Injectable} from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class RekognitionService{
    private client: AWS.Rekognition;

    constructor(){
        AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
        AWS.config.update({region: process.env.AWS_REGION});
        this.client = new AWS.Rekognition();
    }

    async compareFace(bucket: string, sourceName : string, targetName: string): Promise<number> {
        const params: AWS.Rekognition.CompareFacesRequest = {
            SourceImage: {
                S3Object: {
                    Bucket: bucket,
                    Name: sourceName
                },
            },
            TargetImage: {
                S3Object: {
                    Bucket: bucket,
                    Name: targetName
                },
            },
            SimilarityThreshold: 70,
        };
        const res = await this.client.compareFaces(params).promise();
        if(!res.FaceMatches || res.FaceMatches.length === 0){
            return 0;
        }
        return res.FaceMatches[0].Similarity ?? 0;
    }
}