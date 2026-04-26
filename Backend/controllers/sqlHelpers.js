const isValidColumnName = (column) => /^[A-Za-z0-9_]+$/.test(column);

const getBodyEntries = (body) => {
  const entries = Object.entries(body).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    const error = new Error("Request body must contain at least one field.");
    error.statusCode = 400;
    throw error;
  }

  const invalidColumn = entries.find(([column]) => !isValidColumnName(column));

  if (invalidColumn) {
    const error = new Error(`Invalid field name: ${invalidColumn[0]}`);
    error.statusCode = 400;
    throw error;
  }

  return entries;
};

const insertRecord = async (pool, tableName, body) => {
  const entries = getBodyEntries(body);
  const columns = entries.map(([column]) => `\`${column}\``).join(", ");
  const placeholders = entries.map(() => "?").join(", ");
  const values = entries.map(([, value]) => value);

  const [result] = await pool.query(
    `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
    values
  );

  return result;
};

const updateRecord = async (pool, tableName, primaryKey, id, body) => {
  const entries = getBodyEntries(body);
  const assignments = entries.map(([column]) => `\`${column}\` = ?`).join(", ");
  const values = entries.map(([, value]) => value);

  const [result] = await pool.query(
    `UPDATE ${tableName} SET ${assignments} WHERE ${primaryKey} = ?`,
    [...values, id]
  );

  return result;
};

module.exports = {
  insertRecord,
  updateRecord,
};
