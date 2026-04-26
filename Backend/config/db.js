const mysql = require("mysql2/promise");
require("dotenv").config();

const logger = require("./logger");
const isDev = process.env.NODE_ENV === "development";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

if (isDev) {
  const originalQuery = pool.query.bind(pool);
  pool.query = async (sql, values) => {
    const start = Date.now();
    try {
      const result = await originalQuery(sql, values);
      const ms = Date.now() - start;
      const preview = typeof sql === "string" ? sql.trim().slice(0, 80) : "[query object]";
      logger.debug(`[DB] ${preview} (${ms}ms)`);
      return result;
    } catch (err) {
      logger.error(`[DB ERROR] Query failed: ${err.message}`);
      throw err;
    }
  };
}

module.exports = pool;
