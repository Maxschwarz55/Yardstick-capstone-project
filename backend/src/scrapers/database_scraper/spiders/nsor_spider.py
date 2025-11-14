import json
from curl_cffi import requests
import time
import random
import scrapy as sc
from scrapy.http import HtmlResponse
from scrapy.crawler import CrawlerProcess
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_inserter import insert_nsor_data

class NsorSpider(sc.Spider):
    name = 'nsor'
    BASE_URL = "https://nsopw-api.ojp.gov/nsopw/v1/v1.0"
    SEARCH_ENDPOINT = f"{BASE_URL}/search"
    JURISDICTIONS_ENDPOINT = f"{BASE_URL}/jurisdictions/offline"

    def __init__(self, zips: list, batch_size = 5, *args, **kwargs):
        super(NsorSpider, self).__init__(*args, **kwargs)
        for zip_code in zips:
            if not isinstance(zip_code, str) or len(zip_code) != 5:
                raise ValueError(f"Invalid zip code. Zips must be 5 digits: {zip_code}")
            for char in zip_code:
                if not char.isdigit():
                    raise ValueError(f"Zips must contain only digits: {zip_code}")

        self.zips = zips

        if batch_size > 5:
            raise ValueError("Batch size must be less than 5")
        else:
            self.batch_size = batch_size


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

        por_state_prefix = "https://por.state.mn.us/"
        coms_doc_prefix = "https://coms.doc.state.mn.us/"

        for offender in offenders:
            url = offender.get('offenderUri')
            if por_state_prefix in url:
                self.scrape_api_response(url, offender)
            elif coms_doc_prefix in url:
                yield sc.Request(
                  url,
                  callback=self.parse_offender_page,
                  meta={'api_data': offender}
                )
            else:
                print("Error: Offender URL does not match specified prefixes")


    
    def query_zips(self):
        all_offenders = []
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

            api_response = requests.post(
                self.SEARCH_ENDPOINT,
                headers=self.headers,
                json=payload,
                timeout=60,
                impersonate="chrome124",
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
    
    def scrape_api_response(self, url, offender_data):
        
        match = re.search(r'offenderMapId=([A-F0-9-]+)', url, re.IGNORECASE)
        if not match:
            print(f"Error: Could not extract offenderMapId from {url}")
            return None

        offender_map_id = match.group(1)

        api_url = f"https://por.state.mn.us/api/OffenderDetails?offenderMapId={offender_map_id}"

        api_response = requests.get(
          api_url,
          impersonate="chrome124",
          timeout=30,
          verify=False
        )

        offender_data_detailed = None

        try:
            if api_response.status_code == 200:
                offender_data_detailed = api_response.json()

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
        

        # Write offender_data_detailed to file
        if offender_data_detailed:

            full_offender_data = {
                **offender_data,
                **offender_data_detailed
            }
        else:
            full_offender_data = {
                **offender_data
            }

        insert_nsor_data(full_offender_data)

    def clean_scraped_data(self, raw_data: dict) -> dict:
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
        keys = response.xpath(
            "   //span[not(contains(concat(' ', normalize-space(@class), ' '), ' displayText '))]/text()"
            ).getall()
        values = [
            " ".join(span.xpath(".//text()").getall()).strip()
            for span in response.xpath("//span[contains(@class, 'displayText')]")
        ]

        offender_data_detailed = dict(zip(keys, values))
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


        insert_nsor_data(full_offender_data)


if __name__ == '__main__':
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
      })

    process.crawl(NsorSpider, zips=['55407', '55408'])
    process.start()
    

