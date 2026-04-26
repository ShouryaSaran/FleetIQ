const express = require("express");
const {
  getAllServiceRecords,
  getServiceDetails,
  createService,
} = require("../controllers/serviceTransactionController");

const router = express.Router();

router.get("/", getAllServiceRecords);
router.get("/:id/details", getServiceDetails);
router.post("/", createService);

module.exports = router;
