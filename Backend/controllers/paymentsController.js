const db = require("../config/db");
const logger = require("../config/logger");

const getAllPayments = async (req, res) => {
  try {
    const [payments] = await db.query(`
      SELECT p.*, s.sale_price, cu.name AS customer_name
      FROM payment p
      JOIN sales s ON p.sale_id = s.sale_id
      JOIN customer cu ON s.customer_id = cu.customer_id
      ORDER BY p.payment_date DESC, p.payment_id DESC
    `);
    logger.info(`[PAYMENTS] Fetched ${payments.length} payments`);
    res.status(200).json(payments);
  } catch (error) {
    logger.error(`[PAYMENTS ERROR] Failed to fetch payments: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch payments.", error: error.message });
  }
};

const createPayment = async (req, res) => {
  const { sale_id, payment_date, amount, payment_method, status } = req.body;

  if (!sale_id || !payment_date || amount === undefined || !payment_method || !status) {
    return res.status(400).json({
      message: "sale_id, payment_date, amount, payment_method, and status are required.",
    });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO payment (sale_id, payment_date, amount, payment_method, status) VALUES (?, ?, ?, ?, ?)",
      [sale_id, payment_date, amount, payment_method, status]
    );
    logger.info(`[PAYMENTS] Payment recorded: payment_id=${result.insertId}`);
    res.status(201).json({ message: "Payment recorded successfully.", paymentId: result.insertId });
  } catch (error) {
    logger.error(`[PAYMENTS ERROR] Failed to record payment: ${error.message}`);
    res.status(500).json({ message: "Failed to record payment.", error: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM payment WHERE payment_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Payment not found." });
    logger.info(`[PAYMENTS] Payment deleted: payment_id=${req.params.id}`);
    res.status(200).json({ message: "Payment deleted successfully." });
  } catch (error) {
    logger.error(`[PAYMENTS ERROR] Failed to delete payment: ${error.message}`);
    res.status(500).json({ message: "Failed to delete payment.", error: error.message });
  }
};

module.exports = { getAllPayments, createPayment, deletePayment };
