const db = require("../config/db");
const { insertRecord } = require("./sqlHelpers");

const getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await db.query("SELECT * FROM Suppliers");
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch suppliers.", error: error.message });
  }
};

const addSupplier = async (req, res) => {
  try {
    const result = await insertRecord(db, "Suppliers", req.body);
    res.status(201).json({
      message: "Supplier added successfully.",
      supplierId: result.insertId,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Failed to add supplier.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllSuppliers,
  addSupplier,
};
