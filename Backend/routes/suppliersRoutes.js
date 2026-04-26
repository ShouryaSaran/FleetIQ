const express = require("express");
const {
  getAllSuppliers,
  getSupplierById,
  addSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/suppliersController");

const router = express.Router();

router.get("/", getAllSuppliers);
router.get("/:id", getSupplierById);
router.post("/", addSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

module.exports = router;
