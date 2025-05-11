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
      c.course_name, 
      c.credit_hours, 
      c.description,
      s.name AS section_name,
      s.section_id,
      (SELECT COUNT(*) FROM student_course sc WHERE sc.course_id = c.course_id) AS student_count,
      (
        SELECT COALESCE(AVG(
          CASE 
            WHEN ast.label = 'Present' THEN 100
            WHEN ast.label = 'Leave' THEN 50
            ELSE 0 
          END
        ), 0)
        FROM attendance a 
        JOIN attendance_status ast ON a.status_id = ast.status_id
        WHERE a.course_id = c.course_id
      ) AS attendance_rate
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
    INSERT INTO courses (course_code, course_name, credit_hours, section_id, description, faculty_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const values = [
    courseData.course_code,
    courseData.course_name,
    courseData.credit_hours,
    courseData.section_id,
    courseData.description,
    facultyId
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

// Get students enrolled in a course
exports.getEnrolledStudents = async (courseId) => {
  const query = `
    SELECT 
      sc.enrollment_id,
      s.registration_number,
      u.name AS student_name,
      u.email,
      sc.enrollment_date
    FROM student_course sc
    JOIN students s ON sc.registration_number = s.registration_number
    JOIN users u ON s.user_id = u.user_id
    WHERE sc.course_id = $1
    ORDER BY u.name
  `;
  const { rows } = await db.query(query, [courseId]);
  return rows;
};

// Enroll a student in a course
exports.enrollStudent = async (courseId, registrationNumber) => {
  const query = `
    INSERT INTO student_course (registration_number, course_id)
    VALUES ($1, $2)
    RETURNING *
  `;
  const { rows } = await db.query(query, [registrationNumber, courseId]);
  return rows[0];
};

// Remove a student from a course
exports.removeEnrollment = async (enrollmentId) => {
  const query = 'DELETE FROM student_course WHERE enrollment_id = $1 RETURNING *';
  const { rows } = await db.query(query, [enrollmentId]);
  return rows[0];
};

// Create a course session
exports.createCourseSession = async (sessionData) => {
  const query = `
    INSERT INTO course_sessions (session_code, course_id, session_date, session_time, duration)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const values = [
    sessionData.session_code,
    sessionData.course_id,
    sessionData.session_date,
    sessionData.session_time,
    sessionData.duration
  ];
  
  const { rows } = await db.query(query, values);
  return rows[0];
};

// Get course sessions count
exports.getCourseSessions = async (facultyId) => {
  const query = `
    SELECT 
      c.course_id,
      c.course_code,
      c.course_name,
      c.credit_hours,
      COUNT(cs.session_id) AS sessions_conducted,
      CASE 
        WHEN c.credit_hours = 3 THEN 45
        WHEN c.credit_hours = 2 THEN 30
        ELSE 15
      END AS max_sessions
    FROM courses c
    LEFT JOIN course_sessions cs ON c.course_id = cs.course_id
    WHERE c.faculty_id = $1
    GROUP BY c.course_id, c.course_code, c.course_name, c.credit_hours
    ORDER BY c.course_code
  `;
  
  const { rows } = await db.query(query, [facultyId]);
  return rows;
};

// Get course attendance statistics
exports.getCourseAttendanceStats = async (facultyId) => {
  const query = `
    SELECT 
      c.course_id,
      c.course_code,
      c.course_name,
      c.credit_hours,
      s.name as section_name,
      (SELECT COUNT(*) FROM student_course sc WHERE sc.course_id = c.course_id) AS total_students,
      COUNT(DISTINCT cs.session_id) AS conducted_sessions,
      (
        SELECT COALESCE(AVG(
          CASE 
            WHEN ast.label = 'Present' THEN 100
            WHEN ast.label = 'Leave' THEN 50
            ELSE 0 
          END
        ), 0)
        FROM attendance a 
        JOIN attendance_status ast ON a.status_id = ast.status_id
        WHERE a.course_id = c.course_id
      ) AS avg_attendance
    FROM courses c
    LEFT JOIN sections s ON c.section_id = s.section_id
    LEFT JOIN course_sessions cs ON c.course_id = cs.course_id
    WHERE c.faculty_id = $1
    GROUP BY c.course_id, c.course_code, c.course_name, c.credit_hours, s.name
    ORDER BY c.course_code
  `;
  
  const { rows } = await db.query(query, [facultyId]);
  return rows;
};

// Get attendance records for a course
exports.getCourseAttendance = async (courseId) => {
  const query = `
    SELECT 
      s.registration_number,
      u.name AS student_name,
      COUNT(cs.session_id) AS total_sessions,
      SUM(CASE WHEN ast.label = 'Present' THEN 1 ELSE 0 END) AS present,
      SUM(CASE WHEN ast.label = 'Absent' THEN 1 ELSE 0 END) AS absent,
      SUM(CASE WHEN ast.label = 'Leave' THEN 1 ELSE 0 END) AS leaves,
      ROUND(
        SUM(CASE WHEN ast.label = 'Present' THEN 100 WHEN ast.label = 'Leave' THEN 50 ELSE 0 END) / 
        (COUNT(cs.session_id) * 100) * 100, 
        1
      ) AS percentage
    FROM students s
    JOIN users u ON s.user_id = u.user_id
    JOIN student_course sc ON s.registration_number = sc.registration_number
    LEFT JOIN course_sessions cs ON cs.course_id = sc.course_id
    LEFT JOIN attendance a ON a.registration_number = s.registration_number AND a.session_id = cs.session_id
    LEFT JOIN attendance_status ast ON a.status_id = ast.status_id
    WHERE sc.course_id = $1
    GROUP BY s.registration_number, u.name
    ORDER BY u.name
  `;
  
  const { rows } = await db.query(query, [courseId]);
  return rows;
};

// Mark attendance
exports.markAttendance = async (attendanceData) => {
  const query = `
    INSERT INTO attendance (
      registration_number, 
      course_id, 
      session_id, 
      status_id, 
      attendance_date, 
      attendance_time,
      marked_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    attendanceData.registration_number,
    attendanceData.course_id,
    attendanceData.session_id,
    attendanceData.status_id,
    attendanceData.attendance_date,
    attendanceData.attendance_time,
    attendanceData.marked_by
  ];
  
  const { rows } = await db.query(query, values);
  return rows[0];
};

// Get attendance status IDs
exports.getAttendanceStatuses = async () => {
  const query = 'SELECT status_id, label FROM attendance_status';
  const { rows } = await db.query(query);
  return rows;
};

// Get student details for attendance verification
exports.getStudentByRegistrationNumber = async (regNumber) => {
  const query = `
    SELECT 
      s.registration_number,
      u.name,
      u.email,
      s.faculty
    FROM students s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.registration_number = $1
  `;
  const { rows } = await db.query(query, [regNumber]);
  return rows[0];
};