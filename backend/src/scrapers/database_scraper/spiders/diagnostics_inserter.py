import psycopg2
import os
import sys
from dotenv import load_dotenv
from crawl_row import CrawlRow
from datetime import datetime

# Add parent directory to path to import db_inserter
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import db_inserter

CRAWL_LOG_SCHEMA = (
    "zip",
    "last_crawled",
    "next_scheduled",
    "total_records",
    "records_added",
    "next_crawl",
    "created",
)


class DiagnosticsInserter:

    def __init__(self):
        # Initialize the SSH tunnel (if not on ec2) and database connection
        db_inserter.init_db_connection()
        # Get the cursor from the module after initialization
        self.cursor = db_inserter.cursor

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
                zip_code=row['zip'],
                last_crawled=row['last_crawled'],
                next_scheduled=row['next_scheduled'],
                total_records=row['total_records'],
                records_added=row['records_added'],
                next_crawl=row['next_crawl'],
                created=row['created'],
            )
            result[row['zip']] = crawl
        return result

    #groups requested zips into a dict, fills in values based on past records
    def get_zip_rows(self, zips):
        #last_crawled
        prev_rows = self.format_logs()
        for zip_code in zips:
            if zip_code not in prev_rows:
                prev_rows[zip_code] = CrawlRow(zip_code = zip_code, total_records = 0, records_added = 0)
        return {zip_code: CrawlRow(zip_code = zip_code, last_crawled = prev_rows[zip_code].created, total_records = 0, records_added = 0, created = datetime.now()) for zip_code in zips}

    def build_query(self, row):
        query = f"""
        INSERT INTO crawl_log (
            zip,
            last_crawled,
            next_scheduled,
            total_records,
            records_added,
            next_crawl,
            created
        ) VALUES (
            {row.zip},
            '{row.last_crawled}',
            '{row.next_scheduled}',
            {row.total_records},
            {row.records_added},
            '{row.next_crawl}',
            '{row.created}'
        );
        """
        return query


    def insert_zip_rows(self, rows):

        for i in rows:
            row = rows[i]
            query = """
            INSERT INTO crawl_log (
                zip,
                last_crawled,
                next_scheduled,
                total_records,
                records_added,
                next_crawl,
                created
            ) VALUES (%s, %s, %s, %s, %s, %s, %s);
            """

            values = (
                row.zip_code,
                row.last_crawled,
                row.next_scheduled,
                row.total_records,
                row.records_added,
                row.next_crawl,
                row.created,
            )

            self.cursor.execute(query, values)

        # Commit insertions. Remove if backend does the commit
        db_inserter.conn.commit()
        print(f"Inserted {len(rows)} crawl log entries")

    