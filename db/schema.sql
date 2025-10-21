DROP TABLE IF EXISTS people CASCADE;

CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    dob DATE NOT NULL
);

INSERT INTO people (name, dob) VALUES
('John Smith', '2000-01-01'),
('Jane Doe', '2005-09-05');

SELECT *
FROM people
WHERE name = 'John Smith';
