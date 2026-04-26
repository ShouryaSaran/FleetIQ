const express = require("express");
const {
  getAllSuppliers,
  addSupplier,
} = require("../controllers/suppliersController");

const router = express.Router();

router.get("/", getAllSuppliers);
router.post("/", addSupplier);

module.exports = router;
