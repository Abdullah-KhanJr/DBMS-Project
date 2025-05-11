-- Test data SQL script
-- Create a test faculty user if one doesn't exist
INSERT INTO users (email, password, name, user_type)
VALUES ('faculty@test.com', '$2a$10$B7BmS.EW14gkH.NXAtLbEuXmC8wFQCRLXuI1OHmhH1XQBFQQDDh/e', 'Test Faculty', 'faculty')
ON CONFLICT (email) DO NOTHING;

-- Get the user ID of the test faculty user
WITH faculty_user AS (
    SELECT user_id FROM users WHERE email = 'faculty@test.com' LIMIT 1
)
INSERT INTO faculty (faculty_id, user_id, department)
SELECT 1000, user_id, 'Computer Science'
FROM faculty_user
ON CONFLICT (faculty_id) DO NOTHING;

-- Insert test courses
INSERT INTO courses (course_code, course_title, credit_hours, faculty_id, section, description, semester)
VALUES 
    ('CS101', 'Introduction to Programming', 3, 1000, 'A', 'Basic programming concepts', 'Spring 2025'),
    ('CS232', 'Database Management Systems', 3, 1000, 'B', 'Database design and SQL', 'Spring 2025')
ON CONFLICT (course_code) DO NOTHING;
