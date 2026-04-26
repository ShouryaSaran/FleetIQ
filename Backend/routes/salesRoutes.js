const express = require("express");
const { getAllSales, createSale } = require("../controllers/salesController");

const router = express.Router();

router.get("/", getAllSales);
router.post("/", createSale);

module.exports = router;
