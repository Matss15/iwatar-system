const db = require("../config/database");

let adminColumnsReady = false;

async function ensureAdminColumns() {
  if (adminColumnsReady) return;

  const columns = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'admins'
       AND COLUMN_NAME IN ('google_email', 'google_id', 'otp_secret', 'otp_enabled')`
  );
  const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!existingColumns.has("google_email")) {
    await db.query("ALTER TABLE admins ADD COLUMN google_email VARCHAR(190) UNIQUE AFTER password_hash");
  }

  if (!existingColumns.has("google_id")) {
    await db.query("ALTER TABLE admins ADD COLUMN google_id VARCHAR(255) UNIQUE AFTER google_email");
  }

  if (!existingColumns.has("otp_secret")) {
    await db.query("ALTER TABLE admins ADD COLUMN otp_secret VARCHAR(64) AFTER google_id");
  }

  if (!existingColumns.has("otp_enabled")) {
    await db.query("ALTER TABLE admins ADD COLUMN otp_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER otp_secret");
  }

  adminColumnsReady = true;
}

async function getAll() {
  await ensureAdminColumns();
  return db.query(
    "SELECT id, username, google_email, otp_enabled, full_name, role, created_at FROM admins ORDER BY username"
  );
}

async function findByUsername(username) {
  await ensureAdminColumns();
  const rows = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
  return rows[0];
}

async function findById(id) {
  await ensureAdminColumns();
  const rows = await db.query("SELECT * FROM admins WHERE id = ?", [id]);
  return rows[0];
}

async function findByGoogleProfile(profile) {
  await ensureAdminColumns();

  const rows = await db.query(
    `SELECT *
     FROM admins
     WHERE google_id = ?
        OR google_email = ?
        OR username = ?
     LIMIT 1`,
    [profile.id, profile.email, profile.email]
  );

  return rows[0];
}

async function linkGoogleProfile(id, profile) {
  await ensureAdminColumns();

  return db.query(
    "UPDATE admins SET google_email = ?, google_id = ? WHERE id = ?",
    [profile.email, profile.id, id]
  );
}

async function create(data) {
  await ensureAdminColumns();

  return db.query(
    "INSERT INTO admins (username, password_hash, google_email, full_name, role) VALUES (?, ?, ?, ?, ?)",
    [data.username, data.password_hash, data.google_email || null, data.full_name, data.role || "Admin"]
  );
}

async function update(id, data) {
  await ensureAdminColumns();

  const params = [data.username, data.google_email || null, data.full_name, data.role || "Admin"];
  let sql = "UPDATE admins SET username = ?, google_email = ?, full_name = ?, role = ?";

  if (data.password_hash) {
    sql += ", password_hash = ?";
    params.push(data.password_hash);
  }

  sql += " WHERE id = ?";
  params.push(id);

  return db.query(sql, params);
}

async function remove(id) {
  return db.query("DELETE FROM admins WHERE id = ?", [id]);
}

async function setOtpSecret(id, secret) {
  await ensureAdminColumns();
  return db.query("UPDATE admins SET otp_secret = ? WHERE id = ?", [secret, id]);
}

async function enableOtp(id) {
  await ensureAdminColumns();
  return db.query("UPDATE admins SET otp_enabled = 1 WHERE id = ?", [id]);
}

module.exports = {
  getAll,
  findByUsername,
  findById,
  findByGoogleProfile,
  linkGoogleProfile,
  create,
  update,
  remove,
  setOtpSecret,
  enableOtp,
};
