const db = require("../config/db");
const logger = require("../config/logger");

const getAllSales = async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT s.sale_id, s.sale_date, s.sale_price,
             c.brand, c.model,
             cu.name AS customer_name,
             u.full_name AS employee_name
      FROM sales s
      JOIN car c ON s.car_id = c.car_id
      JOIN customer cu ON s.customer_id = cu.customer_id
      JOIN user u ON s.user_id = u.user_id
      ORDER BY s.sale_date DESC, s.sale_id DESC
    `);
    logger.info(`[SALES] Fetched ${sales.length} sales`);
    res.status(200).json(sales);
  } catch (error) {
    logger.error(`[SALES ERROR] Failed to fetch sales: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch sales.", error: error.message });
  }
};

const createSale = async (req, res) => {
  const { car_id, customer_id, user_id, sale_date, sale_price } = req.body;

  if (!car_id || !customer_id || !user_id || !sale_date || sale_price === undefined) {
    return res.status(400).json({
      message: "car_id, customer_id, user_id, sale_date, and sale_price are required.",
    });
  }

  logger.info(`[TRANSACTION] Sale transaction started: car_id=${car_id} customer_id=${customer_id}`);

  try {
    const [result] = await db.query(
      "INSERT INTO sales (car_id, customer_id, user_id, sale_date, sale_price) VALUES (?, ?, ?, ?, ?)",
      [car_id, customer_id, user_id, sale_date, sale_price]
    );
    logger.info(`[TRANSACTION] Sale transaction committed: sale_id=${result.insertId}`);
    res.status(201).json({ message: "Sale recorded successfully.", saleId: result.insertId });
  } catch (error) {
    logger.error(`[TRANSACTION] Sale transaction rolled back: ${error.message}`);
    res.status(500).json({ message: "Failed to record sale.", error: error.message });
  }
};

const deleteSale = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM sales WHERE sale_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Sale not found." });
    logger.info(`[SALES] Sale deleted: sale_id=${req.params.id}`);
    res.status(200).json({ message: "Sale deleted successfully." });
  } catch (error) {
    logger.error(`[SALES ERROR] Failed to delete sale: ${error.message}`);
    res.status(500).json({ message: "Failed to delete sale.", error: error.message });
  }
};

module.exports = { getAllSales, createSale, deleteSale };
