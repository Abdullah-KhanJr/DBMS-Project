-- Update courses table to use section name instead of section_id
ALTER TABLE courses DROP COLUMN IF EXISTS section_id CASCADE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS section VARCHAR(10);

-- Add sections if they don't exist
INSERT INTO sections (name) 
VALUES 
('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H')
ON CONFLICT (name) DO NOTHING;
