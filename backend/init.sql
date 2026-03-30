-- ═══════════════════════════════════════════════════════
-- FamilyVine Database Schema
-- Complete schema for fresh installations
-- Kept in sync with migrations/ directory
-- ═══════════════════════════════════════════════════════

-- ── Utility Functions ──────────────────────────────────

-- Trigger function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ── Users & Authentication ─────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used_at) WHERE used_at IS NULL;

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_name VARCHAR(255),
    default_privacy VARCHAR(20) DEFAULT 'private',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    show_private_info BOOLEAN DEFAULT false,
    require_login_for_viewing BOOLEAN DEFAULT false,
    allow_guest_access BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT true,
    member_updates BOOLEAN DEFAULT true,
    relationship_changes BOOLEAN DEFAULT true,
    photo_uploads BOOLEAN DEFAULT false,
    default_root_member_id INTEGER, -- FK added after members table
    preferred_generation_depth INTEGER DEFAULT 4,
    show_unknown_parents BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ── Members ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    nickname VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    relationship VARCHAR(100),
    gender VARCHAR(10),
    is_alive BOOLEAN DEFAULT true,
    birth_date DATE,
    birth_place VARCHAR(255),
    death_date DATE,
    death_place VARCHAR(255),
    occupation VARCHAR(255),
    pronouns VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    location VARCHAR(255),
    photo_url TEXT,
    generation INTEGER,
    facebook_url VARCHAR(500),
    instagram_url VARCHAR(500),
    linkedin_url VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_members_first_name ON members(first_name);
CREATE INDEX IF NOT EXISTS idx_members_last_name ON members(last_name);
CREATE INDEX IF NOT EXISTS idx_members_full_name ON members(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_members_search ON members(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_members_first_name_lower ON members(LOWER(first_name));
CREATE INDEX IF NOT EXISTS idx_members_last_name_lower ON members(LOWER(last_name));
CREATE INDEX IF NOT EXISTS idx_members_birth_date ON members(birth_date);
CREATE INDEX IF NOT EXISTS idx_members_death_date ON members(death_date) WHERE death_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_birth_place ON members(birth_place) WHERE birth_place IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_location ON members(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_living_with_location ON members(location) WHERE death_date IS NULL AND location IS NOT NULL AND location != '';
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_gender ON members(gender) WHERE gender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_is_alive ON members(is_alive);
CREATE INDEX IF NOT EXISTS idx_members_nickname ON members(nickname) WHERE nickname IS NOT NULL;

-- Add FK from user_preferences to members (deferred because members created after user_preferences)
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_default_root_member_id_fkey
    FOREIGN KEY (default_root_member_id) REFERENCES members(id) ON DELETE SET NULL;

-- ── Relationships ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS relationships (
    id SERIAL PRIMARY KEY,
    member1_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    member2_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member1_id, member2_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_relationships_member1 ON relationships(member1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_member2 ON relationships(member2_id);

-- ── Unions (partnerships/marriages) ────────────────────

CREATE TABLE IF NOT EXISTS unions (
    id SERIAL PRIMARY KEY,
    partner1_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    partner2_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE SET NULL,
    union_type VARCHAR(50) DEFAULT 'marriage',
    union_date DATE,
    union_location TEXT,
    divorce_date DATE,
    end_reason VARCHAR(100),
    is_primary BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    notes TEXT,
    is_single_parent BOOLEAN DEFAULT false,
    is_visible_on_tree BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Unique constraint only for non-single-parent unions
    CONSTRAINT unions_unique_non_single_parent UNIQUE (partner1_id, partner2_id)
);

-- Note: The ordered partners constraint (partner1_id < partner2_id) is NOT applied
-- because single-parent unions need flexibility in partner ordering.

CREATE INDEX IF NOT EXISTS idx_unions_partner1 ON unions(partner1_id);
CREATE INDEX IF NOT EXISTS idx_unions_partner2 ON unions(partner2_id);
CREATE INDEX IF NOT EXISTS idx_unions_partners ON unions(partner1_id, partner2_id);
CREATE INDEX IF NOT EXISTS idx_unions_relationship ON unions(relationship_id);
CREATE INDEX IF NOT EXISTS idx_unions_type ON unions(union_type);
CREATE INDEX IF NOT EXISTS idx_unions_union_type ON unions(union_type) WHERE union_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_unions_primary ON unions(is_primary);
CREATE INDEX IF NOT EXISTS idx_unions_single_parent ON unions(is_single_parent);
CREATE INDEX IF NOT EXISTS idx_unions_visible ON unions(is_visible_on_tree);

DROP TRIGGER IF EXISTS update_unions_updated_at ON unions;
CREATE TRIGGER update_unions_updated_at
    BEFORE UPDATE ON unions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Union Children ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS union_children (
    id SERIAL PRIMARY KEY,
    union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
    child_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    birth_order INTEGER,
    is_biological BOOLEAN DEFAULT true,
    is_adopted BOOLEAN DEFAULT false,
    is_step_child BOOLEAN DEFAULT false,
    adoption_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(union_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_union_children_union ON union_children(union_id);
CREATE INDEX IF NOT EXISTS idx_union_children_child ON union_children(child_id);

DROP TRIGGER IF EXISTS update_union_children_updated_at ON union_children;
CREATE TRIGGER update_union_children_updated_at
    BEFORE UPDATE ON union_children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Albums & Photos ────────────────────────────────────

CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_photo_id INTEGER, -- FK added after photos table
    created_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_date DATE,
    is_public BOOLEAN DEFAULT true
);

DROP TRIGGER IF EXISTS update_albums_updated_at ON albums;
CREATE TRIGGER update_albums_updated_at
    BEFORE UPDATE ON albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    caption TEXT,
    taken_date TIMESTAMP,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_cover BOOLEAN DEFAULT false,
    is_hero_image BOOLEAN DEFAULT false,
    rotation_degrees INTEGER DEFAULT 0 CHECK (rotation_degrees IN (0, 90, 180, 270)),
    original_file_path VARCHAR(500),
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    hero_blurb TEXT,
    hero_location_override VARCHAR(255),
    hero_tagged_ids INTEGER[]
);

CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_rotation ON photos(rotation_degrees) WHERE rotation_degrees != 0;
CREATE INDEX IF NOT EXISTS idx_photos_edited ON photos(is_edited) WHERE is_edited = true;

-- Add deferred FK for albums cover photo
ALTER TABLE albums ADD CONSTRAINT fk_albums_cover_photo
    FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;

-- Photo tags (face recognition and manual member tagging)
CREATE TABLE IF NOT EXISTS photo_tags (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    x_coordinate DECIMAL(5,2),
    y_coordinate DECIMAL(5,2),
    width DECIMAL(5,2),
    height DECIMAL(5,2),
    confidence DECIMAL(3,2),
    is_verified BOOLEAN DEFAULT false,
    tagged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    tagged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_member_id ON photo_tags(member_id);

-- ── Stories ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(255),
    story_date DATE,
    transcript TEXT,
    historical_context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_transcript ON stories USING gin(to_tsvector('english', COALESCE(transcript, '')));

CREATE TABLE IF NOT EXISTS story_members (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_story_members_story ON story_members(story_id);
CREATE INDEX IF NOT EXISTS idx_story_members_story_id ON story_members(story_id);
CREATE INDEX IF NOT EXISTS idx_story_members_member_id ON story_members(member_id);

CREATE TABLE IF NOT EXISTS story_photos (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_story_photos_story ON story_photos(story_id);
CREATE INDEX IF NOT EXISTS idx_story_photos_story_id ON story_photos(story_id);
CREATE INDEX IF NOT EXISTS idx_story_photos_photo_id ON story_photos(photo_id);

CREATE TABLE IF NOT EXISTS story_audio (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    audio_url VARCHAR(500) NOT NULL,
    audio_duration INTEGER,
    title VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_story_audio_story_id ON story_audio(story_id);

-- ── Recipes ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time INTEGER,
    cook_time INTEGER,
    total_time INTEGER,
    servings VARCHAR(50),
    category VARCHAR(100),
    tags TEXT,
    contributed_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    is_family_favorite BOOLEAN DEFAULT false,
    difficulty_level VARCHAR(20),
    chef_notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_contributed_by ON recipes(contributed_by);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_favorite ON recipes(is_family_favorite) WHERE is_family_favorite = true;
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recipes_search ON recipes USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE TABLE IF NOT EXISTS recipe_photos (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    caption TEXT,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_recipe_photo UNIQUE (recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_photos_recipe ON recipe_photos(recipe_id);

CREATE TABLE IF NOT EXISTS recipe_comments (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe ON recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_created_at ON recipe_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_active ON recipe_comments(is_deleted) WHERE is_deleted = false;

CREATE TABLE IF NOT EXISTS recipe_versions (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time INTEGER,
    cook_time INTEGER,
    total_time INTEGER,
    servings VARCHAR(50),
    change_description TEXT,
    chef_notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_recipe_version UNIQUE (recipe_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_recipe_versions_recipe ON recipe_versions(recipe_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_versions_created_at ON recipe_versions(created_at DESC);

CREATE TABLE IF NOT EXISTS recipe_tags (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_recipe_tag UNIQUE (recipe_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_name ON recipe_tags(recipe_id, tag_name);

-- ── Tree Node Positions ────────────────────────────────

CREATE TABLE IF NOT EXISTS tree_node_positions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    x_position DECIMAL(10,2) NOT NULL,
    y_position DECIMAL(10,2) NOT NULL,
    tree_type VARCHAR(50) NOT NULL DEFAULT 'reactflow',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, tree_type)
);

CREATE INDEX IF NOT EXISTS idx_tree_positions_member ON tree_node_positions(member_id);
CREATE INDEX IF NOT EXISTS idx_tree_positions_type ON tree_node_positions(tree_type);

DROP TRIGGER IF EXISTS update_tree_positions_updated_at ON tree_node_positions;
CREATE TRIGGER update_tree_positions_updated_at
    BEFORE UPDATE ON tree_node_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Geocode Cache ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS geocode_cache (
    id SERIAL PRIMARY KEY,
    location_string VARCHAR(500) NOT NULL UNIQUE,
    original_location VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    display_name TEXT,
    geocoding_source VARCHAR(50) DEFAULT 'nominatim',
    geocoding_quality VARCHAR(20) DEFAULT 'exact',
    member_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geocode_location ON geocode_cache(location_string);
CREATE INDEX IF NOT EXISTS idx_geocode_coords ON geocode_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_geocode_quality ON geocode_cache(geocoding_quality);
CREATE INDEX IF NOT EXISTS idx_geocode_updated ON geocode_cache(updated_at DESC);

DROP TRIGGER IF EXISTS update_geocode_cache_updated_at ON geocode_cache;
CREATE TRIGGER update_geocode_cache_updated_at
    BEFORE UPDATE ON geocode_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: trigger to track last_used_at separately
CREATE OR REPLACE FUNCTION update_geocode_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_geocode_last_used_trigger ON geocode_cache;
CREATE TRIGGER update_geocode_last_used_trigger
    BEFORE UPDATE ON geocode_cache
    FOR EACH ROW
    WHEN (OLD.last_used_at IS DISTINCT FROM NEW.last_used_at)
    EXECUTE FUNCTION update_geocode_last_used();

-- ── World Events (Timeline) ───────────────────────────

CREATE TABLE IF NOT EXISTS world_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    category VARCHAR(50),
    icon VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_world_events_date ON world_events(event_date);

-- Seed world events (1900-2024)
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
('Boston Marathon Bombing', 'Terrorist bombs near finish line kill 3, injure 170', '2013-04-15', 'disaster', '💣'),
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
('Israeli Regional Escalation', 'Lebanon invasion & ICJ ruling - Major Middle East realignment', '2024-10-01', 'war', '⚔️')
ON CONFLICT DO NOTHING;

-- ── User Preferences Trigger ───────────────────────────

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- ── Unions Updated At Trigger ──────────────────────────

CREATE OR REPLACE FUNCTION update_unions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_unions_updated_at ON unions;
CREATE TRIGGER trigger_unions_updated_at
    BEFORE UPDATE ON unions
    FOR EACH ROW EXECUTE FUNCTION update_unions_updated_at();

-- ── Cleanup Functions ──────────────────────────────────

-- Auto-expire old password reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Purge stale geocode cache entries
CREATE OR REPLACE FUNCTION cleanup_old_geocode_cache(days_old INTEGER DEFAULT 90)
RETURNS void AS $$
BEGIN
    DELETE FROM geocode_cache WHERE last_used_at < NOW() - (days_old || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;
