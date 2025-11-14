// src/records/records.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { RecordsService } from './records.service';

@Controller('records')
export class RecordsController {
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
    @Query('limit') limit: number = 10,
    @Query('page') page: number = 1,
  ) {
    return this.recordsService.searchByName(
      first ?? '',
      last ?? '',
      limit,
      page,
    );
  }
}
