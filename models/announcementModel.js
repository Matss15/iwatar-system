const db = require("../config/database");

async function getAll() {
  return db.query("SELECT * FROM announcements ORDER BY announcement_date DESC, created_at DESC");
}

async function getToday() {
  return db.query(
    "SELECT * FROM announcements WHERE announcement_date = CURDATE() AND is_active = 1 ORDER BY created_at DESC"
  );
}

async function create(data) {
  return db.query(
    "INSERT INTO announcements (title, body, announcement_date, is_active) VALUES (?, ?, ?, ?)",
    [data.title, data.body, data.announcement_date, data.is_active ? 1 : 0]
  );
}

async function update(id, data) {
  return db.query(
    "UPDATE announcements SET title = ?, body = ?, announcement_date = ?, is_active = ? WHERE id = ?",
    [data.title, data.body, data.announcement_date, data.is_active ? 1 : 0, id]
  );
}

async function remove(id) {
  return db.query("DELETE FROM announcements WHERE id = ?", [id]);
}

module.exports = { getAll, getToday, create, update, remove };
