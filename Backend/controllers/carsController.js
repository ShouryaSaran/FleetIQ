const db = require("../config/db");
const logger = require("../config/logger");
const { insertRecord, updateRecord } = require("./sqlHelpers");

const getAllCars = async (req, res) => {
  try {
    const [cars] = await db.query("SELECT * FROM car");
    logger.info(`[CARS] Fetched ${cars.length} cars`);
    res.status(200).json(cars);
  } catch (error) {
    logger.error(`[CARS ERROR] Failed to fetch cars: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch cars.", error: error.message });
  }
};

const getCarById = async (req, res) => {
  try {
    const [cars] = await db.query("SELECT * FROM car WHERE car_id = ?", [req.params.id]);
    if (cars.length === 0) return res.status(404).json({ message: "Car not found." });
    res.status(200).json(cars[0]);
  } catch (error) {
    logger.error(`[CARS ERROR] Failed to fetch car: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch car.", error: error.message });
  }
};

const addCar = async (req, res) => {
  try {
    const result = await insertRecord(db, "car", req.body);
    logger.info(`[CARS] Car added: car_id=${result.insertId}`);
    res.status(201).json({ message: "Car added successfully.", carId: result.insertId });
  } catch (error) {
    logger.error(`[CARS ERROR] Failed to add car: ${error.message}`);
    res.status(error.statusCode || 500).json({ message: "Failed to add car.", error: error.message });
  }
};

const updateCar = async (req, res) => {
  try {
    const result = await updateRecord(db, "car", "car_id", req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Car not found." });
    logger.info(`[CARS] Car updated: car_id=${req.params.id}`);
    res.status(200).json({ message: "Car updated successfully." });
  } catch (error) {
    logger.error(`[CARS ERROR] Failed to update car: ${error.message}`);
    res.status(error.statusCode || 500).json({ message: "Failed to update car.", error: error.message });
  }
};

const deleteCar = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM car WHERE car_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Car not found." });
    logger.info(`[CARS] Car deleted: car_id=${req.params.id}`);
    res.status(200).json({ message: "Car deleted successfully." });
  } catch (error) {
    logger.error(`[CARS ERROR] Failed to delete car: ${error.message}`);
    res.status(500).json({ message: "Failed to delete car.", error: error.message });
  }
};

module.exports = { getAllCars, getCarById, addCar, updateCar, deleteCar };
