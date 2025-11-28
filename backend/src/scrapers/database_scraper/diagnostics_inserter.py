import psycopg2
import os
import sys
from dotenv import load_dotenv

# Load .env from backend/.env (3 levels up from this file)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PWD"),
    "database": os.getenv("DB_DB"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT"))
}
conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()
def get_recent_logs():
    sql = """SELECT DISTINCT ON (zip)
        zip, total_records, created
    FROM crawl_log
    ORDER BY zip, created DESC;"""
    cursor.execute(sql)
    return get_recent_logs