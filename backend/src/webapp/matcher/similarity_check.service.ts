import {Injectable} from '@nestjs/common';
import { Person } from 'src/db/entities/Person';
import { RekognitionService } from 'src/aws/rekognition.service';
import {computeScoreWithBreakdown, matchDecision} from 'src/webapp/matcher/similarity_alg'

@Injectable()
export class SimilarityCheckService{
    private readonly BUCKETNAME: string = process.env.S3_BUCKET_NAME!;

    constructor(private readonly rekog: RekognitionService) {}

    async checkSimilarity(inPerson: Person, dbPerson: Person){
        const inName = inPerson?.photo_s3_key;
        const dbName = dbPerson?.photo_s3_key;
        let faceSimScore = 0;
        if(inName && dbName){
            console.log('[SimilarityCheck] Comparing faces', { inName, dbName, bucket: this.BUCKETNAME });
            try {
                faceSimScore = await this.rekog.compareFace(this.BUCKETNAME, inName, dbName);
            } catch (err) {
                console.error('[SimilarityCheck] Rekognition compareFace failed:', err);
                throw err; 
            }
        }
        const scoreBreakdown = computeScoreWithBreakdown(inPerson, dbPerson, faceSimScore);
        const decision = matchDecision(scoreBreakdown.total, faceSimScore);
        return {scoreBreakdown, decision};
    }
}