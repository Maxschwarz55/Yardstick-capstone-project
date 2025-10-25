import psycopg2
import os
import sys
from dotenv import load_dotenv
from scrapy.crawler import CrawlerProcess
from scrapers.database_scraper.spiders.sor_spider import SorSpider
from scrapy import signals
from scrapy.signalmanager import dispatcher

#Relative path for env file. This will need to change likely
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT"))
}

def convert_to_bool(string: str):
    if string == 'YES':
        return True
    else:
        return False
    
def run_spider(first_name, last_name, incarcerated=None, ice_custody=None, custody=None):
    spider_instance = None

    def capture_spider(spider):
        nonlocal spider_instance
        spider_instance = spider

    dispatcher.connect(capture_spider, signal=signals.spider_opened)

    process = CrawlerProcess({
        'LOG_LEVEL': 'INFO',
        'TWISTED_REACTOR': 'twisted.internet.asyncioreactor.AsyncioSelectorReactor',
        'DOWNLOAD_HANDLERS': {
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        'PLAYWRIGHT_BROWSER_TYPE': 'chromium',
        'PLAYWRIGHT_LAUNCH_OPTIONS': {
            'headless': False,
        },
        'DOWNLOAD_TIMEOUT': 600,
    })

    process.crawl(
        SorSpider,
        first_name=first_name,
        last_name=last_name,
        incarcerated=incarcerated,
        ice_custody=ice_custody,
        custody=custody
    )

    process.start()

    if spider_instance and hasattr(spider_instance, 'result'):
        return spider_instance.result
    return None

def insert_scraped_data(first_name, last_name, incarcerated=None, ice_custody=None, custody=None):
    scraped_data = run_spider(first_name, last_name, incarcerated, ice_custody, custody)
    if not scraped_data:
        print("No data scraped. Exiting.")
        return

    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    def none_reported(val):
        return val if val is not None else "None Reported"

    # Insert personal info
    person = scraped_data
    person['Corr. Lens'] = convert_to_bool(person['Corr. Lens'])
    insert_person = """
        INSERT INTO person (
            offender_id, last_name, first_name, middle_name, dob, sex,
            risk_level, designation, race, ethnicity, height, weight, hair, eyes, corrective_lens,
            photo_date
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING person_id;
    """
    cursor.execute(insert_person, [person.get(k) for k in list(person.keys())[:16]])
    person_id = cursor.fetchone()[0]

    # Helper to insert list sections
    def insert_section(table_name, items, fields):
        if not items:
            items = [{"None Reported": None}]
        for item in items:
            if isinstance(item, dict):
                values = [none_reported(item.get(f)) for f in fields]
            else:
                values = [none_reported(item)]
            placeholders = ', '.join(['%s'] * (len(fields) + 1))
            cursor.execute(f"""
                INSERT INTO {table_name} (person_id, {', '.join(fields)})
                VALUES ({placeholders})
            """, [person_id] + values)

    # Insert all sections
    insert_section("address", scraped_data.get("addresses", []),
                         ["type", "street", "city", "state", "zip", "county"])
    insert_section("conviction", scraped_data.get("current_convictions", []), ["title"])
    insert_section("previous_conviction", scraped_data.get("previous_convictions", []), ["title"])
    insert_section("supervising_agency", scraped_data.get("supervising_agencies", []), ["agency_name"])
    insert_section("special_conditions", scraped_data.get("special_conditions", []), ["description"])
    insert_section("max_expiration_date", scraped_data.get("max_expiration_dates", []), ["description"])
    insert_section("scar_mark", scraped_data.get("scars_tattoos", []), ["description", "location"])
    insert_section("alias_name", scraped_data.get("aliases", []), ["first_name", "middle_name", "last_name"])
    insert_section("vehicle", scraped_data.get("vehicles", []),
                         ["plate_number", "state", "year", "make_model", "color"])
    
    conn.commit()
    
    conn.close()
    print(f"Data for {first_name} {last_name} inserted successfully!")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python db_inserter.py <first_name> <last_name>")
        sys.exit(1)

    first_name = sys.argv[1]
    last_name = sys.argv[2]
    
    insert_scraped_data(first_name, last_name)
