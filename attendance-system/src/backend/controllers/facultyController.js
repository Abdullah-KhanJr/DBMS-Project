const db = require('../config/db');

// Get faculty profile
exports.getProfile = async (req, res) => {
  try {
    console.log('User in request:', req.user);
    
    // Get user information
    const userQuery = `SELECT * FROM users WHERE user_id = $1`;
    const userResult = await db.query(userQuery, [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    // Get faculty information
    const facultyQuery = `SELECT * FROM faculty WHERE user_id = $1`;
    const facultyResult = await db.query(facultyQuery, [req.user.id]);
    
    let facultyData = {};
    if (facultyResult.rows.length > 0) {
      facultyData = facultyResult.rows[0];
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
        faculty_id: facultyData.faculty_id,
        department: facultyData.department
      }
    });
  } catch (error) {
    console.error('Error getting faculty profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    console.log('Create course request body:', JSON.stringify(req.body));
    
    // Extract fields from request body with explicit debugging
    const { 
      course_code, 
      course_name, 
      credit_hours, 
      section_id, 
      description, 
      semester 
    } = req.body;
    
    // Debug all received values
    console.log('Extracted values:');
    console.log('- course_code:', course_code, typeof course_code);
    console.log('- course_name:', course_name, typeof course_name);
    console.log('- credit_hours:', credit_hours, typeof credit_hours);
    console.log('- section_id:', section_id, typeof section_id);
    console.log('- description:', description, typeof description);
    console.log('- semester:', semester, typeof semester);
    
    // Check if request body is properly parsed
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Request body is empty or not parsed correctly');
      return res.status(400).json({
        success: false,
        message: 'No data provided or request body not parsed correctly'
      });
    }
    
    // More tolerant validation
    const errors = [];
    
    if (!course_code) errors.push('course_code');
    if (!course_name) errors.push('course_name');
    if (credit_hours === undefined || credit_hours === null) errors.push('credit_hours');
    if (!section_id) errors.push('section_id');
    if (!semester) errors.push('semester');
    
    if (errors.length > 0) {
      console.error(`Missing required fields: ${errors.join(', ')}`);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${errors.join(', ')}`,
        received: req.body
      });
    }
    
    // Get faculty_id from the faculty table using user_id
    console.log(`Getting faculty_id for user_id: ${req.user.id}`);
    const facultyQuery = 'SELECT faculty_id FROM faculty WHERE user_id = $1';
    const facultyResult = await db.query(facultyQuery, [req.user.id]);
    
    let faculty_id;
    
    if (facultyResult.rows.length === 0) {
      console.log(`No faculty record found for user_id: ${req.user.id}, creating one`);
      // Create a faculty record if it doesn't exist
      const newFacultyResult = await db.query(
        'INSERT INTO faculty (user_id, department) VALUES ($1, $2) RETURNING faculty_id',
        [req.user.id, 'General']
      );
      faculty_id = newFacultyResult.rows[0].faculty_id;
    } else {
      faculty_id = facultyResult.rows[0].faculty_id;
    }
    
    console.log(`Using faculty_id: ${faculty_id}`);
    
    // Insert new course with section as VARCHAR
    console.log('Preparing SQL insert with values:', {
      course_code,
      course_title: course_name,
      credit_hours,
      faculty_id,
      section: section_id,
      description: description || '',
      semester
    });
    
    const insertQuery = `
      INSERT INTO courses (
        course_code, 
        course_title, 
        credit_hours, 
        faculty_id, 
        section, 
        description, 
        semester
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      course_code, 
      course_name, 
      credit_hours, 
      faculty_id, 
      section_id, 
      description || '', 
      semester
    ];
    
    console.log('Executing SQL with values:', values);
    
    const result = await db.query(insertQuery, values);
    console.log('SQL insert successful, returned:', result.rows[0]);
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating course:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Handle duplicate course code error
    if (error.code === '23505') { // Unique violation in PostgreSQL
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};


// Get all courses for faculty
// Update the getCourses method to be simpler and match your database schema

exports.getCourses = async (req, res) => {
  try {
    console.log('Getting courses for user:', req.user.id);
    
    // First check if the user exists in faculty table
    const userCheckQuery = 'SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1) AS user_exists';
    const userCheckResult = await db.query(userCheckQuery, [req.user.id]);
    
    if (!userCheckResult.rows[0].user_exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return basic dummy data for now since your schema might not have the courses table yet
    console.log('Returning dummy course data');
    
    res.status(200).json({
      success: true,
      data: [
        {
          course_id: 1,
          course_code: 'CS101',
          course_name: 'Introduction to Programming',
          credit_hours: 3,
          section_name: 'A',
          student_count: 45,
          attendance_rate: 92
        },
        {
          course_id: 2,
          course_code: 'CS232',
          course_name: 'Database Management Systems',
          credit_hours: 4,
          section_name: 'B',
          student_count: 38,
          attendance_rate: 85
        }
      ]
    });
  } catch (error) {
    console.error('Error getting faculty courses:', error.message);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all sections
exports.getSections = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sections ORDER BY name');
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting sections:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get recent attendance records
exports.getRecentAttendance = async (req, res) => {
  try {
    // Get faculty_id from the faculty table using user_id
    const facultyQuery = 'SELECT faculty_id FROM faculty WHERE user_id = $1';
    const facultyResult = await db.query(facultyQuery, [req.user.id]);
    
    if (facultyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    const faculty_id = facultyResult.rows[0].faculty_id;
    
    // Get recent attendance statistics for this faculty's courses
    const statsQuery = `
      SELECT 
        as.statistic_id,
        as.course_id,
        c.course_code,
        c.course_title as course_name,
        as.present_count,
        as.absent_count,
        as.leave_count,
        as.attendance_date,
        cs.session_code
      FROM 
        attendance_statistics as
      JOIN 
        courses c ON as.course_id = c.course_id
      JOIN 
        course_sessions cs ON as.session_id = cs.session_id
      WHERE 
        c.faculty_id = $1
      ORDER BY 
        as.attendance_date DESC, as.calculated_at DESC
      LIMIT 10
    `;
    
    const statsResult = await db.query(statsQuery, [faculty_id]);
    
    // Calculate percentage for each attendance record
    const records = statsResult.rows.map(record => {
      const total = record.present_count + record.absent_count + record.leave_count;
      const percentage = total > 0 ? Math.round((record.present_count / total) * 100) : 0;
      
      return {
        ...record,
        percentage,
        total_count: total
      };
    });
    
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error getting recent attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};