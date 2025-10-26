import { Controller, Post, Body } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  async scrapePerson(@Body() body: { firstName: string; lastName: string }) {
    const { firstName, lastName } = body;

    try {
      const output = await this.scraperService.runScraper(firstName, lastName);
      return { message: 'Scraper ran successfully', output };
    } catch (error) {
      return { message: 'Scraper failed', error };
    }
  }
}
