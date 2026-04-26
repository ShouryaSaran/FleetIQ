const express = require("express");
const {
  getAllServiceRecords,
  getServiceDetails,
  createService,
  deleteService,
} = require("../controllers/serviceTransactionController");

const router = express.Router();

router.get("/", getAllServiceRecords);
router.get("/:id/details", getServiceDetails);
router.post("/", createService);
router.delete("/:id", deleteService);

module.exports = router;
