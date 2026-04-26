const express = require("express");
const { getReports } = require("../controllers/reportsController");

const router = express.Router();

router.get("/", getReports);

module.exports = router;
