import os
import sys
import psycopg2
from dotenv import load_dotenv
from scrapy.crawler import CrawlerProcess
from scrapy import signals
from scrapy.signalmanager import dispatcher

from spiders.McroSpider import McroSpider


load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT",)),
}


def run_spider(first_name: str, last_name: str):
    items = []

    def _item_scraped(item, response, spider):
        items.append(item)

    dispatcher.connect(_item_scraped, signal=signals.item_scraped)

    process = CrawlerProcess({
        "LOG_LEVEL": "INFO",
        "TWISTED_REACTOR": "twisted.internet.asyncioreactor.AsyncioSelectorReactor",
        "DOWNLOAD_HANDLERS": {
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        "PLAYWRIGHT_BROWSER_TYPE": "chromium",
        "PLAYWRIGHT_LAUNCH_OPTIONS": {"headless": True},
        "DOWNLOAD_TIMEOUT": 600,
        "COOKIES_ENABLED": True,
    })

    process.crawl(McroSpider, first_name=first_name, last_name=last_name)
    process.start()

    return items



def insert_case(conn, case: dict):
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO cases (
            case_number,
            case_title,
            case_type,
            date_filed,
            case_location,
            case_status,
            current_balance_cents
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (case_number) DO UPDATE
          SET case_title          = EXCLUDED.case_title,
              case_type           = EXCLUDED.case_type,
              date_filed          = EXCLUDED.date_filed,
              case_location       = EXCLUDED.case_location,
              case_status         = EXCLUDED.case_status,
              current_balance_cents = EXCLUDED.current_balance_cents;
        """,
        (
            case.get("case_number"),
            case.get("case_title"),
            case.get("case_type"),
            case.get("date_filed"),
            case.get("case_location"),
            case.get("case_status"),
            case.get("current_balance_cents", 0),
        ),
    )
    cur.close()


def insert_children(conn, case_number: str, data: dict):
    c = conn.cursor()

    for p in data.get("parties", []):
        c.execute(
            """
            INSERT INTO parties (
                case_number,
                role,
                name_last,
                name_first,
                name_middle,
                dob,
                address
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                p.get("role"),
                p.get("name_last"),
                p.get("name_first"),
                p.get("name_middle"),
                p.get("dob"),
                p.get("address"),
            ),
        )

    for a in data.get("attorneys", []):
        c.execute(
            """
            INSERT INTO attorneys (
                case_number,
                party_role,
                name,
                status,
                is_lead
            )
            VALUES (%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                a.get("party_role"),
                a.get("name"),
                a.get("status"),
                bool(a.get("is_lead")),
            ),
        )

    for ch in data.get("charges", []):
        c.execute(
            """
            INSERT INTO charges (
                case_number,
                count_number,
                title,
                statute,
                disposition,
                disposition_date,
                level_of_charge,
                offense_date,
                community_of_offense,
                law_enforcement_agency,
                prosecuting_agency,
                level_of_sentence
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                ch.get("count_number"),
                ch.get("title"),
                ch.get("statute"),
                ch.get("disposition"),
                ch.get("disposition_date"),
                ch.get("level_of_charge"),
                ch.get("offense_date"),
                ch.get("community_of_offense"),
                ch.get("law_enforcement_agency"),
                ch.get("prosecuting_agency"),
                ch.get("level_of_sentence"),
            ),
        )

    for ic in data.get("interim_conditions", []):
        c.execute(
            """
            INSERT INTO interim_conditions (
                case_number,
                date,
                judicial_officer,
                expiration_date,
                condition,
                amount_cents
            )
            VALUES (%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                ic.get("date"),
                ic.get("judicial_officer"),
                ic.get("expiration_date"),
                ic.get("condition"),
                ic.get("amount_cents"),
            ),
        )

    for ev in data.get("case_events", []):
        c.execute(
            """
            INSERT INTO case_events (
                case_number,
                date,
                title,
                judicial_officer,
                index_number,
                pages
            )
            VALUES (%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                ev.get("date"),
                ev.get("title"),
                ev.get("judicial_officer"),
                ev.get("index_number"),
                ev.get("pages"),
            ),
        )

    for h in data.get("hearings", []):
        c.execute(
            """
            INSERT INTO hearings (
                case_number,
                date_time,
                type,
                judicial_officer,
                location,
                result
            )
            VALUES (%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                h.get("date_time"),
                h.get("type"),
                h.get("judicial_officer"),
                h.get("location"),
                h.get("result"),
            ),
        )

    for d in data.get("dispositions", []):
        c.execute(
            """
            INSERT INTO dispositions (
                case_number,
                date,
                title,
                judicial_officer,
                count_number,
                statute,
                disposition,
                level_of_sentence,
                level_of_charge,
                offense_date,
                community_of_offense,
                law_enforcement_agency,
                prosecuting_agency
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                d.get("date"),
                d.get("title"),
                d.get("judicial_officer"),
                d.get("count_number"),
                d.get("statute"),
                d.get("disposition"),
                d.get("level_of_sentence"),
                d.get("level_of_charge"),
                d.get("offense_date"),
                d.get("community_of_offense"),
                d.get("law_enforcement_agency"),
                d.get("prosecuting_agency"),
            ),
        )

    for scmp in data.get("sentence_components", []):
        c.execute(
            """
            INSERT INTO sentence_components (
                case_number,
                component_type,
                key,
                value
            )
            VALUES (%s,%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                scmp.get("component_type"),
                scmp.get("key"),
                scmp.get("value"),
            ),
        )

    for f in data.get("fees", []):
        c.execute(
            """
            INSERT INTO fees (
                case_number,
                label,
                amount_cents
            )
            VALUES (%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                f.get("label"),
                f.get("amount_cents"),
            ),
        )

    for t in data.get("transactions", []):
        c.execute(
            """
            INSERT INTO transactions (
                case_number,
                date,
                txn_type,
                amount_cents
            )
            VALUES (%s,%s,%s,%s)
            ON CONFLICT DO NOTHING;
            """,
            (
                case_number,
                t.get("date"),
                t.get("txn_type"),
                t.get("amount_cents"),
            ),
        )

    c.close()


# ----------------------------------------------------------------------
# CLI entrypoint
# ----------------------------------------------------------------------
def main():
    if len(sys.argv) != 3:
        print("Usage: python mcro_inserter.py <first_name> <last_name>")
        sys.exit(1)

    first_name, last_name = sys.argv[1], sys.argv[2]

    rows = run_spider(first_name, last_name)
    if not rows:
        print("No cases scraped.")
        return

    conn = psycopg2.connect(**DB_CONFIG)

    try:
        for row in rows:
            case = row.get("case", {})
            case_number = case.get("case_number")

            if not case_number:
                continue

            insert_case(conn, case)
            insert_children(conn, case_number, row)

        conn.commit()
    finally:
        conn.close()

    print(f"Inserted {len(rows)} case(s) for {first_name} {last_name}.")


if __name__ == "__main__":
    main()
