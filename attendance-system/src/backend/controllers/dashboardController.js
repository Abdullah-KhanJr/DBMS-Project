exports.getStudentDashboardData = async (req, res) => {
    try {
        const studentId = req.user.id;
        // Fetch student-specific data from the database
        const attendanceData = await Attendance.findAll({ where: { studentId } });
        const courses = await Course.findAll({ where: { studentId } });
        
        res.status(200).json({ attendanceData, courses });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving student dashboard data', error });
    }
};

exports.getFacultyDashboardData = async (req, res) => {
    try {
        const facultyId = req.user.id;
        // Fetch faculty-specific data from the database
        const courses = await Course.findAll({ where: { facultyId } });
        const attendanceRecords = await Attendance.findAll({ where: { facultyId } });
        
        res.status(200).json({ courses, attendanceRecords });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving faculty dashboard data', error });
    }
};

exports.getAdminDashboardData = async (req, res) => {
    try {
        // Fetch overall system data for admin
        const totalStudents = await User.count({ where: { role: 'student' } });
        const totalFaculty = await User.count({ where: { role: 'faculty' } });
        const totalAttendanceRecords = await Attendance.count();
        
        res.status(200).json({ totalStudents, totalFaculty, totalAttendanceRecords });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving admin dashboard data', error });
    }
};