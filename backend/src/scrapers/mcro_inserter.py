# src/scrapers/mcro_inserter.py  (or similar path)

import os
import sys
import re
from datetime import datetime, date

import psycopg2
from dotenv import load_dotenv

from scrapy.crawler import CrawlerProcess
from scrapy import signals
from scrapy.signalmanager import dispatcher
from scrapy.utils.project import get_project_settings

# 👇 adjust this import path to match your project structure
from database_scraper.spiders.McroSpider import McroSpider

# ---------------------------------------------------------
# Env + DB_CONFIG
# Make sure your .env has matching variable names.
# Either:
#   DB_USER / DB_PASSWORD / DB_NAME / DB_HOST / DB_PORT
# or change these keys to DB_PWD / DB_DB, etc.
# ---------------------------------------------------------
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD") or os.getenv("DB_PWD"),
    "database": os.getenv("DB_NAME") or os.getenv("DB_DB"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT") or "5432"),
}


# ---------------------------------------------------------
# Date normalizer for DB side
# ---------------------------------------------------------
def normalize_date(value):
    """
    Normalize MCRO date values to a Python date or None for psycopg2.

    Handles:
      - None
      - Python date/datetime
      - '09/16/2025'
      - 'September 16, 2025'
      - '09/16/2025 September 16, 2025'
      - '2025-09-16' (ISO)
    """
    if value is None:
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    s = str(value).strip()
    if not s:
        return None

    # 1) Try mm/dd/yyyy embedded anywhere
    m = re.search(r"\d{2}/\d{2}/\d{4}", s)
    if m:
        try:
            return datetime.strptime(m.group(0), "%m/%d/%Y").date()
        except ValueError:
            pass

    # 2) Try 'Month DD, YYYY'
    m = re.search(r"[A-Za-z]+ \d{1,2}, \d{4}", s)
    if m:
        try:
            return datetime.strptime(m.group(0), "%B %d, %Y").date()
        except ValueError:
            pass

    # 3) Try ISO
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        pass

    # Give up: let psycopg2 try, or return None
    return None


# ---------------------------------------------------------
# run_spider: run Scrapy programmatically
# ---------------------------------------------------------
def run_spider(first_name: str, last_name: str):
    """
    Run the MCRO Scrapy spider programmatically and return a list
    of scraped items (each is the big dict you see in your logs:
    {'case': {...}, 'parties': [...], 'attorneys': [...], ...}).
    """
    items = []

    def _item_scraped(item, response, spider):
        items.append(item)

    os.environ.setdefault("SCRAPY_SETTINGS_MODULE", "database_scraper.settings")
    settings = get_project_settings()
    settings.set("LOG_LEVEL", "INFO", priority="cmdline")

    dispatcher.connect(_item_scraped, signal=signals.item_scraped)

    process = CrawlerProcess(settings)
    process.crawl(McroSpider, first_name=first_name, last_name=last_name)
    process.start()

    dispatcher.disconnect(_item_scraped, signal=signals.item_scraped)

    print(f"run_spider collected {len(items)} item(s)")
    return items


# ---------------------------------------------------------
# Insert helpers
# ---------------------------------------------------------
def insert_mcro_case(conn, row: dict):
    """
    Insert one MCRO case "tree":
      - case -> cases table
      - parties, attorneys, charges, fees, etc. -> child tables

    Expects `row` shaped like:
    {
      "case": {...},
      "parties": [...],
      "attorneys": [...],
      "charges": [...],
      "interim_conditions": [...],
      "case_events": [...],
      "hearings": [...],
      "dispositions": [...],
      "sentence_components": [...],
      "fees": [...],
      "transactions": [...]
    }
    """
    case = row.get("case", {})
    case_number = case.get("case_number")
    if not case_number:
        print("Skipping row without case_number")
        return

    cur = conn.cursor()

    # ---- parent "cases" table ----
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
          SET case_title            = EXCLUDED.case_title,
              case_type             = EXCLUDED.case_type,
              date_filed            = EXCLUDED.date_filed,
              case_location         = EXCLUDED.case_location,
              case_status           = EXCLUDED.case_status,
              current_balance_cents = EXCLUDED.current_balance_cents;
        """,
        (
            case.get("case_number"),
            case.get("case_title"),
            case.get("case_type"),
            normalize_date(case.get("date_filed")),
            case.get("case_location"),
            case.get("case_status"),
            case.get("current_balance_cents", 0),
        ),
    )

    # ---- Parties ----
    for p in row.get("parties", []):
        cur.execute(
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
                normalize_date(p.get("dob")),
                p.get("address"),
            ),
        )

    # ---- Attorneys ----
    for a in row.get("attorneys", []):
        cur.execute(
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

    # ---- Charges ----
    for ch in row.get("charges", []):
        cur.execute(
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
                normalize_date(ch.get("disposition_date")),
                ch.get("level_of_charge"),
                normalize_date(ch.get("offense_date")),
                ch.get("community_of_offense"),
                ch.get("law_enforcement_agency"),
                ch.get("prosecuting_agency"),
                ch.get("level_of_sentence"),
            ),
        )

    # ---- Interim conditions ----
    for ic in row.get("interim_conditions", []):
        cur.execute(
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
                normalize_date(ic.get("date")),
                ic.get("judicial_officer"),
                normalize_date(ic.get("expiration_date")),
                ic.get("condition"),
                ic.get("amount_cents"),
            ),
        )

    # ---- Case events ----
    for ev in row.get("case_events", []):
        cur.execute(
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
                normalize_date(ev.get("date")),
                ev.get("title"),
                ev.get("judicial_officer"),
                ev.get("index_number"),
                ev.get("pages"),
            ),
        )

    # ---- Hearings ----
    for h in row.get("hearings", []):
        cur.execute(
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

    # ---- Dispositions ----
    for d in row.get("dispositions", []):
        cur.execute(
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
                normalize_date(d.get("date")),
                d.get("title"),
                d.get("judicial_officer"),
                d.get("count_number"),
                d.get("statute"),
                d.get("disposition"),
                d.get("level_of_sentence"),
                d.get("level_of_charge"),
                normalize_date(d.get("offense_date")),
                d.get("community_of_offense"),
                d.get("law_enforcement_agency"),
                d.get("prosecuting_agency"),
            ),
        )

    # ---- Sentence components ----
    for scmp in row.get("sentence_components", []):
        cur.execute(
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

    # ---- Fees ----
    for f in row.get("fees", []):
        cur.execute(
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

    # ---- Transactions ----
    for t in row.get("transactions", []):
        cur.execute(
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
                normalize_date(t.get("date")),
                t.get("txn_type"),
                t.get("amount_cents"),
            ),
        )

    cur.close()


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------
def main():
    if len(sys.argv) != 3:
        print("Usage: python mcro_inserter.py <first_name> <last_name>")
        sys.exit(1)

    first_name, last_name = sys.argv[1], sys.argv[2]

    rows = run_spider(first_name, last_name)
    print(f"Scraped {len(rows)} row(s) from spider")

    if not rows:
        print("No cases scraped.")
        return

    conn = psycopg2.connect(**DB_CONFIG)

    try:
        for row in rows:
            insert_mcro_case(conn, row)
        conn.commit()
        print(f"Inserted {len(rows)} case(s) for {first_name} {last_name}.")
    except Exception as e:
        conn.rollback()
        print(f"Error inserting cases: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
