const db = require("../config/db");

const getTableColumns = async (tableName) => {
  const [columns] = await db.query(
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

const columnExists = (columns, columnName) => columns.includes(columnName);

const buildCarNameExpression = (carColumns) => {
  if (columnExists(carColumns, "Car_Name")) {
    return "c.Car_Name";
  }

  if (columnExists(carColumns, "Name")) {
    return "c.Name";
  }

  if (columnExists(carColumns, "Make") && columnExists(carColumns, "Model")) {
    return "CONCAT_WS(' ', c.Make, c.Model)";
  }

  if (columnExists(carColumns, "Brand") && columnExists(carColumns, "Model")) {
    return "CONCAT_WS(' ', c.Brand, c.Model)";
  }

  return "CAST(c.Car_ID AS CHAR)";
};

const buildLocationNameExpression = (locationColumns) => {
  if (columnExists(locationColumns, "Location_Name")) {
    return "l.Location_Name";
  }

  if (columnExists(locationColumns, "Name")) {
    return "l.Name";
  }

  return "CAST(l.Location_ID AS CHAR)";
};

const getAllInventory = async (req, res) => {
  try {
    const [carColumns, locationColumns] = await Promise.all([
      getTableColumns("Cars"),
      getTableColumns("Location"),
    ]);
    const carNameExpression = buildCarNameExpression(carColumns);
    const locationNameExpression = buildLocationNameExpression(locationColumns);

    const [inventory] = await db.query(`
      SELECT
        i.*,
        ${locationNameExpression} AS Location_Name,
        ${carNameExpression} AS Car_Name
      FROM Inventory i
      LEFT JOIN Location l ON i.Location_ID = l.Location_ID
      LEFT JOIN Cars c ON i.Car_ID = c.Car_ID
    `);

    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory.", error: error.message });
  }
};

const updateInventoryQuantity = async (req, res) => {
  const { quantity, Quantity } = req.body;
  const newQuantity = quantity ?? Quantity;

  if (newQuantity === undefined) {
    return res.status(400).json({ message: "Quantity is required." });
  }

  try {
    const [result] = await db.query(
      "UPDATE Inventory SET Quantity = ? WHERE Inventory_ID = ?",
      [newQuantity, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inventory item not found." });
    }

    res.status(200).json({ message: "Inventory quantity updated successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update inventory quantity.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllInventory,
  updateInventoryQuantity,
};
