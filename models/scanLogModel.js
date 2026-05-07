const db = require("../config/database");

async function getAll() {
  return db.query(
    `SELECT scan_logs.*, students.lrn, students.first_name, students.last_name, students.section
     FROM scan_logs
     LEFT JOIN students ON students.id = scan_logs.student_id
     ORDER BY scan_logs.scanned_at DESC`
  );
}

async function getRecent(limit = 8) {
  return db.query(
    `SELECT scan_logs.*, students.lrn, students.first_name, students.last_name, students.section
     FROM scan_logs
     LEFT JOIN students ON students.id = scan_logs.student_id
     ORDER BY scan_logs.scanned_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
}

async function getByDate(dateText) {
  return db.query(
    `SELECT scan_logs.*, students.lrn, students.first_name, students.last_name, students.section
     FROM scan_logs
     LEFT JOIN students ON students.id = scan_logs.student_id
     WHERE DATE(scan_logs.scanned_at) = ?
     ORDER BY scan_logs.scanned_at DESC`,
    [dateText]
  );
}

async function create(data) {
  return db.query(
    "INSERT INTO scan_logs (student_id, scan_type, temperature_c, status, message) VALUES (?, ?, ?, ?, ?)",
    [data.student_id || null, data.scan_type, data.temperature_c || null, data.status, data.message || null]
  );
}

async function remove(id) {
  return db.query("DELETE FROM scan_logs WHERE id = ?", [id]);
}

module.exports = { getAll, getRecent, getByDate, create, remove };
