const db = require("../database/db");

async function listAttendance(req, res, next) {
  try {
    const records = await db.query(
      `SELECT a.id, a.student_id, s.student_number, s.first_name, s.last_name,
              a.method, a.temperature_c, a.status, a.recorded_at
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       ORDER BY a.recorded_at DESC
       LIMIT 100`
    );

    res.json(records);
  } catch (error) {
    next(error);
  }
}

async function recordFingerprintAttendance(req, res, next) {
  try {
    const { fingerprint_id, temperature_c } = req.body;

    if (!fingerprint_id) {
      return res.status(400).json({ error: "fingerprint_id is required" });
    }

    const students = await db.query("SELECT id FROM students WHERE fingerprint_id = ?", [fingerprint_id]);

    if (students.length === 0) {
      return res.status(404).json({ error: "No student found for this fingerprint" });
    }

    const record = await createAttendanceRecord(students[0].id, "fingerprint", temperature_c);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

async function recordManualAttendance(req, res, next) {
  try {
    const { student_id, temperature_c } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    const record = await createAttendanceRecord(student_id, "manual", temperature_c);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

async function createAttendanceRecord(studentId, method, temperatureC) {
  const status = Number(temperatureC) >= 37.5 ? "flagged" : "present";

  const result = await db.query(
    "INSERT INTO attendance (student_id, method, temperature_c, status) VALUES (?, ?, ?, ?)",
    [studentId, method, temperatureC || null, status]
  );

  return {
    id: result.insertId,
    student_id: Number(studentId),
    method,
    temperature_c: temperatureC || null,
    status,
  };
}

module.exports = {
  listAttendance,
  recordFingerprintAttendance,
  recordManualAttendance,
};
