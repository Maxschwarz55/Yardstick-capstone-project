from pydoc import pager
import scrapy as sc
from database_scraper.items import InputFieldItem, SelectFieldItem
from scrapy_playwright.page import PageMethod

class SorSpider(sc.Spider):
    name = 'sor'
    start_urls = ['https://www.criminaljustice.ny.gov/SomsSUBDirectory/search_index.jsp']

    def __init__(self, last_name=None, first_name = None, incarcerated=None,
                 ice_custody=None, custody=None, *args, **kwargs):
        super(SorSpider, self).__init__(*args, **kwargs)
        self.first_name = first_name
        self.last_name = last_name

        if (not first_name or not last_name):
            print("Usage: scrapy crawl sor -a first_name=<\"first_name\"> -a last_name=<\"last_name\">")
            exit(1)
        
        if incarcerated == "True":
            self.incarcerated = True
        else:
            self.incarcerated = False
        if ice_custody == "True":
            self.ice_custody = True
        else:
            self.ice_custody= False
        if custody == "True":
            self.custody = True
        else:
            self.custody = False
        
    
    def start_requests(self):
        for url in self.start_urls:
            yield sc.Request(url, meta={
                "playwright": True,
                "playwright_include_page": True,
            })

    async def parse(self, response):

        page = response.meta["playwright_page"]

        # Fill in all provided fields
        if self.last_name and self.first_name:
            await page.fill("input[name='LastName']", self.last_name)
            self.logger.info(f"LastName field filled with: {self.last_name}")

            if self.incarcerated:
                await page.check("input[name='Inc']")
                self.logger.info("Incarcerated checkbox checked")
            if self.ice_custody:
                await page.check("input[name='Ice']")
                self.logger.info("Ice custody checkbox checked")
            if self.custody:
                await page.check("input[name='Cust']")
                self.logger.info("Custody checkbox checked")

            # Keep the browser open - wait for manual interaction
            self.logger.info("=" * 60)
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
