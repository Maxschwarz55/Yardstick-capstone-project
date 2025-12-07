class CrawlRow:
    def __init__(
        self,
        zip_code=None,
        last_crawled=None,
        next_scheduled=None,
        total_records=None,
        records_added=None,
        next_crawl=None,
        created=None,
    ):
        self.zip_code = zip_code
        self.last_crawled = last_crawled
        self.next_scheduled = next_scheduled
        self.total_records = total_records
        self.records_added = records_added
        self.next_crawl = next_crawl
        self.created = created

    def __repr__(self):
        fields = [f"{name}={value}" for name, value in self.__dict__.items() if value != None]
        return f"Crawl Row ({",".join(fields)})"