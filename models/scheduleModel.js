const db = require("../config/database");

async function getAll() {
  return db.query("SELECT * FROM schedules ORDER BY FIELD(day_name, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), start_time");
}

async function getToday() {
  return db.query(
    "SELECT * FROM schedules WHERE day_name = DAYNAME(CURDATE()) ORDER BY start_time"
  );
}

async function create(data) {
  return db.query(
    "INSERT INTO schedules (day_name, start_time, end_time, subject, teacher, room) VALUES (?, ?, ?, ?, ?, ?)",
    [data.day_name, data.start_time, data.end_time, data.subject, data.teacher, data.room]
  );
}

async function update(id, data) {
  return db.query(
    "UPDATE schedules SET day_name = ?, start_time = ?, end_time = ?, subject = ?, teacher = ?, room = ? WHERE id = ?",
    [data.day_name, data.start_time, data.end_time, data.subject, data.teacher, data.room, id]
  );
}

async function remove(id) {
  return db.query("DELETE FROM schedules WHERE id = ?", [id]);
}

module.exports = { getAll, getToday, create, update, remove };
