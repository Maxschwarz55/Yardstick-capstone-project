import scrapy as sc
from database_scraper.items import InputFieldItem, SelectFieldItem

class SorSpider(sc.Spider):
    name = 'sor'
    start_urls = ['https://www.criminaljustice.ny.gov/SomsSUBDirectory/search_index.jsp']

    def start_request(self):
        url = 'https://www.criminaljustice.ny.gov/SomsSUBDirectory/search_index.jsp'
        yield sc.Request(url, meta={'playwright': True})

    def parse(self, response):
        for input_field in response.css("input"):
            input_field_item = InputFieldItem()
            input_field_item['name'] = input_field.attrib.get("name", "")
            input_field_item['type'] = input_field.attrib.get("type", "")
            input_field_item['input'] = None
            
            yield input_field

        
        # for select_field in response.css("select"):
        #     select_field_item = SelectFieldItem()
        #     select_field_item['name'] = select_field.attrib.get("name", "")
        #     input_field_item['input'] = None

        

