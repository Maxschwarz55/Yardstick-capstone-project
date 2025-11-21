cp -r ./src/scrapers/database_scraper ./dist/scrapers
python3 -m venv ./dist/scrapers/venv
source ./dist/scrapers/venv/bin/activate
pip install -r ./dist/scrapers/database_scraper/requirements.txt