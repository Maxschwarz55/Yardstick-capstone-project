import scrapy as sc
from scrapy.http import HtmlResponse
from datetime import datetime
import re


class SorSpider(sc.Spider):
    name = 'sor'
    start_url = 'https://www.criminaljustice.ny.gov/SomsSUBDirectory/search_index.jsp'

    def __init__(self, last_name=None, first_name=None, incarcerated=None,
                 ice_custody=None, custody=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.first_name = first_name
        self.last_name = last_name

        if not first_name or not last_name:
            raise ValueError("Usage: scrapy crawl sor -a first_name=<first> -a last_name=<last>")

        self.incarcerated = incarcerated == "True"
        self.ice_custody = ice_custody == "True"
        self.custody = custody == "True"

        # Store scraped result
        self.result = None

    # ----------------------------
    # Helpers
    # ----------------------------
    def clean_text(self, text: str):
        if not text:
            return None
        return text.replace("\xa0", " ").replace("\n", " ").strip()

    def parse_date(self, date_str: str):
        if not date_str:
            return None
        for fmt in ("%b. %d, %Y", "%b %d, %Y"):
            try:
                return datetime.strptime(date_str.strip(), fmt).date()
            except ValueError:
                continue
        return None

    def parse_boolean(self, value: str):
        if not value:
            return None
        return value.strip().upper() == "YES"

    def parse_int(self, value: str):
        try:
            return int(re.sub("[^0-9]", "", value))
        except (ValueError, TypeError):
            return None

    # ----------------------------
    # Start requests
    # ----------------------------
    def start_requests(self):
        yield sc.Request(
            self.start_url,
            meta={"playwright": True, "playwright_include_page": True}
        )

    # ----------------------------
    # Fill form & wait for CAPTCHA
    # ----------------------------
    async def parse(self, response):
        page = response.meta["playwright_page"]
        await page.fill("input[name='LastName']", self.last_name)
        await page.fill("input[name='FirstName']", self.first_name)

        if self.incarcerated:
            await page.check("input[name='Inc']")
        if self.ice_custody:
            await page.check("input[name='Ice']")
        if self.custody:
            await page.check("input[name='Cust']")

        self.logger.info("Solve CAPTCHA manually...")
        await page.wait_for_url(lambda url: str(url) != self.start_url, timeout=300000)

        content = await page.content()
        new_response = HtmlResponse(url=page.url, body=content, encoding='utf-8')
        self.result = await self.parse_results(new_response, page)

    # ----------------------------
    # Parse all sections into a dict
    # ----------------------------
    async def parse_results(self, response, page):
        labels = await page.locator(".label").all_text_contents()
        labels = [self.clean_text(l) for l in labels]
        values = await page.locator(".value").all_text_contents()
        values = [self.clean_text(v) for v in values]
        data = dict(zip(labels, values))

        result = {}

        result["personal_info"] = {
            "offender_id": data.get("Offender Id"),
            "first_name": data.get("First Name"),
            "middle_name": data.get("Middle Name"),
            "last_name": data.get("Last Name"),
            "dob": self.parse_date(data.get("DOB")),
            "sex": data.get("Sex"),
            "race": data.get("Race"),
            "ethnicity": data.get("Ethnicity"),
            "height": data.get("Height"),
            "weight": self.parse_int(data.get("Weight")),
            "hair": data.get("Hair"),
            "eyes": data.get("Eyes"),
            "corrective_lens": self.parse_boolean(data.get("Corr. Lens")),
            "risk_level": self.parse_int(data.get("Risk Level")),
            "designation": data.get("Designation"),
            "photo_date": self.parse_date(data.get("Photo Date"))
        }

        def scrape_section(selector, fields=None):
            items = response.css(selector)
            results = []
            if not items:
                return [{"None Reported": None}]
            for it in items:
                if not fields:
                    text = it.css("::text").get()
                    results.append(text or "None Reported")
                else:
                    results.append({f: self.clean_text(it.css(f"{f}::text").get()) or "None Reported"
                                    for f in fields})
            return results

        # ----------------------------
        # Sections
        # ----------------------------
        result["addresses"] = scrape_section(".current-address .address-block",
                                             ["type", "street", "city", "state", "zip", "county"])
        result["current_convictions"] = scrape_section(".current-conviction .conviction-block", ["title"])
        result["previous_convictions"] = scrape_section(".previous-conviction .conviction-block", ["title"])
        result["supervising_agencies"] = scrape_section(".supervising-agency .item")
        result["special_conditions"] = scrape_section(".special-conditions .item")
        result["max_expiration_dates"] = scrape_section(".max-expiration-date .item")
        result["scars_tattoos"] = scrape_section(".scar-mark .item", ["description", "location"])
        result["aliases"] = scrape_section(".alias .item", ["first", "middle", "last"])
        result["vehicles"] = scrape_section(".vehicle .item", ["plate", "state", "year", "make_model", "color"])

        return result
