const db = require("../config/db");
const logger = require("../config/logger");

const getReports = async (req, res) => {
  try {
    const [[carStats]] = await db.query(
      "SELECT COUNT(*) AS totalCars, AVG(price) AS averageCarPrice FROM car"
    );
    const [[salesStats]] = await db.query(
      "SELECT COALESCE(SUM(sale_price), 0) AS totalSalesAmount FROM sales"
    );
    const [[customerStats]] = await db.query(
      "SELECT COUNT(*) AS totalCustomers FROM customer"
    );
    const [[serviceStats]] = await db.query(
      "SELECT COUNT(*) AS totalServiceRecords FROM service_record"
    );
    const [carsBySupplier] = await db.query(
      `SELECT s.supplier_name, COUNT(c.car_id) AS cars_count
       FROM supplier s
       LEFT JOIN car c ON s.supplier_id = c.supplier_id
       GROUP BY s.supplier_id, s.supplier_name
       ORDER BY cars_count DESC`
    );
    const [servicesByCenter] = await db.query(
      `SELECT sc.center_name, COUNT(sr.service_id) AS services_count,
              COALESCE(SUM(sr.total_cost), 0) AS total_cost
       FROM service_center sc
       LEFT JOIN service_record sr ON sc.center_id = sr.center_id
       GROUP BY sc.center_id, sc.center_name
       ORDER BY services_count DESC`
    );
    const [topSalesByEmployee] = await db.query(
      `SELECT u.full_name AS employee_name, MAX(s.sale_price) AS highest_sale
       FROM sales s
       JOIN user u ON s.user_id = u.user_id
       GROUP BY s.user_id, u.full_name
       ORDER BY highest_sale DESC
       LIMIT 10`
    );
    const [carsAboveAverage] = await db.query(
      `SELECT brand, model, price
       FROM car
       WHERE price > (SELECT AVG(price) FROM car)
       ORDER BY price DESC`
    );

    logger.info("[REPORTS] Reports generated successfully");

    res.status(200).json({
      metrics: {
        totalCars: carStats.totalCars,
        totalSalesAmount: salesStats.totalSalesAmount,
        totalCustomers: customerStats.totalCustomers,
        totalServiceRecords: serviceStats.totalServiceRecords,
        averageCarPrice: carStats.averageCarPrice,
      },
      carsBySupplier,
      servicesByCenter,
      topSalesByEmployee,
      carsAboveAverage,
    });
  } catch (error) {
    logger.error(`[REPORTS ERROR] Failed to generate reports: ${error.message}`);
    res.status(500).json({ message: "Failed to generate reports.", error: error.message });
  }
};

module.exports = { getReports };
