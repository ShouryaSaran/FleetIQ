const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const db = require("../config/db");
const { JWT_SECRET, JWT_EXPIRES_IN, SALT_ROUNDS } = require("../config/auth");

const USER_TABLE = "`User`";
const ROLE_TABLE = "`Role`";

const getTableColumns = async (connection, tableName) => {
  const [columns] = await connection.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [tableName]
  );

  return columns.map((column) => column.COLUMN_NAME);
};

const hasColumn = (columns, columnName) => columns.includes(columnName);

const firstExistingColumn = (columns, names) => names.find((name) => hasColumn(columns, name));

const buildUserRoleQueryParts = async (connection) => {
  const [userColumns, roleColumns] = await Promise.all([
    getTableColumns(connection, "User"),
    getTableColumns(connection, "Role"),
  ]);

  const userIdColumn = firstExistingColumn(userColumns, ["User_ID", "employee_id", "user_id"]);
  const userRoleIdColumn = firstExistingColumn(userColumns, ["role_id", "Role_ID"]);
  const roleIdColumn = firstExistingColumn(roleColumns, ["role_id", "Role_ID"]);
  const emailColumn = firstExistingColumn(userColumns, ["email", "Email"]);
  const roleNameColumn = firstExistingColumn(roleColumns, [
    "role_name",
    "Role_Name",
    "name",
    "Name",
  ]);

  let nameExpression = "NULL";

  if (hasColumn(userColumns, "name")) {
    nameExpression = "u.`name`";
  } else if (hasColumn(userColumns, "Name")) {
    nameExpression = "u.`Name`";
  } else if (hasColumn(userColumns, "first_name") || hasColumn(userColumns, "last_name")) {
    const firstName = hasColumn(userColumns, "first_name") ? "u.`first_name`" : "''";
    const lastName = hasColumn(userColumns, "last_name") ? "u.`last_name`" : "''";
    nameExpression = `TRIM(CONCAT_WS(' ', ${firstName}, ${lastName}))`;
  }

  return {
    userIdExpression: userIdColumn ? `u.\`${userIdColumn}\`` : "NULL",
    userRoleIdExpression: userRoleIdColumn ? `u.\`${userRoleIdColumn}\`` : "NULL",
    roleJoinCondition:
      roleIdColumn && userRoleIdColumn
        ? `u.\`${userRoleIdColumn}\` = r.\`${roleIdColumn}\``
        : "1 = 0",
    emailExpression: emailColumn ? `u.\`${emailColumn}\`` : "NULL",
    nameExpression,
    roleNameExpression: roleNameColumn ? `r.\`${roleNameColumn}\`` : "NULL",
  };
};

const splitName = (name) => {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift();
  const lastName = parts.length > 0 ? parts.join(" ") : "";

  return { firstName, lastName };
};

const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
};

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      message: "Validation failed.",
      errors: errors.array(),
    });
    return true;
  }

  return false;
};

const signup = async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const { name, email, username, password, role_id } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existingAccounts] = await connection.query(
      `
        SELECT a.auth_id
        FROM Auth a
        WHERE a.username = ?
        UNION
        SELECT NULL AS auth_id
        FROM ${USER_TABLE} u
        WHERE u.email = ?
        LIMIT 1
      `,
      [normalizedUsername, normalizedEmail]
    );

    if (existingAccounts.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "Username or email already exists." });
    }

    const userColumns = await getTableColumns(connection, "User");
    const { firstName, lastName } = splitName(name);
    const userData = {};

    if (hasColumn(userColumns, "name")) {
      userData.name = name.trim();
    }

    if (hasColumn(userColumns, "Name")) {
      userData.Name = name.trim();
    }

    if (hasColumn(userColumns, "first_name")) {
      userData.first_name = firstName;
    }

    if (hasColumn(userColumns, "last_name")) {
      userData.last_name = lastName;
    }

    if (hasColumn(userColumns, "email")) {
      userData.email = normalizedEmail;
    }

    if (hasColumn(userColumns, "role_id")) {
      userData.role_id = role_id;
    } else if (hasColumn(userColumns, "Role_ID")) {
      userData.Role_ID = role_id;
    }

    if (hasColumn(userColumns, "username")) {
      userData.username = normalizedUsername;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    if (hasColumn(userColumns, "password_hash")) {
      userData.password_hash = passwordHash;
    }

    const columns = Object.keys(userData);
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((column) => userData[column]);

    const [userResult] = await connection.query(
      `
        INSERT INTO ${USER_TABLE} (${columns.map((column) => `\`${column}\``).join(", ")})
        VALUES (${placeholders})
      `,
      values
    );

    const employeeId = userResult.insertId;

    await connection.query(
      `
        INSERT INTO Auth (employee_id, username, password_hash)
        VALUES (?, ?, ?)
      `,
      [employeeId, normalizedUsername, passwordHash]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Signup successful.",
      employee_id: employeeId,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    return res.status(500).json({
      message: "Failed to create account.",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const login = async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const { username, password } = req.body;
  const normalizedUsername = username.trim();
  let connection;

  try {
    connection = await db.getConnection();
    const queryParts = await buildUserRoleQueryParts(connection);

    const [accounts] = await connection.query(
      `
        SELECT
          a.auth_id,
          a.employee_id,
          a.username,
          a.password_hash,
          a.last_login,
          a.is_active,
          ${queryParts.emailExpression} AS email,
          ${queryParts.nameExpression} AS name,
          ${queryParts.userRoleIdExpression} AS role_id,
          ${queryParts.roleNameExpression} AS role_name
        FROM Auth a
        INNER JOIN ${USER_TABLE} u ON a.employee_id = ${queryParts.userIdExpression}
        LEFT JOIN ${ROLE_TABLE} r ON ${queryParts.roleJoinCondition}
        WHERE a.username = ?
        LIMIT 1
      `,
      [normalizedUsername]
    );

    if (accounts.length === 0) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const account = accounts[0];

    if (!account.is_active) {
      return res.status(403).json({ message: "Account is disabled." });
    }

    const passwordMatches = await bcrypt.compare(password, account.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    await connection.query("UPDATE Auth SET last_login = NOW() WHERE auth_id = ?", [
      account.auth_id,
    ]);

    await connection.query(
      `
        INSERT INTO Login_Log (auth_id, login_time, ip_address, status)
        VALUES (?, NOW(), ?, 'success')
      `,
      [account.auth_id, getRequestIp(req)]
    );

    const tokenPayload = {
      auth_id: account.auth_id,
      employee_id: account.employee_id,
      username: account.username,
      role_id: account.role_id,
      role_name: account.role_name,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(200).json({
      token,
      employee_id: account.employee_id,
      username: account.username,
      role_name: account.role_name,
      name: account.name,
      email: account.email,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to log in.",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const logout = async (req, res) => {
  const { auth_id } = req.body;

  if (!auth_id) {
    return res.status(400).json({ message: "auth_id is required." });
  }

  try {
    await db.query(
      `
        INSERT INTO Login_Log (auth_id, login_time, ip_address, status)
        VALUES (?, NOW(), ?, 'logout')
      `,
      [auth_id, getRequestIp(req)]
    );

    return res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to log out.",
      error: error.message,
    });
  }
};

const me = async (req, res) => {
  try {
    const queryParts = await buildUserRoleQueryParts(db);
    const [accounts] = await db.query(
      `
        SELECT
          a.employee_id,
          a.username,
          a.last_login,
          ${queryParts.emailExpression} AS email,
          ${queryParts.nameExpression} AS name,
          ${queryParts.roleNameExpression} AS role_name
        FROM Auth a
        INNER JOIN ${USER_TABLE} u ON a.employee_id = ${queryParts.userIdExpression}
        LEFT JOIN ${ROLE_TABLE} r ON ${queryParts.roleJoinCondition}
        WHERE a.auth_id = ?
        LIMIT 1
      `,
      [req.user.auth_id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: "Authenticated user not found." });
    }

    return res.status(200).json(accounts[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch authenticated user.",
      error: error.message,
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  me,
};
