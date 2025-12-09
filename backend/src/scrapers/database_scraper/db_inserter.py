import psycopg2
import psycopg2.extras
import os
import sys
from dotenv import load_dotenv
from sshtunnel import SSHTunnelForwarder
import json
import traceback

# Add backend/src to path for similarity algo imports
backend_src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if backend_src_dir not in sys.path:
    sys.path.insert(0, backend_src_dir)

from similarity_algorithm import get_face_similarity_s3, compute_score

# Load .env from backend/.env (3 levels up from this file)
backend_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
load_dotenv(os.path.join(backend_dir, '.env'))

# There is code commented out to create an SSH tunnel to the ec2.
# Uncomment if you are are successfully on the ec2


# ssh_key_path = os.getenv("SSH_KEY_PATH")
# if ssh_key_path and not os.path.isabs(ssh_key_path):
#     ssh_key_path = os.path.join(backend_dir, ssh_key_path)

# SSH_CONFIG = {
#     "ssh_host": os.getenv("SSH_HOST"),
#     "ssh_port": int(os.getenv("SSH_PORT", 22)),
#     "ssh_user": os.getenv("SSH_USER"),
#     "ssh_key_path": ssh_key_path
# }

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PWD"),
    "database": os.getenv("DB_DB"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT"))
}

# Global variables for tunnel and connection
#tunnel = None
conn = None
cursor = None

def init_db_connection():
    #Initialize SSH tunnel and database connection
    
    #global tunnel
    global conn, cursor

    if conn is not None:
        return  

    # tunnel = SSHTunnelForwarder(
    #     (SSH_CONFIG["ssh_host"], SSH_CONFIG["ssh_port"]),
    #     ssh_username=SSH_CONFIG["ssh_user"],
    #     ssh_pkey=SSH_CONFIG["ssh_key_path"],
    #     remote_bind_address=(os.getenv("DB_HOST", "localhost"), int(os.getenv("DB_PORT", 5432))),
    #     local_bind_address=('localhost', 0)
    # )

    # tunnel.start()

    db_config = DB_CONFIG.copy()
    # db_config["host"] = "localhost"
    # db_config["port"] = tunnel.local_bind_port

    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

def close_db_connection():
    #Close database connection and SSH tunnel
    
    # global tunnel
    global conn, cursor

    if cursor:
        cursor.close()
    if conn:
        conn.close()
    # if tunnel:
    #     tunnel.stop()

# Dictionary containing mappings from raw data fields to data fields in the schema
FIELD_MAPPINGS = {
    # Person fields - API format (nsopw-api.ojp.gov)
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

    # Person fields - API format (por.state.mn.us)
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

    # Photo fields
    'photos': ('person', 'photo_url'),
    'photographDate': ('person', 'photo_date'),
    'photographType': ('person', 'photo_type'),

    # Person fields - Scraped text format
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
    'Mugshot Front': ('person', 'mugshot_front_url'),
    'Mugshot Side': ('person', 'mugshot_side_url'),

    # Address fields - API format
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

    # Address fields - Scraped text format
    'Address County': ('address', 'county'),
    'Registered Address': ('address', 'street'),

    # Conviction fields
    'level3Offender': ('conviction', 'level_three_offender'),
    'offenderSubStatus': ('conviction', 'offender_substatus'),
    'startDate': ('conviction', 'date_of_registration'),
    'Offense Statute(s)': ('conviction', 'offense_statute'),
    'Offense Information': ('conviction', 'offense_information'),

    # Law enforcement - Scraped text format
    'Law Enforcement Agency': ('law_enforcement_agency', 'agency_name'),

    # Scar/Mark/Tattoo fields
    'identifyingMarks': ('scar_mark', 'description'),
    'description': ('scar_mark', 'description'),

    # Vehicle fields
    'color': ('vehicle', 'color'),
    'makeDescription': ('vehicle', 'make'),
    'modelDescription': ('vehicle', 'model'),
    'vehicleYear': ('vehicle', 'year')

}

def check_dups(input_person:dict, ref_person:dict) -> tuple:

    face_sim = 0
    input_photo = input_person.get("mugshot_front_url")
    ref_photo = ref_person.get("mugshot_front_url")

    # TODO: Face similarity only works with S3 keys, not URLs
    # For now, skip face similarity since mugshots are stored as URLs
    
    # if input_photo and ref_photo:
    #     face_sim = get_face_similarity_s3(bucket, input_photo, ref_photo)

    score = compute_score(input_person, ref_person, face_sim)
    # Return true of score is greater than 2. Unfortunately we need to be very
    # conservative here as many entries do not have dob or mugshots, and we do not want duplicates. 
    # If we refine our similarity algorithm to take other params this will work better
    if score >= 2:
        return (True, score)

    return (False, score)


def insert_data(raw_data:dict, table_name:str, person_id:int, insert:bool):

        # Convert any dict or list values to JSON strings
        cleaned_data = {}
        for key, value in raw_data.items():
            if isinstance(value, (dict, list)):
                cleaned_data[key] = json.dumps(value)
            else:
                cleaned_data[key] = value

        # No duplicate found, so we insert into DB
        if insert:
            columns = ', '.join(cleaned_data.keys())
            placeholders = ', '.join(['%s'] * len(cleaned_data))
            query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
            cursor.execute(query, list(cleaned_data.values()))
        # Duplicate found, update DB entry
        else:
            update_data = {k: v for k, v in cleaned_data.items() if k != 'person_id'}
            set_clause = ', '.join([f"{col} = %s" for col in update_data.keys()])
            query = f"UPDATE {table_name} SET {set_clause} WHERE person_id = %s"
            cursor.execute(query, list(update_data.values()) + [person_id])

def convert_boolean(value:str) -> bool:
    # Convert Yes/No strings to boolean
    if isinstance(value, str):
        if value.lower() in ['yes', 'true']:
            return True
        elif value.lower() in ['no', 'false']:
            return False
    elif isinstance(value, bool):
        return value
    return value

def flatten_dict(d:dict, parent_key='') -> dict:
    # Recursively flatten nested dictionaries
    items = []
    for k, v in d.items():
        if isinstance(v, dict):
            items.extend(flatten_dict(v, parent_key).items())
        else:
            items.append((k, v))
    return dict(items)


def insert_nsor_data(offender_data: dict) -> bool:
    
    init_db_connection()

    try:
        #Stores all raw data table to field to value mappings
        tables_data = {}

        # Helper function to add table, field and value to the tables_data dict
        def add_field(table, field, value):
            if table not in tables_data:
                tables_data[table] = {}
            if value not in [None, '', []]:
                tables_data[table][field] = value

        # Process the data without flattening nested structures initially
        # We'll handle nested objects (name, aliases, locations, etc.) separately
        aliases_data = []
        addresses_data = []
        scars_marks_data = []
        vehicles_data = []

        # Handle nested 'name' object if it exists
        if 'name' in offender_data and isinstance(offender_data['name'], dict):
            name_obj = offender_data['name']
            for name_field, name_value in name_obj.items():
                if name_field in FIELD_MAPPINGS:
                    table, db_field = FIELD_MAPPINGS[name_field]
                    add_field(table, db_field, name_value)

        # Handle mugshots dictionary
        if 'mugshots' in offender_data and isinstance(offender_data['mugshots'], dict):
            mugshots = offender_data['mugshots']
            for alt_text, url in mugshots.items():
                if 'Front' in alt_text or 'front' in alt_text:
                    add_field('person', 'mugshot_front_url', url)
                elif 'Side' in alt_text or 'side' in alt_text:
                    add_field('person', 'mugshot_side_url', url)

        # Process fields that map directly
        for raw_field, value in offender_data.items():
            # Skip nested objects and arrays. We will deal with this later
            if raw_field in ['name', 'aliases', 'locations', 'addresses', 'identifyingMarks', 'vehicles', 'photos', 'mugshots']:
                continue

            if raw_field in FIELD_MAPPINGS and not isinstance(value, (dict, list)):
                table, db_field = FIELD_MAPPINGS[raw_field]

                # Convert these fields to bools
                if db_field in ['absconder', 'corrective_lens', 'level_three_offender', 'computer_used', 'pornography_involved']:
                    value = convert_boolean(value)

                add_field(table, db_field, value)

        # Handle array fields from offender_data
        if 'aliases' in offender_data and isinstance(offender_data['aliases'], list):
            for alias in offender_data['aliases']:
                alias_entry = {}
                if 'givenName' in alias:
                    alias_entry['first_name'] = alias['givenName']
                if 'middleName' in alias:
                    alias_entry['middle_name'] = alias['middleName']
                if 'surName' in alias:
                    alias_entry['last_name'] = alias['surName']
                if alias_entry:
                    aliases_data.append(alias_entry)

        # Handle locations/addresses
        for loc_key in ['locations', 'addresses']:
            if loc_key in offender_data and isinstance(offender_data[loc_key], list):
                for location in offender_data[loc_key]:
                    addr_entry = {}
                    for field, value in location.items():
                        if field in FIELD_MAPPINGS:
                            table, db_field = FIELD_MAPPINGS[field]
                            if table == 'address':
                                addr_entry[db_field] = value
                    if addr_entry:
                        addresses_data.append(addr_entry)

        # Handle identifying marks/scars
        if 'identifyingMarks' in offender_data and isinstance(offender_data['identifyingMarks'], list):
            for mark in offender_data['identifyingMarks']:
                scar_entry = {}
                if isinstance(mark, dict):
                    if 'description' in mark:
                        scar_entry['description'] = mark['description']
                    if 'location' in mark:
                        scar_entry['location'] = mark['location']
                elif isinstance(mark, str):
                    scar_entry['description'] = mark
                if scar_entry:
                    scars_marks_data.append(scar_entry)

        # Handle vehicles
        if 'vehicles' in offender_data and isinstance(offender_data['vehicles'], list):
            for vehicle in offender_data['vehicles']:
                vehicle_entry = {}
                for field, value in vehicle.items():
                    if field in FIELD_MAPPINGS:
                        table, db_field = FIELD_MAPPINGS[field]
                        if table == 'vehicle':
                            vehicle_entry[db_field] = value
                if vehicle_entry:
                    vehicles_data.append(vehicle_entry)

        is_duplicate = False
        person_id = None

        first_name = tables_data.get('person', {}).get('first_name')
        last_name = tables_data.get('person', {}).get('last_name')

        if first_name and last_name:
            # Query database for people with same first and last name
            query = "SELECT * FROM person WHERE first_name = %s AND last_name = %s"
            cursor.execute(query, [first_name, last_name])
            potential_duplicates = cursor.fetchall()

            # Check each potential duplicate using similarity algorithm
            input_person = tables_data.get('person', {})
            for ref_person in potential_duplicates:
                is_dup, score = check_dups(input_person, dict(ref_person))
                print(f"Duplicate check: {first_name} {last_name} - Score: {score}")
                if is_dup:
                    is_duplicate = True
                    person_id = ref_person['person_id']
                    break

        insert_flag = not is_duplicate

        # If not a duplicate, insert person first to get person_id
        if insert_flag and 'person' in tables_data:
            insert_data(tables_data['person'], 'person', None, True)
            cursor.execute("SELECT lastval()")
            result = cursor.fetchone()
            if isinstance(result, dict):
                person_id = result['lastval'] 
            else: 
                person_id = result[0]

        # Update person table if duplicate
        if is_duplicate and 'person' in tables_data:
            insert_data(tables_data['person'], 'person', person_id, False)

        # Insert/update all other tables
        for table_name, table_fields in tables_data.items():
            if table_name == 'person':
                continue 

            table_fields['person_id'] = person_id
            insert_data(table_fields, table_name, person_id, insert_flag)

        # Handle arrays - insert/update each entry
        for alias in aliases_data:
            alias['person_id'] = person_id
            insert_data(alias, 'alias_name', person_id, insert_flag)

        for address in addresses_data:
            address['person_id'] = person_id
            insert_data(address, 'address', person_id, insert_flag)

        for scar in scars_marks_data:
            scar['person_id'] = person_id
            insert_data(scar, 'scar_mark', person_id, insert_flag)

        for vehicle in vehicles_data:
            vehicle['person_id'] = person_id
            insert_data(vehicle, 'vehicle', person_id, insert_flag)

        conn.commit()
        print(f"Successfully {'inserted' if insert_flag else 'updated'} data for {first_name} {last_name} (person_id: {person_id})")
        return insert_flag

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error inserting data: {e}")
        print(f"Error type: {type(e).__name__}")
        traceback.print_exc()
        raise
