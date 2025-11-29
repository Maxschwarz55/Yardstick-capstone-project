import psycopg2
import os
from dotenv import load_dotenv
from crawl_row import CrawlRow
from datetime import datetime

# Load .env from backend/.env (3 levels up from this file)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '.env'))

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PWD"),
    "database": os.getenv("DB_DB"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT"))
}

class DiagnosticsInserter:

    def __init__(self):
        conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = conn.cursor()
        print(self.cursor)

    def get_recent_logs(self):
        sql = """SELECT DISTINCT ON (zip)
            *
        FROM crawl_log
        ORDER BY zip, created DESC;"""

        self.cursor.execute(sql)
        rows = self.cursor.fetchall()

        return rows

    #gets dict of zip:CrawlRow pairs
    def format_logs(self):
        rows = self.get_recent_logs()
        result = {}
        for row in rows:
            crawl = CrawlRow(
                zip_code=row[1],
                last_crawled=row[2],
                next_scheduled=row[3],
                total_records=row[4],
                records_added=row[5],
                next_crawl=row[6],
                created=row[7],
            )
        result[row[1]] = crawl
        return result

    #groups requested zips into a dict, fills in values based on past records
    def get_zip_rows(self, zips):
        #last_crawled
        prev_rows = self.format_logs()
        for zip_code in zips:
            if zip_code not in prev_rows:
                prev_rows[zip_code] = CrawlRow(zip_code = zip_code, records_added = 0)
        return {zip_code: CrawlRow(zip_code = zip_code, last_crawled = prev_rows[zip_code].created, records_added = 0, created = datetime.now()) for zip_code in zips}
            