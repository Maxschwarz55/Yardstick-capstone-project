import { Module } from '@nestjs/common';
import { SimilarityCheckController } from './similarity_check.controller';
import { SimilarityCheckService } from './similarity_check.service';
import { RekognitionService } from 'src/aws/rekognition.service';

@Module({
  controllers: [SimilarityCheckController],
  providers: [SimilarityCheckService, RekognitionService],
})
export class SimilarityCheckModule {}
