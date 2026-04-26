const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const db = require("../config/db");
const logger = require("../config/logger");
const { JWT_SECRET, JWT_EXPIRES_IN, SALT_ROUNDS } = require("../config/auth");

const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
};

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation failed.", errors: errors.array() });
    return true;
  }
  return false;
};

const signup = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { name, email, username, password, role_id } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

  logger.info(`[AUTH] Signup attempt: username=${normalizedUsername}`);

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT auth_id FROM auth WHERE username = ?
       UNION
       SELECT NULL AS auth_id FROM user WHERE email = ?
       LIMIT 1`,
      [normalizedUsername, normalizedEmail]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "Username or email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [userResult] = await connection.query(
      "INSERT INTO user (username, full_name, email, role_id) VALUES (?, ?, ?, ?)",
      [normalizedUsername, name.trim(), normalizedEmail, role_id]
    );

    const employeeId = userResult.insertId;

    await connection.query(
      "INSERT INTO auth (employee_id, username, password_hash) VALUES (?, ?, ?)",
      [employeeId, normalizedUsername, passwordHash]
    );

    await connection.commit();

    logger.info(`[AUTH] Signup success: username=${normalizedUsername} employee_id=${employeeId}`);
    return res.status(201).json({ message: "Signup successful.", employee_id: employeeId });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error(`[AUTH ERROR] Signup failed for username=${normalizedUsername}: ${error.message}`);
    return res.status(500).json({ message: "Failed to create account.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const login = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { username, password } = req.body;
  const normalizedUsername = username.trim();
  const ip = getRequestIp(req);

  logger.info(`[AUTH] Login attempt: username=${normalizedUsername}`);

  let connection;
  try {
    connection = await db.getConnection();

    const [accounts] = await connection.query(
      `SELECT
         a.auth_id, a.employee_id, a.username, a.password_hash,
         a.last_login, a.is_active,
         u.email, u.full_name AS name, u.role_id,
         r.role_name
       FROM auth a
       INNER JOIN user u ON a.employee_id = u.user_id
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE a.username = ?
       LIMIT 1`,
      [normalizedUsername]
    );

    if (accounts.length === 0) {
      logger.warn(`[AUTH] Login failed (user not found): username=${normalizedUsername}`);
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const account = accounts[0];

    if (!account.is_active) {
      logger.warn(`[AUTH] Login failed (disabled): username=${normalizedUsername}`);
      return res.status(403).json({ message: "Account is disabled." });
    }

    const passwordMatches = await bcrypt.compare(password, account.password_hash);
    if (!passwordMatches) {
      logger.warn(`[AUTH] Login failed (wrong password): username=${normalizedUsername}`);
      return res.status(401).json({ message: "Invalid username or password." });
    }

    await connection.query(
      "UPDATE auth SET last_login = NOW() WHERE auth_id = ?",
      [account.auth_id]
    );

    const tokenPayload = {
      auth_id: account.auth_id,
      employee_id: account.employee_id,
      username: account.username,
      role_id: account.role_id,
      role_name: account.role_name,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    logger.info(`[AUTH] Login success: username=${normalizedUsername} role=${account.role_name} ip=${ip}`);

    return res.status(200).json({
      token,
      employee_id: account.employee_id,
      username: account.username,
      role_name: account.role_name,
      name: account.name,
      email: account.email,
    });
  } catch (error) {
    logger.error(`[AUTH ERROR] Login failed for username=${normalizedUsername}: ${error.message}`);
    return res.status(500).json({ message: "Failed to log in.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const logout = async (req, res) => {
  const { auth_id } = req.body;

  if (!auth_id) {
    return res.status(400).json({ message: "auth_id is required." });
  }

  logger.info(`[AUTH] Logout: auth_id=${auth_id}`);
  return res.status(200).json({ message: "Logout successful." });
};

const me = async (req, res) => {
  try {
    const [accounts] = await db.query(
      `SELECT
         a.employee_id, a.username, a.last_login,
         u.email, u.full_name AS name,
         r.role_name
       FROM auth a
       INNER JOIN user u ON a.employee_id = u.user_id
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE a.auth_id = ?
       LIMIT 1`,
      [req.user.auth_id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: "Authenticated user not found." });
    }

    return res.status(200).json(accounts[0]);
  } catch (error) {
    logger.error(`[AUTH ERROR] /me failed: ${error.message}`);
    return res.status(500).json({ message: "Failed to fetch authenticated user.", error: error.message });
  }
};

module.exports = { signup, login, logout, me };
