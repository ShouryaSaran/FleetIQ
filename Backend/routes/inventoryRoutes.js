const express = require("express");
const {
  getAllInventory,
  updateInventoryQuantity,
} = require("../controllers/inventoryController");

const router = express.Router();

router.get("/", getAllInventory);
router.put("/:id", updateInventoryQuantity);

module.exports = router;
