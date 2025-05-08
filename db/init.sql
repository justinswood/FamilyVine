CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    birth_date DATE,
    death_date DATE,
    location TEXT,
    photo_url TEXT
);
