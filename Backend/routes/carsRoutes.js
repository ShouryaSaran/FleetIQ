const express = require("express");
const {
  getAllCars,
  getCarById,
  addCar,
  updateCar,
  deleteCar,
} = require("../controllers/carsController");

const router = express.Router();

router.get("/", getAllCars);
router.get("/:id", getCarById);
router.post("/", addCar);
router.put("/:id", updateCar);
router.delete("/:id", deleteCar);

module.exports = router;
