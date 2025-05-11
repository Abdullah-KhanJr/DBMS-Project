const facultyModel = require('../models/facultyModel');
const jwt = require('jsonwebtoken');

// Get faculty profile
exports.getProfile = async (req, res) => {
  try {
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: faculty
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

// Get all courses for a faculty
exports.getCourses = async (req, res) => {
  try {
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    const courses = await facultyModel.getFacultyCourses(faculty.faculty_id);
    
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error getting faculty courses:', error);
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
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    const courseData = {
      course_code: req.body.course_code,
      course_name: req.body.course_title || req.body.course_name,
      credit_hours: req.body.credit_hours,
      section_id: req.body.section_id || null,
      description: req.body.description || null
    };
    
    const course = await facultyModel.createCourse(courseData, faculty.faculty_id);
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
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
    const sections = await facultyModel.getAllSections();
    
    res.status(200).json({
      success: true,
      data: sections
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

// Get students enrolled in a course
exports.getEnrolledStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    // Check if this course belongs to the faculty (security check)
    const courses = await facultyModel.getFacultyCourses(faculty.faculty_id);
    const isFacultyCourse = courses.some(course => course.course_id === parseInt(courseId));
    
    if (!isFacultyCourse) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this course'
      });
    }
    
    const students = await facultyModel.getEnrolledStudents(courseId);
    
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error getting enrolled students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Verify student by registration number
exports.verifyStudent = async (req, res) => {
  try {
    const { regNumber } = req.params;
    
    const student = await facultyModel.getStudentByRegistrationNumber(regNumber);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error verifying student:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Enroll student in a course
exports.enrollStudent = async (req, res) => {
  try {
    const { course_id, registration_number } = req.body;
    
    // Check if student exists
    const student = await facultyModel.getStudentByRegistrationNumber(registration_number);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check if faculty has access to this course
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    const courses = await facultyModel.getFacultyCourses(faculty.faculty_id);
    const isFacultyCourse = courses.some(course => course.course_id === parseInt(course_id));
    
    if (!isFacultyCourse) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to enroll students in this course'
      });
    }
    
    const enrollment = await facultyModel.enrollStudent(course_id, registration_number);
    
    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    
    // Check for duplicate key violation
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove enrollment
exports.removeEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    // Security check would be implemented here to ensure faculty can only remove from their own courses
    
    const enrollment = await facultyModel.removeEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Student removed from course',
      data: enrollment
    });
  } catch (error) {
    console.error('Error removing enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create a course session
exports.createCourseSession = async (req, res) => {
  try {
    const { course_id, session_date, session_time, duration } = req.body;
    
    // Check if faculty has access to this course
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    const courses = await facultyModel.getFacultyCourses(faculty.faculty_id);
    const course = courses.find(course => course.course_id === parseInt(course_id));
    
    if (!course) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create sessions for this course'
      });
    }
    
    // Generate a unique session code
    const sessionCode = `${course.course_code}-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(Math.random()*1000)}`;
    
    const sessionData = {
      session_code: sessionCode,
      course_id,
      session_date,
      session_time,
      duration: duration || 60
    };
    
    const session = await facultyModel.createCourseSession(sessionData);
    
    res.status(201).json({
      success: true,
      data: {
        ...session,
        course_name: course.course_name,
        course_code: course.course_code
      }
    });
  } catch (error) {
    console.error('Error creating course session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get course sessions
exports.getCourseSessions = async (req, res) => {
  try {
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    const sessions = await facultyModel.getCourseSessions(faculty.faculty_id);
    
    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error getting course sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get course attendance statistics
exports.getCourseAttendanceStats = async (req, res) => {
  try {
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    const stats = await facultyModel.getCourseAttendanceStats(faculty.faculty_id);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting course attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get attendance records for a course
exports.getCourseAttendanceRecords = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Security check
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    const courses = await facultyModel.getFacultyCourses(faculty.faculty_id);
    const course = courses.find(course => course.course_id === parseInt(courseId));
    
    if (!course) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this course'
      });
    }
    
    const records = await facultyModel.getCourseAttendance(courseId);
    
    res.status(200).json({
      success: true,
      course,
      data: records
    });
  } catch (error) {
    console.error('Error getting course attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark attendance for students
exports.markAttendance = async (req, res) => {
  try {
    const { session_id, attendance } = req.body;
    
    // Security check
    const faculty = await facultyModel.getFacultyByUserId(req.user.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }
    
    // Get attendance status IDs
    const statuses = await facultyModel.getAttendanceStatuses();
    const statusMap = {};
    statuses.forEach(status => {
      statusMap[status.label] = status.status_id;
    });
    
    // Get course ID from session
    // In a real implementation, you'd fetch the course_id from the session and verify faculty access
    
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];
    const currentTime = today.toTimeString().split(' ')[0];
    
    // Process each attendance record
    const results = [];
    
    for (const record of attendance) {
      const attendanceData = {
        registration_number: record.registration_number,
        course_id: record.course_id, // This would come from the session in a real implementation
        session_id,
        status_id: statusMap[record.status] || statusMap['Absent'], // Default to Absent if invalid
        attendance_date: currentDate,
        attendance_time: currentTime,
        marked_by: faculty.faculty_id
      };
      
      const result = await facultyModel.markAttendance(attendanceData);
      results.push(result);
    }
    
    res.status(201).json({
      success: true,
      message: `Marked attendance for ${results.length} students`,
      data: results
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};