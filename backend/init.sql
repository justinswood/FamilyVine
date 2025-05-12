CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(100),
  gender VARCHAR(20),
  is_alive VARCHAR(10),
  birth_date DATE,
  death_date DATE,
  birth_place VARCHAR(255),
  death_place VARCHAR(255),
  location VARCHAR(255),
  occupation VARCHAR(100),
  pronouns VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  photo_url TEXT
);
