const db = require("../config/db");
const logger = require("../config/logger");

const getAllInventory = async (req, res) => {
  try {
    const [inventory] = await db.query(`
      SELECT
        i.inventory_id, i.car_id, i.location_id, i.quantity, i.last_updated,
        CONCAT_WS(' ', c.brand, c.model) AS Car_Name,
        CONCAT_WS(', ', l.city, l.state) AS Location_Name
      FROM inventory i
      LEFT JOIN car c ON i.car_id = c.car_id
      LEFT JOIN location l ON i.location_id = l.location_id
    `);
    logger.info(`[INVENTORY] Fetched ${inventory.length} inventory records`);
    res.status(200).json(inventory);
  } catch (error) {
    logger.error(`[INVENTORY ERROR] Failed to fetch inventory: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch inventory.", error: error.message });
  }
};

const updateInventoryQuantity = async (req, res) => {
  const { quantity } = req.body;

  if (quantity === undefined) {
    return res.status(400).json({ message: "Quantity is required." });
  }

  try {
    const [result] = await db.query(
      "UPDATE inventory SET quantity = ?, last_updated = NOW() WHERE inventory_id = ?",
      [quantity, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inventory item not found." });
    }

    logger.info(`[INVENTORY] Inventory updated: inventory_id=${req.params.id} quantity=${quantity}`);
    res.status(200).json({ message: "Inventory quantity updated successfully." });
  } catch (error) {
    logger.error(`[INVENTORY ERROR] Failed to update inventory: ${error.message}`);
    res.status(500).json({ message: "Failed to update inventory quantity.", error: error.message });
  }
};

module.exports = { getAllInventory, updateInventoryQuantity };
