-- =====================================================
-- Main Person Table
-- =====================================================
DROP TABLE IF EXISTS person CASCADE;

CREATE TABLE person (
    person_id SERIAL PRIMARY KEY,
    offender_id TEXT,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    dob DATE,
    sex TEXT,
    race TEXT,
    ethnicity TEXT,
    height TEXT,
    weight INT,
    hair TEXT,
    eyes TEXT,
    corrective_lens BOOLEAN,
    risk_level INT,
    designation TEXT,
    photo_date DATE
);

-- =====================================================
-- Addresses
-- =====================================================
DROP TABLE IF EXISTS address CASCADE;

CREATE TABLE address (
    address_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    type TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    county TEXT
);

-- =====================================================
-- Current Convictions
-- =====================================================
DROP TABLE IF EXISTS conviction CASCADE;

CREATE TABLE conviction (
    conviction_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    title TEXT,
    pl_section TEXT,
    subsection TEXT,
    class TEXT,
    category TEXT,
    counts INT,
    description TEXT,
    date_of_crime DATE,
    date_convicted DATE,
    victim_sex_age TEXT,
    arresting_agency TEXT,
    offense_descriptions TEXT,
    relationship_to_victim TEXT,
    weapon_used TEXT,
    force_used TEXT,
    computer_used BOOLEAN,
    pornography_involved BOOLEAN,
    sentence_term TEXT,
    sentence_type TEXT
);

-- =====================================================
-- Previous Convictions
-- =====================================================
DROP TABLE IF EXISTS previous_conviction CASCADE;

CREATE TABLE previous_conviction (
    prev_conviction_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    title TEXT
);

-- =====================================================
-- Law Enforcement Agencies
-- =====================================================
DROP TABLE IF EXISTS law_enforcement_agency CASCADE;

CREATE TABLE law_enforcement_agency (
    agency_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    agency_name TEXT
);

-- =====================================================
-- Supervising Agencies
-- =====================================================
DROP TABLE IF EXISTS supervising_agency CASCADE;

CREATE TABLE supervising_agency (
    supervising_agency_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    agency_name TEXT
);

-- =====================================================
-- Special Conditions
-- =====================================================
DROP TABLE IF EXISTS special_conditions CASCADE;

CREATE TABLE special_conditions (
    condition_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    description TEXT
);

-- =====================================================
-- Max Expiration Date/Post Release Supervision Date
-- =====================================================
DROP TABLE IF EXISTS max_expiration_date CASCADE;

CREATE TABLE max_expiration_date (
    max_exp_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    description TEXT
);

-- =====================================================
-- Scars / Marks / Tattoos
-- =====================================================
DROP TABLE IF EXISTS scar_mark CASCADE;

CREATE TABLE scar_mark (
    scar_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    description TEXT,
    location TEXT
);

-- =====================================================
-- Aliases / Additional Names
-- =====================================================
DROP TABLE IF EXISTS alias_name CASCADE;

CREATE TABLE alias_name (
    alias_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT
);

-- =====================================================
-- Vehicles
-- =====================================================
DROP TABLE IF EXISTS vehicle CASCADE;

CREATE TABLE vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
    plate_number TEXT,
    state TEXT,
    year TEXT,
    make_model TEXT,
    color TEXT
);

-- -- =====================================================
-- -- Example Inserts: Adam Jones
-- -- =====================================================
-- INSERT INTO person (offender_id, first_name, middle_name, last_name, dob, sex, race, ethnicity, height, weight, hair, eyes, corrective_lens, risk_level, designation, photo_date)
-- VALUES ('662', 'Adam', 'M', 'Jones', '1967-10-25', 'Male', 'Black', 'Hispanic', '5''07"', 180, 'Black', 'Brown', FALSE, 2, 'No Designation Applies', '2023-02-17')
-- RETURNING person_id;

-- -- Assuming the returned person_id = 1
-- -- Current Addresses
-- INSERT INTO address (person_id, type, street, city, state, zip, county)
-- VALUES
-- (1, 'RES', '138 MCKINLEY AVE', 'SYRACUSE', 'New York', '13205', 'Onondaga'),
-- (1, 'EMP', '32 SPENCERPORT RD', 'ROCHESTER', 'New York', '14606', 'Monroe');

-- -- Law Enforcement Agency
-- INSERT INTO law_enforcement_agency (person_id, agency_name)
-- VALUES (1, 'Syracuse City Police Department');

-- -- Current Convictions
-- INSERT INTO conviction (person_id, title, pl_section, class, category, counts, description, date_of_crime, date_convicted, victim_sex_age, arresting_agency, offense_descriptions, relationship_to_victim, weapon_used, force_used, computer_used, pornography_involved, sentence_term, sentence_type)
-- VALUES (1, 'Rape 3rd Degree', '130.25', 'E', 'F', 1, 'Rape 3rd Degree', '1992-06-04', '1992-06-04', 'Female, 15 Years', 'Syracuse City Police Department', 'Actual, Sexual Intercourse', 'None Reported', 'None Reported', 'Chemical agent', FALSE, FALSE, '2 Year(s) to 4 Year(s)', 'State Prison');

-- -- Previous Convictions
-- INSERT INTO previous_conviction (person_id, title)
-- VALUES (1, 'None Reported');

-- -- Supervising Agency
-- INSERT INTO supervising_agency (person_id, agency_name)
-- VALUES (1, 'None Reported');

-- -- Special Conditions
-- INSERT INTO special_conditions (person_id, description)
-- VALUES (1, 'None Reported');

-- -- Max Expiration Date
-- INSERT INTO max_expiration_date (person_id, description)
-- VALUES (1, 'None Reported');

-- -- Scars / Marks / Tattoos
-- INSERT INTO scar_mark (person_id, description, location)
-- VALUES
-- (1, 'Eyebrow', 'right/right eye area'),
-- (1, 'Eyebrow', 'left/left eye area'),
-- (1, 'Wrist', 'left');

-- -- Aliases
-- INSERT INTO alias_name (person_id, first_name, middle_name, last_name)
-- VALUES
-- (1, 'Adam', 'M', 'Clark'),
-- (1, 'Adam', NULL, 'King'),
-- (1, 'Adam', NULL, 'McDonald');

-- -- Vehicles
-- INSERT INTO vehicle (person_id, plate_number, state, year, make_model, color)
-- VALUES (1, 'None Reported', 'None Reported', 'None Reported', 'None Reported', 'None Reported');



-- -- =====================================================
-- -- Example Inserts: Andrew Lee
-- -- =====================================================
-- INSERT INTO person (offender_id, first_name, middle_name, last_name, dob, sex, race, ethnicity, height, weight, hair, eyes, corrective_lens, risk_level, designation, photo_date)
-- VALUES ('50674', 'Andrew', NULL, 'Lee', '1981-01-11', 'Male', 'Asian', 'Not Hispanic', '5''07"', 160, 'Black', 'Brown', TRUE, 2, 'No Designation Applies', '2022-09-01')
-- RETURNING person_id;

-- -- Assuming the returned person_id = 2
-- -- Current Addresses
-- INSERT INTO address (person_id, type, street, city, state, zip, county)
-- VALUES
-- (2, 'RES', '33 MONTEREY AVE, STATEN ISLAND', 'STATEN ISLAND', 'New York', '10312', 'Richmond'),
-- (2, 'EMP', '224 WEST 35TH ST', 'NEW YORK', 'New York', '10001', 'New York');

-- -- Law Enforcement Agency
-- INSERT INTO law_enforcement_agency (person_id, agency_name)
-- VALUES (2, 'NYCPD Sex Offender Unit');

-- -- Current Convictions
-- INSERT INTO conviction (person_id, title, pl_section, class, category, counts, description, date_of_crime, date_convicted, victim_sex_age, arresting_agency, offense_descriptions, relationship_to_victim, weapon_used, force_used, computer_used, pornography_involved, sentence_term, sentence_type)
-- VALUES (2, 'Possessing Sexual Performance By Child <16:Possess/Access To View', '263.16', 'E', 'F', 1, 'Possessing Sexual Performance By Child <16', '2019-02-01', '2019-08-07', 'None Reported', 'Richmond County District Attorney', 'Actual, Promoting/Possessing Sexual Performance by a Child', 'None Reported', 'No weapon used', 'No force used', TRUE, TRUE, 'Probation: 10 Year(s)', 'State');

-- -- Previous Convictions
-- INSERT INTO previous_conviction (person_id, title)
-- VALUES (2, 'None Reported');

-- -- Supervising Agency
-- INSERT INTO supervising_agency (person_id, agency_name)
-- VALUES (2, 'New York County Probation Adult Supervision - INTEL');

-- -- Special Conditions
-- INSERT INTO special_conditions (person_id, description)
-- VALUES (2, 'Participate in sex offender treatment program; Abide by case specific sex offender conditions; Comply with the Sex Offender Registration Act; No pornographic material; No contact with victim');

-- -- Max Expiration Date
-- INSERT INTO max_expiration_date (person_id, description)
-- VALUES (2, 'Sept. 17, 2029 This date was reported at the time of the offender''s current registration. The date and any special conditions listed may be subject to change while the offender is under supervision.');

-- -- Scars / Marks / Tattoos
-- INSERT INTO scar_mark (person_id, description, location)
-- VALUES (2, 'None Reported', 'None Reported');

-- -- Aliases
-- INSERT INTO alias_name (person_id, first_name, middle_name, last_name)
-- VALUES (2, 'None Reported', 'None Reported', 'None Reported');

-- -- Vehicles
-- INSERT INTO vehicle (person_id, plate_number, state, year, make_model, color)
-- VALUES (2, 'HHW9396', 'New York', '2016', 'Hyundai Sonata', 'Aluminum/Silver');
