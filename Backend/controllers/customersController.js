const db = require("../config/db");
const { insertRecord, updateRecord } = require("./sqlHelpers");

const getAllCustomers = async (req, res) => {
  try {
    const [customers] = await db.query("SELECT * FROM Customers");
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers.", error: error.message });
  }
};

const addCustomer = async (req, res) => {
  try {
    const result = await insertRecord(db, "Customers", req.body);
    res.status(201).json({
      message: "Customer added successfully.",
      customerId: result.insertId,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Failed to add customer.",
      error: error.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const result = await updateRecord(db, "Customers", "Customer_ID", req.params.id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found." });
    }

    res.status(200).json({ message: "Customer updated successfully." });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Failed to update customer.",
      error: error.message,
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM Customers WHERE Customer_ID = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found." });
    }

    res.status(200).json({ message: "Customer deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete customer.", error: error.message });
  }
};

module.exports = {
  getAllCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
};
