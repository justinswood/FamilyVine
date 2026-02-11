-- Migration: Add world events 2014-2024
-- Description: Adds major historical events from 2014-2024 to provide timeline context

INSERT INTO world_events (title, description, event_date, category, icon) VALUES
-- 2014
('Ukraine Revolution & Russia Annexes Crimea', 'Reshaped European security and sparked an ongoing war', '2014-02-20', 'war', '⚔️'),
('Rise of ISIL in Iraq & Syria', 'Triggered years of conflict and international military intervention', '2014-06-29', 'war', '⚔️'),
('West Africa Ebola Epidemic', 'Worst Ebola outbreak in history, exposing global health vulnerabilities', '2014-03-25', 'disaster', '🦠'),

-- 2015
('Paris Climate Agreement', 'First near-universal global climate accord negotiated', '2015-12-12', 'political', '🌍'),
('Iran Nuclear Deal (JCPOA)', 'Major diplomatic breakthrough on nuclear nonproliferation', '2015-07-14', 'political', '⚖️'),
('European Migrant Crisis', 'Migration crisis peaks, redefining European politics and migration policy', '2015-09-04', 'political', '🚢'),

-- 2016
('Brexit Referendum', 'UK votes to leave the EU, reshaping Europe', '2016-06-23', 'political', '🇬🇧'),
('Donald Trump Elected President', 'Major political realignment with global repercussions', '2016-11-08', 'political', '🏛️'),
('Panama Papers Leak', 'Exposed global corruption and offshore finance at scale', '2016-04-03', 'political', '📰'),

-- 2017
('North Korea Hydrogen Bomb & Missile Tests', 'Heightened nuclear tensions globally', '2017-09-03', 'war', '☢️'),
('#MeToo Movement Begins', 'Global cultural shift around power, accountability, and abuse', '2017-10-15', 'civil_rights', '✊'),
('Hurricanes Harvey, Irma, Maria', 'Most destructive Atlantic hurricane season in U.S. history', '2017-08-25', 'disaster', '🌀'),

-- 2018
('China Abolishes Presidential Term Limits', 'Xi Jinping consolidates long-term power', '2018-03-11', 'political', '🇨🇳'),
('China-U.S. Trade War Begins', 'Reshaped global trade and supply chains', '2018-07-06', 'economy', '📉'),
('Murder of Jamal Khashoggi', 'Major international diplomatic rupture over human rights', '2018-10-02', 'political', '💔'),

-- 2019
('Hong Kong Protests', 'Major confrontation over democracy and China''s authority', '2019-06-09', 'civil_rights', '✊'),
('First Image of a Black Hole', 'Landmark scientific achievement', '2019-04-10', 'space', '🔭'),
('ISIL Loses All Territorial Control', 'End of the caliphate as a governing entity', '2019-03-23', 'war', '🕊️'),

-- 2020
('COVID-19 Pandemic & Global Lockdowns', 'Largest global crisis since WWII', '2020-03-11', 'disaster', '🦠'),
('George Floyd Killing & Worldwide Protests', 'Global reckoning on policing and racism', '2020-05-25', 'civil_rights', '✊'),
('U.S. Presidential Election & Democratic Crisis', 'Set stage for January 6 and long-term polarization', '2020-11-03', 'political', '🗳️'),

-- 2021
('January 6 Attack on U.S. Capitol', 'Unprecedented assault on democratic institutions', '2021-01-06', 'political', '🏛️'),
('Fall of Kabul & Taliban Takeover', 'End of 20-year Afghanistan war', '2021-08-15', 'war', '🇦🇫'),
('Global Recognition of Climate Emergency', 'IPCC report provides strongest scientific warning yet', '2021-08-09', 'disaster', '🌡️'),

-- 2022
('Russia Invades Ukraine', 'Largest European war since WWII', '2022-02-24', 'war', '⚔️'),
('Death of Queen Elizabeth II', 'End of a historic era', '2022-09-08', 'political', '👑'),
('Launch of ChatGPT', 'Inflection point for artificial intelligence adoption', '2022-11-30', 'technology', '🤖'),

-- 2023
('Hamas Attacks Israel & Gaza War', 'Major Middle East escalation begins', '2023-10-07', 'war', '⚔️'),
('2023 Becomes Hottest Year on Record', 'Climate change reaches historic extremes', '2023-07-27', 'disaster', '🌡️'),
('Turkey-Syria Earthquakes', 'One of the deadliest disasters of the decade', '2023-02-06', 'disaster', '🏚️'),

-- 2024
('Donald Trump Wins Presidential Election', 'Major global political shift', '2024-11-05', 'political', '🏛️'),
('Fall of the Assad Regime', 'Ends over a decade of Syrian civil war power structure', '2024-12-08', 'political', '🇸🇾'),
('Israeli Regional Escalation', 'Lebanon invasion & ICJ ruling - Major Middle East realignment', '2024-10-01', 'war', '⚔️');
