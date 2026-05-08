const db = require("../config/database");

function field(value, fallback = null) {
  if (value === undefined || value === "") return fallback;
  return value;
}

async function getAll() {
  return db.query("SELECT * FROM students ORDER BY last_name, first_name");
}

async function getById(id) {
  const rows = await db.query("SELECT * FROM students WHERE id = ?", [id]);
  return rows[0];
}

async function create(data) {
  const result = await db.query(
    `INSERT INTO students
      (lrn, first_name, last_name, section, grade_level, photo, fingerprint_id, guardian_name, contact_number, address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      field(data.lrn),
      field(data.first_name),
      field(data.last_name),
      field(data.section),
      field(data.grade_level),
      field(data.photo, "/images/student-placeholder.svg"),
      field(data.fingerprint_id),
      field(data.guardian_name),
      field(data.contact_number),
      field(data.address),
    ]
  );
  return getById(result.insertId);
}

async function update(id, data) {
  await db.query(
    `UPDATE students
     SET lrn = ?, first_name = ?, last_name = ?, section = ?, grade_level = ?,
         photo = ?, fingerprint_id = ?, guardian_name = ?, contact_number = ?, address = ?
     WHERE id = ?`,
    [
      field(data.lrn),
      field(data.first_name),
      field(data.last_name),
      field(data.section),
      field(data.grade_level),
      field(data.photo || data.current_photo, "/images/student-placeholder.svg"),
      field(data.fingerprint_id || data.current_fingerprint_id),
      field(data.guardian_name),
      field(data.contact_number),
      field(data.address),
      id,
    ]
  );
  return getById(id);
}

async function remove(id) {
  return db.query("DELETE FROM students WHERE id = ?", [id]);
}

async function updateFingerprintId(id, fingerprintId) {
  await db.query("UPDATE students SET fingerprint_id = ? WHERE id = ?", [fingerprintId, id]);
  return getById(id);
}

module.exports = { getAll, getById, create, update, remove, updateFingerprintId };
