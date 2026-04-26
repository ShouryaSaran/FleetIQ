const express = require("express");
const {
  getAllServiceCenters,
  addServiceCenter,
} = require("../controllers/serviceCenterController");

const router = express.Router();

router.get("/", getAllServiceCenters);
router.post("/", addServiceCenter);

module.exports = router;
