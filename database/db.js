const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "iwatar_system",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
});

async function query(sql, params = []) {
  // mysql2 rejects JavaScript undefined values. SQL NULL is the correct empty value.
  const safeParams = params.map((value) => (value === undefined ? null : value));
  const [rows] = await pool.execute(sql, safeParams);
  return rows;
}

async function testConnection() {
  try {
    await query("SELECT 1");
    return "connected";
  } catch (error) {
    return "disconnected";
  }
}

module.exports = {
  pool,
  query,
  testConnection,
};
