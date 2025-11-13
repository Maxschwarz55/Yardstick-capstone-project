import { Controller, Post, Body } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  scrapePerson(@Body() body: { firstName: string; lastName: string }) {
    const { firstName, lastName } = body;

    try {
      // const output = await this.scraperService.runScraper(firstName, lastName);
      const output = this.scraperService.runScraperWithName(
        firstName,
        lastName,
      );
      return { message: 'Scraper ran successfully', output };
    } catch (error) {
      if (error instanceof Error) return { message: 'Scraper failed', error };

      return { message: 'Scraper failed' };
    }
  }
}
