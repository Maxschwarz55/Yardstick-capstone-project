import json
from curl_cffi import requests
from datetime import datetime
import scrapy as sc
from scrapy.http import HtmlResponse
from scrapy.crawler import CrawlerProcess
from crawl_row import CrawlRow
import re
import sys
import os
import time
import traceback
from diagnostics_inserter import DiagnosticsInserter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_inserter import insert_nsor_data

class NsorSpider(sc.Spider):
    name = 'nsor'
    BASE_URL = "https://nsopw-api.ojp.gov/nsopw/v1/v1.0"
    SEARCH_ENDPOINT = f"{BASE_URL}/search"
    JURISDICTIONS_ENDPOINT = f"{BASE_URL}/jurisdictions/offline"
    POR_STATE_PREFIX = "https://por.state.mn.us"
    COMS_DOC_PREFIX = "https://coms.doc.state.mn.us"

    def __init__(self, zips: list, batch_size = 5, *args, **kwargs):
        super(NsorSpider, self).__init__(*args, **kwargs)
        # Error check zip codes
        for zip_code in zips:
            if not isinstance(zip_code, str) or len(zip_code) != 5:
                raise ValueError(f"Invalid zip code. Zips must be 5 digits: {zip_code}")
            for char in zip_code:
                if not char.isdigit():
                    raise ValueError(f"Zips must contain only digits: {zip_code}")

        self.zips = zips
        
        # Initialize diagnostics
        inserter = DiagnosticsInserter()
        self.zip_rows = inserter.get_zip_rows(zips)
        
        if batch_size > 5:
            raise ValueError("Batch size must be less than 5")
        else:
            self.batch_size = batch_size

        # Scrapy headers. This may not be needed, but should help bot detection
        self.headers = {
            "accept": "application/json, text/plain, */*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "referer": "https://www.nsopw.gov/",
            "origin": "https://www.nsopw.gov",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
        }

    def start_requests(self):
        offenders = self.query_zips()

        for offender in offenders:
            url = offender.get('offenderUri')
            # Scrape API reponse if url is in por.state.mn format
            if self.POR_STATE_PREFIX in url:
                self.scrape_api_response(url, offender)
            # Scrape webpage if url is in coms.doc.state.mn format
            elif self.COMS_DOC_PREFIX in url:
                yield sc.Request(
                url,
                callback=self.parse_offender_page,
                meta={'api_data': offender}
                )
            else:
                print("Error: Offender URL does not match specified prefixes")

    def closed(self, reason):
        # Called when the spider closes - save diagnostics
        print(f"Spider closed: {reason}")
        diagnostics = DiagnosticsInserter()
        diagnostics.insert_zip_rows(self.zip_rows)

    def query_zips(self) -> list:
        
        all_offenders = []
        # Query zipcodes in batches of 5 (The most NSOPW allows at once)
        batches = [self.zips[i:i+self.batch_size] for i in range(0, len(self.zips), self.batch_size)]

        for batch in batches:
            payload = {
                "firstname": "",
                "lastname": "",
                "city": "",
                "county": "",
                "zips": batch,
                "clientIp": ""
            }

            # Make request to the NWSOP API. This returns the original, undetailed list of offenders
            api_response = requests.post(
                self.SEARCH_ENDPOINT,
                headers=self.headers,
                json=payload,
                timeout=60,
                impersonate="chrome120",
                verify=False
            )
            
            try:
                if api_response.status_code == 200:
                    data = api_response.json()
                    all_offenders.extend(data['offenders'])
                    
                elif api_response.status_code == 429:
                    print("Error: Rate limit reached!")
                    print(f"api_response: {api_response.text[:200]}")
                    return None
                elif api_response.status_code == 403:
                    print("Error: Cloudflare blocked request!")
                    print(f"api_response: {api_response.text[:200]}")
                    return None
                else:
                    print(f"Error: {api_response.status_code}")
                    print(f"api_response: {api_response.text[:200]}")
                    return None
            except Exception as e:
                print(f"Error: Exception {e}")
                return None


        return all_offenders
    
    def scrape_api_response(self, url:str, offender_data:dict):

        match = re.search(r'offenderMapId=([A-F0-9-]+)', url, re.IGNORECASE)
        if not match:
            print(f"Error: Could not extract offenderMapId from {url}")
            return None

        offender_map_id = match.group(1)

        api_url = f"https://por.state.mn.us/api/OffenderDetails?offenderMapId={offender_map_id}"

        # Add delay to avoid triggering bot detection
        time.sleep(2) 

        # Second API request to get detailed offender data
        api_response = requests.get(
          api_url,
          impersonate="chrome120",
          timeout=30,
          verify=False
        )

        offender_data_detailed = None

        try:
            if api_response.status_code == 200:
                if api_response.text.strip():
                    offender_data_detailed = api_response.json()
                else:
                    print(f"Error: Empty response from API for {url}")
                    return None

            elif api_response.status_code == 429:
                print("Error: Rate limit reached!")
                print(f"api_response: {api_response.text[:200]}")
                return None
            elif api_response.status_code == 403:
                print("Error: Cloudflare blocked request!")
                print(f"api_response: {api_response.text[:200]}")
                return None
            else:
                print(f"Error: {api_response.status_code}")
                print(f"api_response: {api_response.text[:200]}")
                return None
        except Exception as e:
            print(f"Error: Exception {e} for URL {url}")
            print(f"Response text: {api_response.text[:200]}")
            return None
        

        flattened_detailed = {}
        if offender_data_detailed:
            if 'generalInformation' in offender_data_detailed:
                flattened_detailed.update(offender_data_detailed['generalInformation'])

            for key in ['addresses', 'photos', 'vehicles', 'identifyingMarks']:
                if key in offender_data_detailed and offender_data_detailed[key]:
                    flattened_detailed[key] = offender_data_detailed[key]

            if 'offenderMapId' in offender_data_detailed:
                flattened_detailed['offenderMapId'] = offender_data_detailed['offenderMapId']

        if flattened_detailed:
            full_offender_data = {
                **offender_data,
                **flattened_detailed
            }
        else:
            full_offender_data = {
                **offender_data
            }

        try:
            was_inserted = insert_nsor_data(full_offender_data)
            # Update diagnostics for each zip code in the offender's locations
            for location in full_offender_data.get("locations", []):
                zip_code = location.get("zipCode")
                if zip_code and zip_code in self.zip_rows:
                    # Always increment total_records for all processed records
                    self.zip_rows[zip_code].total_records += 1
                    # Only increment records_added for new insertions
                    if was_inserted:
                        self.zip_rows[zip_code].records_added += 1
        except Exception as e:
            print(f"Error in scrape_api_response: {e}")
            traceback.print_exc()

    def clean_scraped_data(self, raw_data: dict) -> dict:
        # Clean up raw data
        cleaned = {}
        for key, value in raw_data.items():
            clean_key = key.strip()
            if isinstance(value, str):
                clean_value = " ".join(value.split()) 
            else:
                clean_value = value
            cleaned[clean_key] = clean_value
        return cleaned

    def parse_offender_page(self, response):

        offender_data = response.meta['api_data']
        # Match key and value pairs from webpage
        keys = response.xpath(
            "   //span[not(contains(concat(' ', normalize-space(@class), ' '), ' displayText '))]/text()"
            ).getall()
        values = [
            " ".join(span.xpath(".//text()").getall()).strip()
            for span in response.xpath("//span[contains(@class, 'displayText')]")
        ]

        offender_data_detailed = dict(zip(keys, values))

        # Scrape mugshots
        mugshot_elements = response.css('.mugshot')

        if mugshot_elements:
            mugshot_data = {}

            for element in mugshot_elements:
                src = element.css('::attr(src)').get()
                alt = element.css('::attr(alt)').get()
                if src and not src.startswith('http'):
                    src = src.lstrip('/')
                if src[:10] == "data:image":
                    mugshot_data[alt] = src
                else:
                    if src:
                        mugshot_data[alt] = f"{self.COMS_DOC_PREFIX}/{src}"
                    else: 
                        mugshot_data[alt] = None
            

            offender_data_detailed['mugshots'] = mugshot_data

        offender_data_detailed = self.clean_scraped_data(offender_data_detailed)

        if offender_data_detailed:
            full_offender_data = {
                **offender_data,
                **offender_data_detailed
            }
        else:
            full_offender_data = {
                **offender_data
            }

        try:
            was_inserted = insert_nsor_data(full_offender_data)
            # Update diagnostics for each zip code in the offender's locations
            for location in full_offender_data.get("locations", []):
                zip_code = location.get("zipCode")
                if zip_code and zip_code in self.zip_rows:
                    # Always increment total_records for all processed records
                    self.zip_rows[zip_code].total_records += 1
                    # Only increment records_added for new insertions
                    if was_inserted:
                        self.zip_rows[zip_code].records_added += 1
        except Exception as e:
            print(f"Error in scrape_api_response: {e}")
            traceback.print_exc()

if __name__ == '__main__':
    # Create scraper process with options that restrict bot detection (hopefully)
    process = CrawlerProcess({
          'LOG_LEVEL': 'INFO',
          'DOWNLOAD_HANDLERS': {
              "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
              "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
          },
          'TWISTED_REACTOR': 'twisted.internet.asyncioreactor.AsyncioSelectorReactor',
          'PLAYWRIGHT_BROWSER_TYPE': 'chromium',
          'PLAYWRIGHT_LAUNCH_OPTIONS': {
              'headless': False,
          },
          'DOWNLOAD_TIMEOUT': 180, 
          'RETRY_ENABLED': True,
          'RETRY_TIMES': 3,  
          'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],
          'CONCURRENT_REQUESTS': 1,
          'DOWNLOAD_DELAY': 2, 
          'AUTOTHROTTLE_ENABLED': True,
          'AUTOTHROTTLE_START_DELAY': 2,
          'AUTOTHROTTLE_MAX_DELAY': 10,
      })

    process.crawl(NsorSpider, zips=['55407', '55408'])
    process.start()
    