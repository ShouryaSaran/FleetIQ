const db = require("../config/db");
const logger = require("../config/logger");

const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT
        u.user_id, u.username, u.full_name, u.email, u.role_id,
        r.role_name, r.description AS role_description,
        a.auth_id, a.is_active, a.last_login, a.created_at
      FROM user u
      JOIN role r ON u.role_id = r.role_id
      LEFT JOIN auth a ON u.user_id = a.employee_id
    `);
    logger.info(`[USERS] Fetched ${users.length} users`);
    res.status(200).json(users);
  } catch (error) {
    logger.error(`[USERS ERROR] Failed to fetch users: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch users.", error: error.message });
  }
};

module.exports = { getAllUsers };
