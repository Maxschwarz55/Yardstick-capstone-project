// src/records/records.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { RecordsService } from './records.service';

@Controller('records')
export class RecordsController {
<<<<<<< HEAD
  constructor(private readonly recordsService: RecordsService) {}

  // GET /records/662
  @Get(':id')
  async getRecord(@Param('id') id: string) {
    return this.recordsService.getRecordById(id);
  }

  // GET /records/search/by-name?first=Adam&last=Jones&limit=10&page=1
  @Get('search/by-name')
  async searchByName(
    @Query('first') first: string,
    @Query('last') last: string,
    @Query('limit') limit = '10',
    @Query('page') page = '1',
  ) {
    return this.recordsService.searchByName(first ?? '', last ?? '', Number(limit), Number(page));
  }
=======
    private readonly recordsService: RecordsService;
    constructor(recordsService: RecordsService) {
        this.recordsService = recordsService;
    }

    @Get(':id')
    async getRecord(@Param('id') id: string) {
        return await this.recordsService.getRecordById(id);
    }
>>>>>>> 344ac6d6a9699355c0a32465e6e6f2956e40ad48
}
