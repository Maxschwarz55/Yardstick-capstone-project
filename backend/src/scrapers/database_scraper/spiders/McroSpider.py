import re
import scrapy as sc
from scrapy.http import HtmlResponse
from datetime import datetime


class McroSpider(sc.Spider):
    name = "mcro"
    start_url = "https://publicaccess.courts.state.mn.us/CaseSearch"

    def __init__(self, first_name=None, last_name=None, *args, **kwargs):
   
        super().__init__(*args, **kwargs)
        if not first_name or not last_name:
            raise ValueError(
                "Usage: scrapy crawl mcro -a first_name=<first> -a last_name=<last>"
            )
        self.first_name = first_name.strip()
        self.last_name = last_name.strip()


    def start_requests(self):
        yield sc.Request(
            self.start_url,
            meta={
                "playwright": True,
                "playwright_include_page": True,
            },
        )

  
    async def parse(self, response):

        page = response.meta["playwright_page"]

        # accept TOS
        tos_button = page.locator("text='Yes, I Accept'")
        if await tos_button.count() > 0:
            self.logger.info("Accepting TOS dialog...")
            await tos_button.first.click()

        self.logger.info("Filling name fields...")
        await page.wait_for_selector(
            "input[name='LastName'], input#LastName", timeout=20000
        )
        await page.fill("input[name='LastName']", self.last_name)
        await page.fill("input[name='FirstName']", self.first_name)

        self.logger.info("Setting case category to Criminal only...")
        case_types = ["Civil", "Criminal", "Family", "Probate or Mental Health"]

        for ct in case_types:
            label_locator = page.locator(f"label:has-text('{ct}')")
            if await label_locator.count() == 0:
                label_locator = page.locator(f"label:has-text('{ct.split()[0]}')")

            if await label_locator.count() == 0:
                continue

            checkbox = label_locator.locator(
                "input[type='checkbox'], input[type='radio']"
            )
            if await checkbox.count() == 0:
                checkbox = page.locator(
                    "xpath=//label[contains(normalize-space(.), '{0}')]"
                    "//input[@type='checkbox' or @type='radio']".format(ct)
                )

            if await checkbox.count() == 0:
                continue

            cb = checkbox.first
            is_checked = await cb.is_checked()
            want_checked = ct.lower().startswith("criminal")

            # only 'Criminal' checked
            if want_checked and not is_checked:
                await cb.check()
            elif not want_checked and is_checked:
                await cb.uncheck()

        self.logger.info("Submitting search by pressing Enter in FirstName field...")
        await page.focus("input[name='FirstName']")
        await page.keyboard.press("Enter")

        self.logger.info("Waiting for results to load...")
        await page.wait_for_timeout(5000)

        html_after_search = await page.content()
        self.logger.info(
            f"Page HTML after search has length={len(html_after_search)} bytes"
        )

       # await page.close()

        results_response = HtmlResponse(
            url=response.url,
            body=html_after_search,
            encoding="utf-8",
        )

        # extract all "ViewCaseDetails" links
        links = results_response.xpath(
            "//a[contains(@href, 'ViewCaseDetails')]/@href"
        ).getall()

        if not links:
            self.logger.info(
                "No case-detail links found in page after search. "
                "If you suspect they exist, open the site in a browser and inspect the hrefs."
            )
            return

        # Deduplicate
        seen = set()
        for href in links:
            if not href:
                continue
            full_url = response.urljoin(href)
            if full_url in seen:
                continue
            seen.add(full_url)

            self.logger.info(f"Following case detail URL: {full_url}")
            yield sc.Request(full_url, callback=self.parse_case_page)

    def parse_case_page(self, response):
        """
        Extract all visible text from the page, flatten into a single string,
        regex to grab substrings between known labels like 'Case Number', 'Case Title', 'Case Type', etc.,
        then return a dict containing high-level 'case' metadata plus additional fields
        (currently empty lists) if I want to parse less useful information later
        """
        texts = [t.strip() for t in response.xpath("//text()").getall() if t.strip()]
        full = " ".join(texts)

   
        label_boundaries = (
            r"(Case Number|Case Title|Case Type|Date Filed|Case Location|"
            r"Case Status|Current Balance|Citation Number|Party Information|"
            r"Jump To Section|Financial Information|Charges|Case Events|"
            r"Dispositions|Hearings)"
        )

        def field(label: str) -> str:
            """
            Extract the text that follows a label, e.g.:

                "Case Number: 27-VB-25-40204 Case Title: ..."

            """
            pattern = rf"{re.escape(label)}\s*:?\s*(.+?)(?=\s+{label_boundaries}|$)"
            m = re.search(pattern, full)
            return m.group(1).strip() if m else ""

        # build case metadata
        case = {
            "case_number": field("Case Number"),
            "case_title": field("Case Title"),
            "case_type": field("Case Type"),
            "date_filed": field("Date Filed"),
            "case_location": field("Case Location"),
            "case_status": field("Case Status"),
            "current_balance_cents": self.clean_money(field("Current Balance")),
        }

        # TODO: parse these maybe but probably not too useful
        parties = []
        attorneys = []
        charges = []
        interim_conditions = []
        case_events = []
        hearings = []
        dispositions = []
        sentence_components = []
        fees = []
        transactions = []

        yield {
            "case": case,
            "parties": parties,
            "attorneys": attorneys,
            "charges": charges,
            "interim_conditions": interim_conditions,
            "case_events": case_events,
            "hearings": hearings,
            "dispositions": dispositions,
            "sentence_components": sentence_components,
            "fees": fees,
            "transactions": transactions,
        }
    def clean_money(self, s: str) -> int:
        """
        Convert money text like '$1,234.56' to integer cents (123456).

        Handles weird concatenated strings by:
        - trying a simple direct parse first
        - otherwise extracting all X.XX-looking groups with regex
          and using the *last* one as the current balance.
        """

        if not s:
            return 0

        # Normalize basic junk
        text = (
            s.replace("\xa0", " ")
             .replace(",", "")
             .replace("$", "")
             .strip()
        )

        # --- 1) Try the "normal" case: single number, at most one decimal point ---
        if text.count(".") <= 1 and all(ch.isdigit() or ch in ".- " for ch in text):
            try:
                return int(round(float(text), 2) * 100)
            except ValueError:
                pass

        # --- 2) Weird concatenated case: pull out all dollar-looking groups ---
        # e.g. "0.00203142008114...125.00125.00" -> ["0.00", "2031.42", ..., "125.00"]
        matches = re.findall(r"-?\d+\.\d{2}", text)
        if matches:
            value = matches[-1]  # heuristic: last amount is the final/current balance
            try:
                return int(round(float(value), 2) * 100)
            except ValueError:
                pass

        # --- 3) Last-resort: grab any integer-looking chunk and treat as dollars ---
        ints = re.findall(r"\d+", text)
        if ints:
            try:
                return int(ints[-1]) * 100
            except ValueError:
                pass

        # --- 4) Give up, but don't crash the spider ---
        self.logger.warning("clean_money: could not parse money from %r, returning 0", s)
        return 0
    
    def clean_date(raw):
        """Normalize weird MCRO date strings to a Python date object.

        Handles:
        - '09/16/2025'
        - 'September 16, 2025'
        - '09/16/2025 September 16, 2025'
        """
        if raw is None:
            return None

        raw = raw.strip()
        if not raw:
            return None

        # 1) Try to find an mm/dd/yyyy pattern
        m = re.search(r"\d{2}/\d{2}/\d{4}", raw)
        if m:
            return datetime.strptime(m.group(0), "%m/%d/%Y").date()

        # 2) Try to find a 'Month DD, YYYY' pattern
        m = re.search(r"[A-Za-z]+ \d{1,2}, \d{4}", raw)
        if m:
            return datetime.strptime(m.group(0), "%B %d, %Y").date()

        # 3) If nothing matches, blow up so you see what went wrong
        raise ValueError(f"Unrecognized date format: {raw!r}")