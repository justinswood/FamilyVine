CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  relationship TEXT,
  gender TEXT,
  pronouns TEXT,
  birth_date DATE,
  birth_place TEXT,
  death_date DATE,
  death_place TEXT,
  location TEXT,
  occupation TEXT,
  email TEXT,
  phone TEXT,
  photo_url TEXT
);
