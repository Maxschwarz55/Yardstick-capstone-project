import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { SummaryService } from './summary.service';

@Controller('ai-summary')
export class SummaryController {
  constructor(private readonly svc: SummaryService) {}

  @Post()
  async summarize(@Body() body: { person_id?: number }) {
    if (!body?.person_id || Number.isNaN(Number(body.person_id))) {
      throw new BadRequestException('person_id (number) is required');
    }
    return this.svc.generateForPerson(Number(body.person_id));
  }
}
