import {Controller, Post, Body} from '@nestjs/common';
import {SimilarityCheckService} from './similarity_check.service';

@Controller('similarity')
export class SimilarityCheckController{
    constructor(private readonly similarityService: SimilarityCheckService) {}

    @Post('check')
    async checkSimilarity(@Body('input_person') inPerson: any, @Body('db_person') dbPerson: any){
        const res = await this.similarityService.checkSimilarity(inPerson, dbPerson);
        return res;
    }
}