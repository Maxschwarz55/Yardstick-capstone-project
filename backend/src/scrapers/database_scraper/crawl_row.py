class CrawlRow:
    def __init__(
        self,
        zip,
        last_crawled,
        next_scheduled,
        total_records,
        records_added,
        next_crawl,
        created
    ):
        self.zip = zip
        self.last_crawled = last_crawled
        self.next_scheduled = next_scheduled
        self.total_records = total_records
        self.records_added = records_added
        self.next_crawl = next_crawl
        self.created = created
