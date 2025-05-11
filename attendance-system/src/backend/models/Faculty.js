const db = require('../config/db');

// Get faculty profile by user ID
exports.getFacultyByUserId = async (userId) => {
  const query = `
    SELECT f.faculty_id, u.name, u.email, f.department
    FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    WHERE u.user_id = $1
  `;
  const { rows } = await db.query(query, [userId]);
  return rows[0];
};

// Get faculty courses
exports.getFacultyCourses = async (facultyId) => {
  const query = `
    SELECT 
      c.course_id, 
      c.course_code, 
      c.course_title AS course_name, 
      c.credit_hours, 
      c.description,
      c.semester,
      s.name AS section_name,
      s.section_id,
      (SELECT COUNT(*) FROM student_course sc WHERE sc.course_id = c.course_id) AS student_count
    FROM courses c
    LEFT JOIN sections s ON c.section_id = s.section_id
    WHERE c.faculty_id = $1
    ORDER BY c.course_code
  `;
  const { rows } = await db.query(query, [facultyId]);
  return rows;
};

// Create a new course
exports.createCourse = async (courseData, facultyId) => {
  const query = `
    INSERT INTO courses (
      course_code, 
      course_title, 
      credit_hours, 
      section_id, 
      description, 
      faculty_id,
      semester
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    courseData.course_code,
    courseData.course_name,
    courseData.credit_hours,
    courseData.section_id,
    courseData.description,
    facultyId,
    courseData.semester
  ];
  
  const { rows } = await db.query(query, values);
  return rows[0];
};

// Get all sections
exports.getAllSections = async () => {
  const query = 'SELECT section_id, name FROM sections ORDER BY name';
  const { rows } = await db.query(query);
  return rows;
};