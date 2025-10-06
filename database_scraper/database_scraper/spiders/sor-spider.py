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

            # Wait for user to manually solve CAPTCHA and click submit
            self.logger.info("=" * 60)
            self.logger.info("PLEASE SOLVE THE CAPTCHA IN THE BROWSER WINDOW")
            self.logger.info("Then click the submit button manually")
            self.logger.info("Waiting for results page...")
            self.logger.info("=" * 60)

            try:
                # Wait for navigation to results page (adjust selector as needed)
                await page.wait_for_selector("table", timeout=300000)  # 5 minute timeout

                self.logger.info("Results page loaded! Extracting data...")

                # Get the page content after form submission
                content = await page.content()

                # Create a new response with the results page content
                from scrapy.http import HtmlResponse
                new_response = HtmlResponse(
                    url=page.url,
                    body=content,
                    encoding='utf-8'
                )

                # Parse the results
                for item in self.parse_results(new_response):
                    yield item
            except Exception as e:
                self.logger.error(f"Error waiting for results: {e}")
                self.logger.info("Timeout or error occurred. Browser will close.")

    def parse_results(self, response):
        # Handle the search results page here
        self.log(f"Processing results for last name: {self.last_name}")
        # Add your results parsing logic here
        pass
