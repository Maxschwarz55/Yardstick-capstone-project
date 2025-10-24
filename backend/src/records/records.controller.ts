import {Controller, Get, Param} from '@nestjs/common';
import {RecordsService} from './records.service';

@Controller('records')
export class RecordsController{
    private readonly recordsService: RecordsService;
    constructor(recordsService: RecordsService){
        this.recordsService = recordsService;
    }

    @Get(':id')
    async getRecord(@Param('id') id: string){
        return await this.recordsService.getRecordById(id);
    }
}
