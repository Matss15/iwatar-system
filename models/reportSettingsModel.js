const db = require("../config/database");

const DEFAULT_SETTINGS_ID = 1;

async function ensureTable() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS report_settings (
      id INT PRIMARY KEY,
      recipients TEXT,
      auto_enabled TINYINT(1) NOT NULL DEFAULT 0,
      send_time CHAR(5) NOT NULL DEFAULT '17:00',
      last_auto_sent_date DATE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );

  await db.query(
    `INSERT IGNORE INTO report_settings (id, recipients, auto_enabled, send_time)
     VALUES (?, '', 0, '17:00')`,
    [DEFAULT_SETTINGS_ID]
  );
}

async function get() {
  await ensureTable();
  const rows = await db.query("SELECT * FROM report_settings WHERE id = ?", [DEFAULT_SETTINGS_ID]);
  return rows[0];
}

async function update(data) {
  await ensureTable();
  await db.query(
    `UPDATE report_settings
     SET recipients = ?, auto_enabled = ?, send_time = ?
     WHERE id = ?`,
    [data.recipients || "", data.auto_enabled ? 1 : 0, data.send_time || "17:00", DEFAULT_SETTINGS_ID]
  );
  return get();
}

async function markAutoSent(dateText) {
  await ensureTable();
  return db.query("UPDATE report_settings SET last_auto_sent_date = ? WHERE id = ?", [dateText, DEFAULT_SETTINGS_ID]);
}

module.exports = {
  ensureTable,
  get,
  update,
  markAutoSent,
};
