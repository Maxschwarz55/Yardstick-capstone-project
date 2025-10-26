CREATE TABLE crawl_log(
    id SERIAL PRIMARY KEY,
    crawl_date TIMESTAMP DEFAULT NOW(),
    total_records INT,
    records_added INT,
    next_crawl TIMESTAMP
);