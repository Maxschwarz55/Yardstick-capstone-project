CREATE TABLE cases (
    case_number TEXT PRIMARY KEY,
    case_title TEXT,
    case_type TEXT,
    date_filed DATE,
    case_location TEXT,
    case_status TEXT,
    current_balance_cents INTEGER
);

CREATE TABLE parties (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    role TEXT,
    name_last TEXT,
    name_first TEXT,
    name_middle TEXT,
    dob DATE,
    address TEXT,
    UNIQUE(case_number, name_last, name_first)
);

CREATE TABLE attorneys (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    party_role TEXT,
    name TEXT,
    status TEXT,
    is_lead BOOLEAN,
    UNIQUE(case_number, name, party_role)
);

CREATE TABLE charges (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    count_number INTEGER,
    title TEXT,
    statute TEXT,
    disposition TEXT,
    disposition_date DATE,
    level_of_charge TEXT,
    offense_date DATE,
    community_of_offense TEXT,
    law_enforcement_agency TEXT,
    prosecuting_agency TEXT,
    level_of_sentence TEXT
);

CREATE TABLE interim_conditions (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    date DATE,
    judicial_officer TEXT,
    expiration_date DATE,
    condition TEXT,
    amount_cents INTEGER
);

CREATE TABLE case_events (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    date DATE,
    title TEXT,
    judicial_officer TEXT,
    index_number INTEGER,
    pages INTEGER
);

CREATE TABLE hearings (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    date_time TIMESTAMP,
    type TEXT,
    judicial_officer TEXT,
    location TEXT,
    result TEXT
);

CREATE TABLE dispositions (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    date DATE,
    title TEXT,
    judicial_officer TEXT,
    count_number INTEGER,
    statute TEXT,
    disposition TEXT,
    level_of_sentence TEXT,
    level_of_charge TEXT,
    offense_date DATE,
    community_of_offense TEXT,
    law_enforcement_agency TEXT,
    prosecuting_agency TEXT
);

CREATE TABLE sentence_components (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    component_type TEXT,
    key TEXT,
    value TEXT
);

CREATE TABLE fees (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    label TEXT,
    amount_cents INTEGER
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    case_number TEXT REFERENCES cases(case_number),
    date DATE,
    txn_type TEXT,
    amount_cents INTEGER
);
