import {Injectable} from '@nestjs/common';
import { Person } from 'src/db/entities/Person';
import { RekognitionService } from 'src/aws/rekognition.service';
import {computeScore, matchDecision} from 'src/webapp/matcher/similarity_alg'

@Injectable()
export class SimilarityCheckService{
    private readonly BUCKETNAME: string = process.env.S3_BUCKET_NAME!;

    constructor(private readonly rekog: RekognitionService) {}

    async checkSimilarity(inPerson: Person, dbPerson: Person){
        const inName = inPerson?.photo_s3_key;
        const dbName = dbPerson?.photo_s3_key;
        let faceSimScore = 0;
        if(inName && dbName){
            faceSimScore = await this.rekog.compareFace(this.BUCKETNAME, inName, dbName);
        }

        const score = computeScore(inPerson, dbPerson, faceSimScore);
        const decision = matchDecision(score);
        return {score, decision};
    }
}