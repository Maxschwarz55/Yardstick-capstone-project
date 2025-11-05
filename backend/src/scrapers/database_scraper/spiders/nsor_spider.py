import scrapy as sc
from scrapy.http import HtmlResponse
from scrapy.crawler import CrawlerProcess
from playwright_stealth import Stealth
import json
from curl_cffi import requests
import time
import random

class NsorSpider():
    
    BASE_URL = "https://nsopw-api.ojp.gov/nsopw/v1/v1.0"
    SEARCH_ENDPOINT = f"{BASE_URL}/search"
    JURISDICTIONS_ENDPOINT = f"{BASE_URL}/jurisdictions/offline"

    def __init__(self, zips: list, *args, **kwargs):
        for zip_code in zips:
            if not isinstance(zip_code, str) or len(zip_code) != 5:
                raise ValueError(f"Invalid zip code. Zips must be 5 digits: {zip_code}")
            for char in zip_code:
                if not char.isdigit():
                    raise ValueError(f"Zips must contain only digits: {zip_code}")
                
        
        self.zips = zips

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
    
    def query_zips(self, batch_size = 5):
        if batch_size > 5:
            raise ValueError("Batch size must be less than 5")
        
        batches = [self.zips[i:i+batch_size] for i in range(0, len(self.zips), batch_size)]

        for batch in batches:
            payload = {
                "firstname": "",
                "lastname": "",
                "city": "",
                "county": "",
                "zips": batch,
                "clientIp": ""
            }

            response = requests.post(
                self.SEARCH_ENDPOINT,
                headers=self.headers,
                json=payload,
                timeout=60,
                impersonate="chrome120"
            )

            if response.status_code == 200:
                data = response.json()
                print(data)
            
if __name__ == '__main__':
    spider = NsorSpider(['55407', '55408'])
    spider.query_zips()

