const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Admin: Get all courses with faculty and section info
router.get('/courses', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.course_id, c.course_code, c.course_title, c.section, c.faculty_id, u.name AS instructor_name
             FROM courses c
             LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
             LEFT JOIN users u ON f.user_id = u.user_id`
        );
        res.json({ courses: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. GET /attendance/recent - last 10 sessions across all courses
router.get('/attendance/recent', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT cs.session_id, cs.session_date, cs.session_time, c.course_code, c.course_title, c.section, u.name AS instructor_name,
                (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.session_id AND a.status_id = 1) AS present,
                (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.session_id AND a.status_id = 2) AS absent,
                (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.session_id AND a.status_id = 3) AS leave
            FROM course_sessions cs
            JOIN courses c ON cs.course_id = c.course_id
            LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
            LEFT JOIN users u ON f.user_id = u.user_id
            ORDER BY cs.session_date DESC, cs.session_time DESC
            LIMIT 10
        `);
        res.json({ sessions: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET /attendance/sessions?course_id=... - all sessions for a course
router.get('/attendance/sessions', async (req, res) => {
    const { course_id } = req.query;
    try {
        const result = await db.query(`
            SELECT cs.session_id, cs.session_date, cs.session_time,
                (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.session_id AND a.status_id = 1) AS present,
                (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.session_id AND a.status_id = 2) AS absent,
                (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.session_id AND a.status_id = 3) AS leave
            FROM course_sessions cs
            WHERE cs.course_id = $1
            ORDER BY cs.session_date, cs.session_time
        `, [course_id]);
        res.json({ sessions: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. GET /attendance/session/:session_id - all students and their status for a session
router.get('/attendance/session/:session_id', async (req, res) => {
    const { session_id } = req.params;
    try {
        const result = await db.query(`
            SELECT s.registration_number, u.name, a.status_id, ast.label as status_label
            FROM attendance a
            JOIN students s ON a.registration_number = s.registration_number
            JOIN users u ON s.user_id = u.user_id
            JOIN attendance_status ast ON a.status_id = ast.status_id
            WHERE a.session_id = $1
        `, [session_id]);
        res.json({ students: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. POST /attendance/session/:session_id - update attendance for all students in a session
router.post('/attendance/session/:session_id', async (req, res) => {
    const { session_id } = req.params;
    const { attendance } = req.body; // [{ registration_number, status_label }]
    try {
        for (const record of attendance) {
            // Get status_id from label
            const statusRes = await db.query('SELECT status_id FROM attendance_status WHERE label = $1', [record.status_label]);
            const status_id = statusRes.rows[0]?.status_id || null;
            if (status_id) {
                await db.query(
                    `UPDATE attendance SET status_id = $1 WHERE session_id = $2 AND registration_number = $3`,
                    [status_id, session_id, record.registration_number]
                );
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 