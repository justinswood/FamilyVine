-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username and email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(255),
    gender VARCHAR(50),
    is_alive BOOLEAN NOT NULL DEFAULT true,
    birth_date DATE,
    death_date DATE,
    birth_place VARCHAR(500),
    death_place VARCHAR(500),
    location VARCHAR(500),
    occupation VARCHAR(255),
    pronouns VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    photo_url VARCHAR(500)
);

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_photo_id INTEGER,
    created_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_date DATE,
    is_public BOOLEAN DEFAULT true
);

-- Photos table (separate from member profile photos)
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
    is_cover BOOLEAN DEFAULT false
);

-- Photo tags table (for face recognition and manual tags)
CREATE TABLE IF NOT EXISTS photo_tags (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    x_coordinate DECIMAL(5,2), -- Percentage position for face boxes
    y_coordinate DECIMAL(5,2),
    width DECIMAL(5,2),
    height DECIMAL(5,2),
    confidence DECIMAL(3,2), -- Face recognition confidence (0-1)
    is_verified BOOLEAN DEFAULT false, -- Manual verification
    tagged_by INTEGER,
    tagged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- NEW: Relationships table for family connections
CREATE TABLE IF NOT EXISTS relationships (
    id SERIAL PRIMARY KEY,
    member1_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    member2_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Prevent duplicate relationships
    UNIQUE(member1_id, member2_id, relationship_type)
);

-- Unions table for tracking partnerships/marriages
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure ordered partners and prevent duplicates
    CONSTRAINT unions_ordered_partners CHECK (partner1_id < partner2_id),
    CONSTRAINT unions_unique_partners UNIQUE (partner1_id, partner2_id)
);

-- Union children table linking children to their parents' union
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
    -- Prevent duplicate entries
    UNIQUE(union_id, child_id)
);

-- Add foreign key constraints
ALTER TABLE albums ADD CONSTRAINT fk_albums_cover_photo 
    FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_member_id ON photo_tags(member_id);
CREATE INDEX IF NOT EXISTS idx_relationships_member1 ON relationships(member1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_member2 ON relationships(member2_id);
CREATE INDEX IF NOT EXISTS idx_unions_partner1 ON unions(partner1_id);
CREATE INDEX IF NOT EXISTS idx_unions_partner2 ON unions(partner2_id);
CREATE INDEX IF NOT EXISTS idx_unions_relationship ON unions(relationship_id);
CREATE INDEX IF NOT EXISTS idx_unions_type ON unions(union_type);
CREATE INDEX IF NOT EXISTS idx_unions_primary ON unions(is_primary);
CREATE INDEX IF NOT EXISTS idx_union_children_union ON union_children(union_id);
CREATE INDEX IF NOT EXISTS idx_union_children_child ON union_children(child_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for albums table
DROP TRIGGER IF EXISTS update_albums_updated_at ON albums;
CREATE TRIGGER update_albums_updated_at
    BEFORE UPDATE ON albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();-- Add this to your existing init.sql file
-- Table for storing React Flow node positions
CREATE TABLE IF NOT EXISTS tree_node_positions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    x_position DECIMAL(10,2) NOT NULL,
    y_position DECIMAL(10,2) NOT NULL,
    tree_type VARCHAR(50) NOT NULL DEFAULT 'reactflow', -- For different tree layouts
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- One position per member per tree type
    UNIQUE(member_id, tree_type)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tree_positions_member ON tree_node_positions(member_id);
CREATE INDEX IF NOT EXISTS idx_tree_positions_type ON tree_node_positions(tree_type);

-- Update trigger for tree positions
DROP TRIGGER IF EXISTS update_tree_positions_updated_at ON tree_node_positions;
CREATE TRIGGER update_tree_positions_updated_at
    BEFORE UPDATE ON tree_node_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for unions table
DROP TRIGGER IF EXISTS update_unions_updated_at ON unions;
CREATE TRIGGER update_unions_updated_at
    BEFORE UPDATE ON unions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for union_children table
DROP TRIGGER IF EXISTS update_union_children_updated_at ON union_children;
CREATE TRIGGER update_union_children_updated_at
    BEFORE UPDATE ON union_children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();