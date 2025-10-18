import asyncio
import asyncpg
import os
import sys
from dotenv import load_dotenv
from scrapy.crawler import CrawlerRunner
from sor_spider2 import SorSpider 

load_dotenv()

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT"))
}


async def run_spider(first_name, last_name):
    runner = CrawlerRunner()
    spider = SorSpider(first_name=first_name, last_name=last_name)
    deferred = runner.crawl(spider)
    await deferred 
    return spider.result


async def insert_scraped_data(first_name, last_name):
    scraped_data = await run_spider(first_name, last_name)
    if not scraped_data:
        print("No data scraped. Exiting.")
        return

    conn = await asyncpg.connect(**DB_CONFIG)

    def none_reported(val):
        return val if val is not None else "None Reported"

    # Insert personal info
    person = scraped_data.get("personal_info", {})
    insert_person = """
        INSERT INTO person (
            offender_id, first_name, middle_name, last_name, dob, sex, race, ethnicity,
            height, weight, hair, eyes, corrective_lens, risk_level, designation, photo_date
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING person_id;
    """
    person_id = await conn.fetchval(insert_person, *[person.get(k) for k in person.keys()])

    # Helper to insert list sections
    async def insert_section(table_name, items, fields):
        if not items:
            items = [{"None Reported": None}]
        for item in items:
            if isinstance(item, dict):
                values = [none_reported(item.get(f)) for f in fields]
            else:
                values = [none_reported(item)]
            await conn.execute(f"""
                INSERT INTO {table_name} (person_id, {', '.join(fields)})
                VALUES ($1, {', '.join(f"${i+2}" for i in range(len(fields)))})
            """, person_id, *values)

    # Insert all sections
    await insert_section("address", scraped_data.get("addresses", []),
                         ["type", "street", "city", "state", "zip", "county"])
    await insert_section("conviction", scraped_data.get("current_convictions", []), ["title"])
    await insert_section("previous_conviction", scraped_data.get("previous_convictions", []), ["title"])
    await insert_section("supervising_agency", scraped_data.get("supervising_agencies", []), ["agency_name"])
    await insert_section("special_conditions", scraped_data.get("special_conditions", []), ["description"])
    await insert_section("max_expiration_date", scraped_data.get("max_expiration_dates", []), ["description"])
    await insert_section("scar_mark", scraped_data.get("scars_tattoos", []), ["description", "location"])
    await insert_section("alias_name", scraped_data.get("aliases", []), ["first_name", "middle_name", "last_name"])
    await insert_section("vehicle", scraped_data.get("vehicles", []),
                         ["plate_number", "state", "year", "make_model", "color"])

    await conn.close()
    print(f"Data for {first_name} {last_name} inserted successfully!")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python db_inserter.py <first_name> <last_name>")
        sys.exit(1)

    first_name = sys.argv[1]
    last_name = sys.argv[2]

    asyncio.run(insert_scraped_data(first_name, last_name))
