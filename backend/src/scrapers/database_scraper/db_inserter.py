import psycopg2
import os
import sys
from dotenv import load_dotenv
from scrapy.crawler import CrawlerProcess
from spiders.sor_spider import SorSpider
from scrapy import signals
from scrapy.signalmanager import dispatcher

# Load .env from backend/.env (3 levels up from this file)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

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

    # Insert address
    insert_address = """
        INSERT INTO address (person_id, type, street, city, state, zip, county)
        VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    cursor.execute(insert_address, [
        person_id,
        'EMP',                          # type (Primary)
        '32 SPENCERPORT RD',            # street
        'ROCHESTER',                    # city
        'New York',                     # state
        '14606',                        # zip
        'Monroe'                        # county
    ])

    # Insert conviction
    insert_conviction = """
        INSERT INTO conviction (
            person_id, title, pl_section, subsection, class, category, counts,
            description, date_of_crime, date_convicted, victim_sex_age,
            arresting_agency, offense_descriptions, relationship_to_victim,
            weapon_used, force_used, computer_used, pornography_involved,
            sentence_term, sentence_type
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);
    """
    cursor.execute(insert_conviction, [
        person_id,
        'PL',                                               # title
        '130.25',                                           # pl_section
        '',                                                 # subsection
        'E',                                                # class
        'F',                                                # category
        1,                                                  # counts
        'Rape 3rd Degree',                                  # description
        None,                                               # date_of_crime (empty)
        '1992-06-04',                                       # date_convicted
        'Female,15 Years',                                  # victim_sex_age
        'Syracuse City Police Department - Secondary',      # arresting_agency
        'Actual,Sexual Intercourse',                        # offense_descriptions
        'None Reported',                                    # relationship_to_victim
        'None Reported',                                    # weapon_used
        'Chemical agentCoercion',                           # force_used
        False,                                              # computer_used
        False,                                              # pornography_involved
        '2 Year(s) to 4 Year(s)',                          # sentence_term
        'State Prison Consecutive'                          # sentence_type
    ])

    # Insert law enforcement agency
    insert_agency = """
        INSERT INTO law_enforcement_agency (person_id, agency_name)
        VALUES (%s, %s);
    """
    cursor.execute(insert_agency, [
        person_id,
        'Syracuse City Police Department - Secondary'
    ])

    # Insert previous convictions
    insert_prev = """
        INSERT INTO previous_conviction (person_id, title)
        VALUES (%s, %s);
    """
    cursor.execute(insert_prev, [person_id, 'None Reported'])

    # Insert supervising agency
    insert_super = """
        INSERT INTO supervising_agency (person_id, agency_name)
        VALUES (%s, %s);
    """
    cursor.execute(insert_super, [person_id, 'None Reported'])

    # Insert special conditions
    insert_conditions = """
        INSERT INTO special_conditions (person_id, description)
        VALUES (%s, %s);
    """
    cursor.execute(insert_conditions, [person_id, 'None Reported'])

    # Insert max expiration date
    insert_max_exp = """
        INSERT INTO max_expiration_date (person_id, description)
        VALUES (%s, %s);
    """
    cursor.execute(insert_max_exp, [person_id, 'None Reported'])

    # Insert scars/marks/tattoos
    scars = [
        ('Scar-Eyebrow', 'right/right eye area'),
        ('Scar-Eyebrow', 'left/left eye area'),
        ('Scar-Wrist', 'left')
    ]
    insert_scar = """
        INSERT INTO scar_mark (person_id, description, location)
        VALUES (%s, %s, %s);
    """
    for scar_desc, scar_loc in scars:
        cursor.execute(insert_scar, [person_id, scar_desc, scar_loc])



    # # Helper to insert list sections
    # def insert_section(table_name, items, fields):
    #     if not items:
    #         items = [{"None Reported": None}]
    #     for item in items:
    #         if isinstance(item, dict):
    #             values = [none_reported(item.get(f)) for f in fields]
    #         else:
    #             values = [none_reported(item)]
    #         placeholders = ', '.join(['%s'] * (len(fields) + 1))
    #         cursor.execute(f"""
    #             INSERT INTO {table_name} (person_id, {', '.join(fields)})
    #             VALUES ({placeholders})
    #         """, [person_id] + values)

    # # Insert all sections
    # insert_section("address", scraped_data.get("addresses", []),
    #                      ["type", "street", "city", "state", "zip", "county"])
    # insert_section("conviction", scraped_data.get("current_convictions", []), ["title"])
    # insert_section("previous_conviction", scraped_data.get("previous_convictions", []), ["title"])
    # insert_section("supervising_agency", scraped_data.get("supervising_agencies", []), ["agency_name"])
    # insert_section("special_conditions", scraped_data.get("special_conditions", []), ["description"])
    # insert_section("max_expiration_date", scraped_data.get("max_expiration_dates", []), ["description"])
    # insert_section("scar_mark", scraped_data.get("scars_tattoos", []), ["description", "location"])
    # insert_section("alias_name", scraped_data.get("aliases", []), ["first_name", "middle_name", "last_name"])
    # insert_section("vehicle", scraped_data.get("vehicles", []),
    #                      ["plate_number", "state", "year", "make_model", "color"])
    
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
