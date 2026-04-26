const express = require("express");
const { getAllSales, createSale, deleteSale } = require("../controllers/salesController");

const router = express.Router();

router.get("/", getAllSales);
router.post("/", createSale);
router.delete("/:id", deleteSale);

module.exports = router;
