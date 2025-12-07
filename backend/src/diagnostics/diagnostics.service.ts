import { Injectable } from '@nestjs/common';
// import { createDecipheriv } from 'crypto';
import { Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

interface CrawlRow {
  zip: string;
  last_crawled: Date | null;
  next_scheduled: Date | null;
  total_records: number | null;
  records_added: number | null;
  next_crawl: Date | null;
  created: Date;
}

interface TotalRow {
  count: number;
}

@Injectable()
export class DiagnosticsService {
  #manager: EntityManager;
  constructor(@Inject('DATA_SOURCE') dataSource: DataSource) {
    this.#manager = dataSource.manager;
  }

  async getDiagnostics() {
    const total = await this.#manager.query<TotalRow[]>(
      'SELECT COUNT(*)::INT AS count FROM person',
    );
    //total records in main table
    const totalRecords = total[0].count;
    //latest crawl per zip
    const zipDiagRes = await this.#manager.query<CrawlRow[]>(`
            SELECT DISTINCT ON (zip)
                zip,
                last_crawled,
                next_scheduled,
                total_records,
                records_added,
                next_crawl,
                created
            FROM crawl_log
            WHERE zip IS NOT NULL
            ORDER BY zip, last_crawled DESC;
        `);
    const zips = zipDiagRes.map((row) => ({
      zip: row.zip,
      lastCrawled: row.last_crawled,
      nextScheduled: row.next_scheduled ?? row.next_crawl,
      totalRecords: row.total_records,
      recordsAdded: row.records_added,
    }));

    //TODO: correctly calculate next_scheduled based off of registry being scraped
    const lastCrawlRes = await this.#manager.query<CrawlRow[]>(
      'SELECT MAX(last_crawled) AS last_crawled FROM crawl_log;',
    );
    const nextCrawlRes = await this.#manager.query<CrawlRow[]>(
      'SELECT MIN(next_scheduled) AS next_scheduled FROM crawl_log;',
    );
    const lastCrawled = lastCrawlRes[0].last_crawled;
    const nextSched = nextCrawlRes[0].next_scheduled;

    return {
      totals: { person: totalRecords },
      lastCrawled,
      nextSched,
      zips,
    };
  }

  /*
    private computeNextCrawl(last?: string){
        if (!last) return null;
        const next = new Date(last);
        //TODO: update to the correct time cycle
        next.setDate(next.getDate() + 2);
        return next;
    }
        */
}
