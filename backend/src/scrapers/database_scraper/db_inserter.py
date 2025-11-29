import psycopg2
import os
import sys
from dotenv import load_dotenv
from scrapy.crawler import CrawlerProcess
from scrapy import signals
from scrapy.signalmanager import dispatcher

# Load .env from backend/.env (3 levels up from this file)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PWD"),
    "database": os.getenv("DB_DB"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT"))
}

FIELD_MAPPINGS = {
    #Person fields - API format (nsopw-api.ojp.gov)
    'givenName': ('person', 'first_name'),
    'middleName': ('person', 'middle_name'),
    'surName': ('person', 'last_name'),
    'offenderUri': ('person', 'offender_url'),
    'age': ('person', 'age'),
    'gender': ('person', 'sex'),
    'dob': ('person', 'dob'),
    'imageUri': ('person', 'photo_url'),
    'absconder': ('person', 'absconder'),
    'jurisdictionId': ('person', 'jurisdiction_id'),

    #Person fields - API format (por.state.mn.us)
    'firstName': ('person', 'first_name'),
    'lastName': ('person', 'last_name'),
    'height': ('person', 'height'),
    'weight': ('person', 'weight'),
    'ethnicityDescription': ('person', 'ethnicity'),
    'eyeColorDesc': ('person', 'eyes'),
    'hairColorDesc': ('person', 'hair'),
    'raceDescription': ('person', 'race'),
    'startDate': ('conviction', 'date_of_registration'),
    'level3Offender': ('conviction', 'level_three_offender'),
    'offenderSubStatus': ('conviction', 'offender_substatus'),

    #Photo fields
    'photos': ('person', 'photo_url'),
    'photographDate': ('person', 'photo_date'),
    'photographType': ('person', 'photo_type'),

    #Person fields - Scraped text format
    'Birth Date': ('person', 'dob'),
    'Race/Ethnicity': ('person', 'race'),
    'Hair Color': ('person', 'hair'),
    'Eye Color': ('person', 'eyes'),
    'Height': ('person', 'height'),
    'Weight': ('person', 'weight'),
    'Skin Tone': ('person', 'skin_tone'),
    'Build': ('person', 'build'),
    'MNDOC Offender ID': ('person', 'offender_id'),
    'Supervising Agent': ('supervising_agency', 'agency_name'),
    'Supervision Comments': ('person', 'supervision_comments'),
    'Release Date': ('person', 'release_date'),

    #Address fields - API format
    'type': ('address', 'type'),
    'streetAddress': ('address', 'street'),
    'city': ('address', 'city'),
    'county': ('address', 'county'),
    'state': ('address', 'state'),
    'zipCode': ('address', 'zip'),
    'addressType': ('address', 'type'),
    'cityTownName': ('address', 'city'),
    'countyName': ('address', 'county'),
    'postalCode': ('address', 'zip'),
    'usState': ('address', 'state'),

    #Address fields - Scraped text format
    'Address County': ('address', 'county'),
    'Registered Address': ('address', 'street'),

    #Conviction fields
    'level3Offender': ('conviction', 'level_three_offender'),
    'offenderSubStatus': ('conviction', 'offender_substatus'),
    'startDate': ('conviction', 'date_of_registration'),
    'Offense Statute(s)': ('conviction', 'offense_statute'),
    'Offense Information': ('conviction', 'offense_information'),

    #Law enforcement - Scraped text format
    'Law Enforcement Agency': ('law_enforcement_agency', 'agency_name'),

    #Scar/Mark/Tattoo fields
    'identifyingMarks': ('scar_mark', 'description'),
    'description': ('scar_mark', 'description'),

    #Vehicle fields
    'color': ('vehicle', 'color'),
    'makeDescription': ('vehicle', 'make'),
    'modelDescription': ('vehicle', 'model'),
    'vehicleYear': ('vehicle', 'year'),

    #Mugshot fields
    'Mugshot Front': ('mugshot', 'front_url'),
    'Mugshot Side': ('mugshot', 'side_url')

}

        
def run_spider(offender_data: dict):
    spider_instance = None

    def capture_spider(spider):
        nonlocal spider_instance
        spider_instance = spider

    dispatcher.connect(capture_spider, signal=signals.spider_opened)

    process = CrawlerProcess({
        'LOG_LEVEL': 'INFO',
        'TWISTED_REACTOR': 'twisted.internet.asyncioreactor.AsyncioSelectorReactor',
        'DOWNLOAD_HANDLERS': {
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        'PLAYWRIGHT_BROWSER_TYPE': 'chromium',
        'PLAYWRIGHT_LAUNCH_OPTIONS': {
            'headless': False,
        },
        'DOWNLOAD_TIMEOUT': 600,
    })


    process.start()

    if spider_instance and hasattr(spider_instance, 'result'):
        return spider_instance.result
    return None


def insert_nsor_data(offender_data):
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        tables_data = {}

        def add_field(table, field, value):
            if table not in tables_data:
                tables_data[table] = {}
            # Allow overwriting if new value is more substantial (not None, '', or [])
            # This allows scraped detailed data to overwrite sparse API data
            if value not in [None, '', []]:
                tables_data[table][field] = value

        if 'name' in offender_data and isinstance(offender_data['name'], dict):
            for nested_key, nested_value in offender_data['name'].items():
                if nested_key in FIELD_MAPPINGS:
                    table, field = FIELD_MAPPINGS[nested_key]
                    add_field(table, field, nested_value)

        for key, value in offender_data.items():
            if key in FIELD_MAPPINGS and not isinstance(value, (dict, list)):
                table, field = FIELD_MAPPINGS[key]
                add_field(table, field, value)

        person_data = tables_data.get('person', {})
        if person_data:
            # Check if person already exists based on first_name, last_name, and dob
            # This prevents duplicate entries for the same person
            #TODO use person matching algo
            check_fields = []
            check_values = []
            first_name_exists = False
            last_name_exists = False

            if 'first_name' in person_data and person_data['first_name']:
                check_fields.append("first_name = %s")
                check_values.append(person_data['first_name'])
                first_name_exists = True
            if 'last_name' in person_data and person_data['last_name']:
                check_fields.append("last_name = %s")
                check_values.append(person_data['last_name'])
                last_name_exists = True
            if 'dob' in person_data and person_data['dob']:
                check_fields.append("dob = %s")
                check_values.append(person_data['dob'])

            # Only check for duplicates if we have at least first name, last name
            if len(check_fields) >= 2 and first_name_exists and last_name_exists:
                check_query = f"SELECT person_id FROM person WHERE {' AND '.join(check_fields)}"
                cursor.execute(check_query, check_values)
                existing_person = cursor.fetchone()

                if existing_person:
                    person_id = existing_person[0]
                    print(f"Person already exists with person_id {person_id}, skipping duplicate insertion")
                    conn.commit()
                    return person_id

            # If no duplicate found, insert new person
            columns = ', '.join(person_data.keys())
            placeholders = ', '.join(['%s'] * len(person_data))
            query = f"INSERT INTO person ({columns}) VALUES ({placeholders}) RETURNING person_id"
            cursor.execute(query, list(person_data.values()))
            person_id = cursor.fetchone()[0]
        else:
            raise ValueError("No person data to insert")

        # Handle locations from nsopw-api.ojp.gov format
        if 'locations' in offender_data and isinstance(offender_data['locations'], list):
            for location in offender_data['locations']:
                address_data = {'person_id': person_id}
                for key, value in location.items():
                    if key in FIELD_MAPPINGS:
                        table, field = FIELD_MAPPINGS[key]
                        if table == 'address' and value not in [None, '', 0]:
                            address_data[field] = value

                if len(address_data) > 1:
                    columns = ', '.join(address_data.keys())
                    placeholders = ', '.join(['%s'] * len(address_data))
                    query = f"INSERT INTO address ({columns}) VALUES ({placeholders})"
                    cursor.execute(query, list(address_data.values()))

        # Handle addresses from por.state.mn.us format
        if 'addresses' in offender_data and isinstance(offender_data['addresses'], list):
            for location in offender_data['addresses']:
                address_data = {'person_id': person_id}
                for key, value in location.items():
                    if key in FIELD_MAPPINGS:
                        table, field = FIELD_MAPPINGS[key]
                        if table == 'address' and value not in [None, '', 0]:
                            address_data[field] = value

                if len(address_data) > 1:
                    columns = ', '.join(address_data.keys())
                    placeholders = ', '.join(['%s'] * len(address_data))
                    query = f"INSERT INTO address ({columns}) VALUES ({placeholders})"
                    cursor.execute(query, list(address_data.values()))

        # Handle vehicles from por.state.mn.us format
        if 'vehicles' in offender_data and isinstance(offender_data['vehicles'], list):
            for vehicle in offender_data['vehicles']:
                vehicle_data = {'person_id': person_id}
                for key, value in vehicle.items():
                    if key in FIELD_MAPPINGS:
                        table, field = FIELD_MAPPINGS[key]
                        if table == 'vehicle' and value not in [None, '', 0]:
                            vehicle_data[field] = value

                if len(vehicle_data) > 1:
                    columns = ', '.join(vehicle_data.keys())
                    placeholders = ', '.join(['%s'] * len(vehicle_data))
                    query = f"INSERT INTO vehicle ({columns}) VALUES ({placeholders})"
                    cursor.execute(query, list(vehicle_data.values()))

        # Handle identifying marks (scars/marks/tattoos) from por.state.mn.us format
        if 'identifyingMarks' in offender_data and isinstance(offender_data['identifyingMarks'], list):
            for mark in offender_data['identifyingMarks']:
                scar_data = {'person_id': person_id}
                for key, value in mark.items():
                    if key in FIELD_MAPPINGS:
                        table, field = FIELD_MAPPINGS[key]
                        if table == 'scar_mark' and value not in [None, '', 0]:
                            scar_data[field] = value

                if len(scar_data) > 1:
                    columns = ', '.join(scar_data.keys())
                    placeholders = ', '.join(['%s'] * len(scar_data))
                    query = f"INSERT INTO scar_mark ({columns}) VALUES ({placeholders})"
                    cursor.execute(query, list(scar_data.values()))

        if 'aliases' in offender_data and isinstance(offender_data['aliases'], list):
            for alias in offender_data['aliases']:
                alias_data = {'person_id': person_id}
                for key, value in alias.items():
                    if key in FIELD_MAPPINGS:
                        table, field = FIELD_MAPPINGS[key]
                        if table == 'person' and value:
                            if field == 'first_name':
                                alias_data['first_name'] = value
                            elif field == 'middle_name':
                                alias_data['middle_name'] = value
                            elif field == 'last_name':
                                alias_data['last_name'] = value

                if len(alias_data) > 1:
                    columns = ', '.join(alias_data.keys())
                    placeholders = ', '.join(['%s'] * len(alias_data))
                    query = f"INSERT INTO alias_name ({columns}) VALUES ({placeholders})"
                    cursor.execute(query, list(alias_data.values()))

        if 'Also Known As Names' in offender_data and offender_data['Also Known As Names']:
            aka_names = offender_data['Also Known As Names']
            if aka_names and aka_names.strip():
                name_parts = [n.strip() for n in aka_names.split(',')]
                i = 0
                while i < len(name_parts):
                    alias_data = {'person_id': person_id}

                    if i + 1 < len(name_parts):
                        last_name = name_parts[i]
                        first_middle = name_parts[i + 1].split()

                        alias_data['last_name'] = last_name
                        if len(first_middle) > 0:
                            alias_data['first_name'] = first_middle[0]
                        if len(first_middle) > 1:
                            alias_data['middle_name'] = ' '.join(first_middle[1:])

                        i += 2
                    else:
                        i += 1
                        continue

                    if len(alias_data) > 1:
                        columns = ', '.join(alias_data.keys())
                        placeholders = ', '.join(['%s'] * len(alias_data))
                        query = f"INSERT INTO alias_name ({columns}) VALUES ({placeholders})"
                        cursor.execute(query, list(alias_data.values()))

        if 'conviction' in tables_data:
            conviction_data = tables_data['conviction']
            conviction_data['person_id'] = person_id
            columns = ', '.join(conviction_data.keys())
            placeholders = ', '.join(['%s'] * len(conviction_data))
            query = f"INSERT INTO conviction ({columns}) VALUES ({placeholders})"
            cursor.execute(query, list(conviction_data.values()))

        if 'supervising_agency' in tables_data:
            agency_data = tables_data['supervising_agency']
            agency_data['person_id'] = person_id
            if 'agency_name' in agency_data:
                import re
                match = re.search(r'(.*?)\s*\(?\d{3}\)?\s*\d{3}-\d{4}', agency_data['agency_name'])
                if match:
                    phone_match = re.search(r'\(?\d{3}\)?\s*\d{3}-\d{4}', agency_data['agency_name'])
                    if phone_match:
                        agency_data['phone'] = phone_match.group()
                        agency_data['agency_name'] = match.group(1).strip()

            columns = ', '.join(agency_data.keys())
            placeholders = ', '.join(['%s'] * len(agency_data))
            query = f"INSERT INTO supervising_agency ({columns}) VALUES ({placeholders})"
            cursor.execute(query, list(agency_data.values()))

        if 'law_enforcement_agency' in tables_data:
            agency_data = tables_data['law_enforcement_agency']
            agency_data['person_id'] = person_id
            if 'agency_name' in agency_data:
                import re
                match = re.search(r'(.*?)\s*\d{3}-\d{3}-\d{4}', agency_data['agency_name'])
                if match:
                    phone_match = re.search(r'\d{3}-\d{3}-\d{4}', agency_data['agency_name'])
                    if phone_match:
                        agency_data['phone'] = phone_match.group()
                        agency_data['agency_name'] = match.group(1).strip()

            columns = ', '.join(agency_data.keys())
            placeholders = ', '.join(['%s'] * len(agency_data))
            query = f"INSERT INTO law_enforcement_agency ({columns}) VALUES ({placeholders})"
            cursor.execute(query, list(agency_data.values()))

        if 'scar_mark' in tables_data:
            scar_data = tables_data['scar_mark']
            scar_data['person_id'] = person_id
            columns = ', '.join(scar_data.keys())
            placeholders = ', '.join(['%s'] * len(scar_data))
            query = f"INSERT INTO scar_mark ({columns}) VALUES ({placeholders})"
            cursor.execute(query, list(scar_data.values()))

        if 'vehicle' in tables_data:
            vehicle_data = tables_data['vehicle']
            vehicle_data['person_id'] = person_id
            columns = ', '.join(vehicle_data.keys())
            placeholders = ', '.join(['%s'] * len(vehicle_data))
            query = f"INSERT INTO vehicle ({columns}) VALUES ({placeholders})"
            cursor.execute(query, list(vehicle_data.values()))

        if 'mugshot' in tables_data:
            mugshot_data = tables_data['mugshot']
            mugshot_data['person_id'] = person_id
            columns = ', '.join(mugshot_data.keys())
            placeholders = ', '.join(['%s'] * len(mugshot_data))
            query = f"INSERT INTO mugshot ({columns}) VALUES ({placeholders})"
            cursor.execute(query, list(mugshot_data.values()))

        conn.commit()
        print(f"Data for person_id {person_id} inserted successfully!")
        return person_id

    except Exception as e:
        conn.rollback()
        print(f"Error inserting data: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python db_inserter.py <first_name> <last_name>")
        sys.exit(1)

    first_name = sys.argv[1]
    last_name = sys.argv[2]