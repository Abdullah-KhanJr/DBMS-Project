exports.getStudentCourses = async (req, res) => {
    const { registration_number } = req.params;
    try {
        const result = await require('../config/db').query(
            `SELECT c.course_id, c.course_code, c.course_title, c.credit_hours, c.section, c.semester,
                    f.faculty_id, u.name AS instructor_name
             FROM student_course sc
             JOIN courses c ON sc.course_id = c.course_id
             LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
             LEFT JOIN users u ON f.user_id = u.user_id
             WHERE sc.registration_number = $1`,
            [registration_number]
        );
        res.status(200).json({ success: true, courses: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}; 