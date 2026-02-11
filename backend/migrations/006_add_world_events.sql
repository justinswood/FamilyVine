-- Migration: Add world_events table
-- Description: Creates table to store major historical events for timeline context

CREATE TABLE IF NOT EXISTS world_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    category VARCHAR(50), -- 'war', 'disaster', 'political', 'technology', 'civil_rights', 'space', 'economy'
    icon VARCHAR(10), -- emoji icon for the event
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert major world events from 1900-2013
INSERT INTO world_events (title, description, event_date, category, icon) VALUES
-- 1900s
('Galveston Hurricane', 'Deadliest natural disaster in U.S. history, killing 6,000-8,000 people', '1900-09-08', 'disaster', '🌀'),
('Wright Brothers First Flight', 'First controlled, sustained flight in heavier-than-air aircraft at Kitty Hawk, NC', '1903-12-17', 'technology', '✈️'),
('San Francisco Earthquake', '7.9 magnitude earthquake destroys 4 square miles of the city, 500 dead', '1906-04-18', 'disaster', '🏚️'),

-- 1910s
('Panama Canal Opens', 'Strategic waterway connecting Atlantic and Pacific oceans opens to traffic', '1914-08-15', 'technology', '🚢'),
('World War I Begins', 'U.S. enters the Great War, declaring war on Germany', '1917-04-06', 'war', '⚔️'),
('Spanish Flu Pandemic', 'Global pandemic kills 500,000 Americans and 20 million worldwide', '1918-01-01', 'disaster', '🦠'),
('WWI Ends', 'Armistice signed, ending World War I', '1918-11-11', 'war', '🕊️'),
('Women''s Suffrage', '19th Amendment grants women the right to vote', '1919-08-18', 'civil_rights', '🗳️'),
('Prohibition Begins', '18th Amendment prohibits manufacture and sale of alcohol', '1919-01-16', 'political', '🚫'),

-- 1920s
('Lindbergh''s Flight', 'Charles Lindbergh completes first solo nonstop transatlantic flight', '1927-05-21', 'technology', '🛩️'),
('Stock Market Crash', 'Wall Street crash precipitates the Great Depression', '1929-10-29', 'economy', '📉'),

-- 1930s
('FDR Elected', 'Franklin D. Roosevelt inaugurated, begins New Deal programs', '1933-03-04', 'political', '🏛️'),
('Prohibition Ends', '21st Amendment repeals Prohibition', '1933-12-05', 'political', '🍺'),
('Social Security Act', 'Landmark legislation establishes social safety net for elderly Americans', '1935-08-14', 'political', '📋'),

-- 1940s
('Pearl Harbor Attack', 'Japan attacks Hawaii, bringing U.S. into World War II', '1941-12-07', 'war', '💥'),
('D-Day Invasion', 'Allied forces invade Normandy, France', '1944-06-06', 'war', '🪖'),
('FDR Dies', 'President Roosevelt dies; Harry Truman becomes president', '1945-04-12', 'political', '🎗️'),
('Germany Surrenders', 'Nazi Germany surrenders unconditionally, ending war in Europe', '1945-05-07', 'war', '🏳️'),
('Atomic Bomb - Hiroshima', 'U.S. drops first atomic bomb on Hiroshima, Japan', '1945-08-06', 'war', '☢️'),
('WWII Ends', 'Japan surrenders, ending World War II', '1945-08-14', 'war', '🕊️'),
('United Nations Founded', 'International peacekeeping organization established', '1945-10-24', 'political', '🌍'),

-- 1950s
('Korean War Begins', 'North Korean communists invade South Korea', '1950-06-25', 'war', '⚔️'),
('Korean War Ends', 'Armistice agreement signed', '1953-07-27', 'war', '🕊️'),
('Brown v. Board of Education', 'Supreme Court declares school segregation unconstitutional', '1954-05-17', 'civil_rights', '⚖️'),
('Little Rock Nine', 'Federal troops enforce integration at Central High School in Arkansas', '1957-09-24', 'civil_rights', '🎓'),
('Explorer I Launched', 'First American satellite launched into orbit', '1958-01-31', 'space', '🛰️'),
('Alaska Statehood', 'Alaska becomes 49th state', '1959-01-03', 'political', '⭐'),
('Hawaii Statehood', 'Hawaii becomes 50th state', '1959-08-21', 'political', '⭐'),

-- 1960s
('JFK Inaugurated', 'John F. Kennedy becomes 35th president', '1961-01-20', 'political', '🏛️'),
('Bay of Pigs', 'Failed invasion of Cuba by U.S.-backed forces', '1961-04-17', 'war', '🇨🇺'),
('Cuban Missile Crisis', 'Nuclear standoff between U.S. and Soviet Union over missiles in Cuba', '1962-10-22', 'war', '🚀'),
('"I Have a Dream" Speech', 'Martin Luther King Jr. delivers historic speech at March on Washington', '1963-08-28', 'civil_rights', '✊'),
('JFK Assassination', 'President Kennedy assassinated in Dallas, Texas', '1963-11-22', 'political', '💔'),
('Civil Rights Act', 'Landmark legislation prohibits discrimination based on race, color, religion, sex, or national origin', '1964-07-02', 'civil_rights', '📜'),
('Voting Rights Act', 'Prohibits discriminatory voting practices', '1965-08-06', 'civil_rights', '🗳️'),
('MLK Assassination', 'Dr. Martin Luther King Jr. assassinated in Memphis', '1968-04-04', 'civil_rights', '💔'),
('RFK Assassination', 'Senator Robert F. Kennedy assassinated in Los Angeles', '1968-06-05', 'political', '💔'),
('Moon Landing', 'Neil Armstrong and Buzz Aldrin become first humans to walk on the Moon', '1969-07-20', 'space', '🌙'),

-- 1970s
('Kent State Shooting', 'National Guard kills 4 students during anti-war protest', '1970-05-01', 'civil_rights', '🎓'),
('Voting Age Lowered', '26th Amendment lowers voting age from 21 to 18', '1971-07-01', 'political', '🗳️'),
('Watergate Break-in', 'Nixon campaign employees caught breaking into Democratic headquarters', '1972-06-17', 'political', '🔍'),
('Roe v. Wade', 'Supreme Court legalizes abortion in first trimester', '1973-01-22', 'civil_rights', '⚖️'),
('Vietnam War Ends', 'Last U.S. troops leave Vietnam', '1973-03-29', 'war', '🕊️'),
('Nixon Resigns', 'President Nixon resigns over Watergate scandal', '1974-08-09', 'political', '📰'),
('Three Mile Island', 'Nuclear reactor malfunction causes near meltdown in Pennsylvania', '1979-03-28', 'disaster', '☢️'),

-- 1980s
('Reagan Inaugurated', 'Ronald Reagan becomes 40th president', '1981-01-20', 'political', '🏛️'),
('First Female Supreme Court Justice', 'Sandra Day O''Connor sworn in as first woman on Supreme Court', '1981-09-25', 'civil_rights', '👩‍⚖️'),
('Challenger Disaster', 'Space shuttle explodes 73 seconds after liftoff, killing all 7 crew members', '1986-01-28', 'disaster', '🚀'),
('Berlin Wall Falls', 'Symbolic end of Cold War as East Germany opens border', '1989-11-09', 'political', '🧱'),

-- 1990s
('Persian Gulf War', 'U.S.-led coalition drives Iraq out of Kuwait in Operation Desert Storm', '1991-01-17', 'war', '⚔️'),
('Cold War Ends', 'President Bush and Boris Yeltsin formally declare end to Cold War', '1992-02-01', 'political', '🕊️'),
('World Trade Center Bombing', 'Terrorist bomb in WTC basement kills 6, injures 1,000', '1993-02-26', 'disaster', '💣'),
('Oklahoma City Bombing', 'Domestic terrorist attack kills 168 people', '1995-04-19', 'disaster', '💔'),
('Clinton Impeachment', 'House votes to impeach President Clinton; Senate acquits', '1998-12-19', 'political', '⚖️'),
('Columbine Shooting', 'School shooting at Columbine High School kills 15, injures 23', '1999-04-20', 'disaster', '🎓'),

-- 2000s
('September 11 Attacks', 'Terrorist attacks on World Trade Center and Pentagon kill over 3,000', '2001-09-11', 'disaster', '🗽'),
('Afghanistan War Begins', 'U.S. launches military operation against Taliban and Al-Qaeda', '2001-10-07', 'war', '⚔️'),
('Iraq War Begins', 'U.S. and Britain invade Iraq', '2003-03-19', 'war', '⚔️'),
('Columbia Disaster', 'Space shuttle Columbia disintegrates on reentry, killing all 7 astronauts', '2003-02-01', 'disaster', '🚀'),
('Hurricane Katrina', 'Devastating hurricane floods 80% of New Orleans, kills over 1,800', '2005-08-29', 'disaster', '🌀'),
('First African American President', 'Barack Obama elected as first Black president of the United States', '2008-11-04', 'political', '🇺🇸'),
('Financial Crisis', 'Economic collapse leads to Great Recession; Lehman Brothers fails', '2008-09-15', 'economy', '📉'),

-- 2010s
('Deepwater Horizon Spill', 'Largest offshore oil spill in U.S. history in Gulf of Mexico', '2010-04-20', 'disaster', '🛢️'),
('Osama bin Laden Killed', 'Al-Qaeda leader killed by U.S. forces in Pakistan', '2011-05-02', 'war', '🎯'),
('Hurricane Sandy', 'Superstorm causes $82 billion in damage, second costliest U.S. hurricane', '2012-10-29', 'disaster', '🌀'),
('Sandy Hook Shooting', 'Gunman kills 26 people, including 20 children, at elementary school', '2012-12-14', 'disaster', '💔'),
('Boston Marathon Bombing', 'Terrorist bombs near finish line kill 3, injure 170', '2013-04-15', 'disaster', '💣');

-- Create index for faster date-based queries
CREATE INDEX idx_world_events_date ON world_events(event_date);
