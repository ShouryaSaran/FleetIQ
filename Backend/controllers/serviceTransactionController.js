const db = require("../config/db");
const logger = require("../config/logger");

const getAllServiceRecords = async (req, res) => {
  try {
    const [records] = await db.query(`
      SELECT
        sr.service_id, sr.car_id, sr.customer_id, sr.center_id,
        sr.service_date, sr.total_cost,
        c.brand, c.model,
        cu.name AS customer_name,
        sc.center_name
      FROM service_record sr
      JOIN car c ON sr.car_id = c.car_id
      JOIN customer cu ON sr.customer_id = cu.customer_id
      JOIN service_center sc ON sr.center_id = sc.center_id
      ORDER BY sr.service_date DESC
    `);
    logger.info(`[SERVICE] Fetched ${records.length} service records`);
    res.status(200).json(records);
  } catch (error) {
    logger.error(`[SERVICE ERROR] Failed to fetch service records: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch service records.", error: error.message });
  }
};

const getServiceDetails = async (req, res) => {
  try {
    const [details] = await db.query(
      "SELECT * FROM service_details WHERE service_id = ?",
      [req.params.id]
    );
    logger.info(`[SERVICE] Fetched ${details.length} details for service_id=${req.params.id}`);
    res.status(200).json(details);
  } catch (error) {
    logger.error(`[SERVICE ERROR] Failed to fetch service details: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch service details.", error: error.message });
  }
};

const createService = async (req, res) => {
  const { car_id, customer_id, center_id, service_date, total_cost, details } = req.body;

  if (!car_id || !customer_id || !center_id || !service_date || !Array.isArray(details)) {
    return res.status(400).json({
      message: "car_id, customer_id, center_id, service_date, and details array are required.",
    });
  }

  logger.info(`[TRANSACTION] Service transaction started: car_id=${car_id} customer_id=${customer_id}`);

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [serviceResult] = await connection.query(
      "INSERT INTO service_record (car_id, customer_id, center_id, service_date, total_cost) VALUES (?, ?, ?, ?, ?)",
      [car_id, customer_id, center_id, service_date, total_cost || 0]
    );

    const serviceId = serviceResult.insertId;

    for (const detail of details) {
      const { description, parts_used, cost } = detail;
      if (cost === undefined) throw new Error("Each detail must include cost.");
      await connection.query(
        "INSERT INTO service_details (service_id, description, parts_used, cost) VALUES (?, ?, ?, ?)",
        [serviceId, description || null, parts_used || null, cost]
      );
    }

    await connection.commit();
    logger.info(`[TRANSACTION] Service transaction committed: service_id=${serviceId}`);

    res.status(201).json({
      message: "Service record created successfully.",
      serviceId,
      detailsCount: details.length,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error(`[TRANSACTION] Service transaction rolled back: ${error.message}`);
    res.status(500).json({ message: "Failed to create service record.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const deleteService = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query("DELETE FROM service_details WHERE service_id = ?", [req.params.id]);
    const [result] = await connection.query(
      "DELETE FROM service_record WHERE service_id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Service record not found." });
    }

    await connection.commit();
    logger.info(`[SERVICE] Service deleted: service_id=${req.params.id}`);
    res.status(200).json({ message: "Service record deleted successfully." });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error(`[SERVICE ERROR] Failed to delete service record: ${error.message}`);
    res.status(500).json({ message: "Failed to delete service record.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getAllServiceRecords, getServiceDetails, createService, deleteService };
