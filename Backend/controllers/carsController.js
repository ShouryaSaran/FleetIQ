const db = require("../config/db");
const { insertRecord, updateRecord } = require("./sqlHelpers");

const getAllCars = async (req, res) => {
  try {
    const [cars] = await db.query("SELECT * FROM Cars");
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cars.", error: error.message });
  }
};

const getCarById = async (req, res) => {
  try {
    const [cars] = await db.query("SELECT * FROM Cars WHERE Car_ID = ?", [req.params.id]);

    if (cars.length === 0) {
      return res.status(404).json({ message: "Car not found." });
    }

    res.status(200).json(cars[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch car.", error: error.message });
  }
};

const addCar = async (req, res) => {
  try {
    const result = await insertRecord(db, "Cars", req.body);
    res.status(201).json({ message: "Car added successfully.", carId: result.insertId });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Failed to add car.",
      error: error.message,
    });
  }
};

const updateCar = async (req, res) => {
  try {
    const result = await updateRecord(db, "Cars", "Car_ID", req.params.id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Car not found." });
    }

    res.status(200).json({ message: "Car updated successfully." });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Failed to update car.",
      error: error.message,
    });
  }
};

const deleteCar = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM Cars WHERE Car_ID = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Car not found." });
    }

    res.status(200).json({ message: "Car deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete car.", error: error.message });
  }
};

module.exports = {
  getAllCars,
  getCarById,
  addCar,
  updateCar,
  deleteCar,
};
