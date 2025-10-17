# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy as sc

class InputFieldItem(sc.Item):
    name = sc.Field()
    type = sc.Field()
    input = sc.Field()

class SelectFieldItem(sc.Item):
    name = sc.Field()
    options = sc.Field()
    input = sc.Field()
