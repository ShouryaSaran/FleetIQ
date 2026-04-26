const express = require("express");
const { getAllPayments, createPayment } = require("../controllers/paymentsController");

const router = express.Router();

router.get("/", getAllPayments);
router.post("/", createPayment);

module.exports = router;
