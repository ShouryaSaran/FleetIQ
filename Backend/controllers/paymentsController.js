const db = require("../config/db");

const getAllPayments = async (req, res) => {
  try {
    const [payments] = await db.query(`
      SELECT
        p.payment_id,
        p.sale_id,
        p.amount,
        p.payment_method,
        p.payment_date,
        p.status,
        s.car_id,
        s.customer_id,
        s.sale_price
      FROM Payment p
      LEFT JOIN Sales s ON p.sale_id = s.sale_id
      ORDER BY p.payment_date DESC, p.payment_id DESC
    `);

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch payments.",
      error: error.message,
    });
  }
};

const createPayment = async (req, res) => {
  const { sale_id, amount, payment_method, payment_date, status } = req.body;

  if (!sale_id || amount === undefined || !payment_method || !payment_date || !status) {
    return res.status(400).json({
      message: "sale_id, amount, payment_method, payment_date, and status are required.",
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        INSERT INTO Payment (sale_id, amount, payment_method, payment_date, status)
        VALUES (?, ?, ?, ?, ?)
      `,
      [sale_id, amount, payment_method, payment_date, status]
    );

    await connection.commit();

    res.status(201).json({
      message: "Payment recorded successfully.",
      paymentId: result.insertId,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    res.status(500).json({
      message: "Failed to record payment.",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getAllPayments,
  createPayment,
};
