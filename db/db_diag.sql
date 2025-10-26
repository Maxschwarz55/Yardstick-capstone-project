CREATE TABLE IF NOT EXISTS crawl_log(
    id SERIAL PRIMARY KEY,
    zip VARCHAR(5),
    last_crawled TIMESTAMP,
    next_scheduled TIMESTAMP,
    total_records INT,
    records_added INT,
    next_crawl TIMESTAMP,
    created TIMESTAMP DEFAULT NOW()
);