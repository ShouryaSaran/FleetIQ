const db = require("../config/db");
const logger = require("../config/logger");
const { insertRecord, updateRecord } = require("./sqlHelpers");

const getAllCustomers = async (req, res) => {
  try {
    const [customers] = await db.query("SELECT * FROM customer");
    logger.info(`[CUSTOMERS] Fetched ${customers.length} customers`);
    res.status(200).json(customers);
  } catch (error) {
    logger.error(`[CUSTOMERS ERROR] Failed to fetch customers: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch customers.", error: error.message });
  }
};

const addCustomer = async (req, res) => {
  try {
    const result = await insertRecord(db, "customer", req.body);
    logger.info(`[CUSTOMERS] Customer added: customer_id=${result.insertId}`);
    res.status(201).json({ message: "Customer added successfully.", customerId: result.insertId });
  } catch (error) {
    logger.error(`[CUSTOMERS ERROR] Failed to add customer: ${error.message}`);
    res.status(error.statusCode || 500).json({ message: "Failed to add customer.", error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const result = await updateRecord(db, "customer", "customer_id", req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Customer not found." });
    logger.info(`[CUSTOMERS] Customer updated: customer_id=${req.params.id}`);
    res.status(200).json({ message: "Customer updated successfully." });
  } catch (error) {
    logger.error(`[CUSTOMERS ERROR] Failed to update customer: ${error.message}`);
    res.status(error.statusCode || 500).json({ message: "Failed to update customer.", error: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM customer WHERE customer_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Customer not found." });
    logger.info(`[CUSTOMERS] Customer deleted: customer_id=${req.params.id}`);
    res.status(200).json({ message: "Customer deleted successfully." });
  } catch (error) {
    logger.error(`[CUSTOMERS ERROR] Failed to delete customer: ${error.message}`);
    res.status(500).json({ message: "Failed to delete customer.", error: error.message });
  }
};

module.exports = { getAllCustomers, addCustomer, updateCustomer, deleteCustomer };
