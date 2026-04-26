const db = require("../config/db");
const { insertRecord } = require("./sqlHelpers");

const getAllServiceCenters = async (req, res) => {
  try {
    const [serviceCenters] = await db.query("SELECT * FROM Service_Center");
    res.status(200).json(serviceCenters);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service centers.",
      error: error.message,
    });
  }
};

const addServiceCenter = async (req, res) => {
  try {
    const result = await insertRecord(db, "Service_Center", req.body);
    res.status(201).json({
      message: "Service center added successfully.",
      serviceCenterId: result.insertId,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Failed to add service center.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllServiceCenters,
  addServiceCenter,
};
