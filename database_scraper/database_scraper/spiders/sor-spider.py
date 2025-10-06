from pydoc import pager
import scrapy as sc
from database_scraper.items import InputFieldItem, SelectFieldItem
from scrapy_playwright.page import PageMethod

class SorSpider(sc.Spider):
    name = 'sor'
    start_urls = ['https://www.criminaljustice.ny.gov/SomsSUBDirectory/search_index.jsp']

    def __init__(self, last_name=None, *args, **kwargs):
        super(SorSpider, self).__init__(*args, **kwargs)
        self.last_name = last_name

    def start_requests(self):
        for url in self.start_urls:
            yield sc.Request(url, meta={
                "playwright": True,
                "playwright_include_page": True,
            })

    async def parse(self, response):

        # If last_name is provided, interact with the page
        if self.last_name:
            page = response.meta["playwright_page"]

            # Fill in the last name
            await page.fill("input[name='LastName']", self.last_name)

            # Keep the browser open - wait for manual interaction
            self.logger.info("=" * 60)
            self.logger.info("LastName field filled with: " + self.last_name)
            self.logger.info("Please solve CAPTCHA and submit manually")
            self.logger.info("Waiting up to 5 minutes...")
            self.logger.info("=" * 60)

            # Wait for navigation after form submission
            await page.wait_for_timeout(300000)  # Wait 5 minutes

    def parse_results(self, response):
        # Handle the search results page here
        self.log(f"Processing results for last name: {self.last_name}")
        # Add your results parsing logic here
        pass
