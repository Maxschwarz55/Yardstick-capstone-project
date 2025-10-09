import scrapy as sc
from database_scraper.items import InputFieldItem, SelectFieldItem
from scrapy.http import HtmlResponse
import json

class SorSpider(sc.Spider):
    name = 'sor'
    start_url = 'https://www.criminaljustice.ny.gov/SomsSUBDirectory/search_index.jsp'

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
    
    def clean_data(self, strings: list) -> list:
        return [s.replace("\xa0", "").replace("\n", "").strip() for s in strings]

    def start_requests(self):
        yield sc.Request(self.start_url, meta={
            "playwright": True,
            "playwright_include_page": True,
        })

    async def parse(self, response):

        current_url = self.start_url

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
            await page.wait_for_url(lambda url: str(url) != current_url, timeout=300000)
            content = await page.content()
            new_response = HtmlResponse(url=page.url, body=content, encoding='utf-8')
            await self.parse_results(new_response, page)


    async def parse_results(self, response, page):

        search_text = f"{self.last_name.upper()}, {self.first_name.upper()}"
        href_link = None
        for link in response.css("a"):
            link_text = link.css("::text").get()
            if search_text == link_text:
                href_link = link.attrib.get("href")
        
        if not href_link:
            self.logger.info(f"{search_text} not found")
            exit(1)
        
        # Navigate to the href URL
        full_url = response.urljoin(href_link)  # Handles relative URLs
        await page.goto(full_url)
        self.logger.info(f"Navigated to: {full_url}")

        # Wait for page to load
        await page.wait_for_load_state("networkidle")

        # Get the new page content after navigation
        new_content = await page.content()
        self.logger.info(f"Page loaded, URL: {page.url}")

        final_response = HtmlResponse(url=page.url, body=new_content, encoding='utf-8')

        labels = await page.locator(".label").all_text_contents()
        labels = self.clean_data(labels)
        values = await page.locator(".value").all_text_contents()
        values = self.clean_data(values)
        
        scraped_data = dict(zip(labels, values))
        print(scraped_data)
