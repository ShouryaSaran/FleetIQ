const express = require("express");
const { getAllPayments, createPayment, deletePayment } = require("../controllers/paymentsController");

const router = express.Router();

router.get("/", getAllPayments);
router.post("/", createPayment);
router.delete("/:id", deletePayment);

module.exports = router;
