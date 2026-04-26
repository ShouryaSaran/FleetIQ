const db = require("../config/db");
const logger = require("../config/logger");

const getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await db.query("SELECT * FROM supplier ORDER BY supplier_id");
    logger.info(`[SUPPLIERS] Fetched ${suppliers.length} suppliers`);
    res.status(200).json(suppliers);
  } catch (error) {
    logger.error(`[SUPPLIERS ERROR] Failed to fetch suppliers: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch suppliers.", error: error.message });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[supplier]] = await db.query("SELECT * FROM supplier WHERE supplier_id = ?", [id]);
    if (!supplier) return res.status(404).json({ message: "Supplier not found." });
    const [cars] = await db.query("SELECT * FROM car WHERE supplier_id = ?", [id]);
    res.status(200).json({ ...supplier, cars });
  } catch (error) {
    logger.error(`[SUPPLIERS ERROR] Failed to fetch supplier: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch supplier.", error: error.message });
  }
};

const addSupplier = async (req, res) => {
  try {
    const { supplier_name, contact_person, phone, email, location_id } = req.body;

    if (!supplier_name?.trim()) return res.status(400).json({ message: "supplier_name is required." });
    if (!contact_person?.trim()) return res.status(400).json({ message: "contact_person is required." });
    if (!phone?.trim()) return res.status(400).json({ message: "phone is required." });

    const [result] = await db.query(
      "INSERT INTO supplier (supplier_name, contact_person, phone, email, location_id) VALUES (?, ?, ?, ?, ?)",
      [supplier_name.trim(), contact_person.trim(), phone.trim(), email?.trim() || null, location_id || null]
    );
    const [[newSupplier]] = await db.query(
      "SELECT * FROM supplier WHERE supplier_id = ?", [result.insertId]
    );
    logger.info(`[SUPPLIERS] Supplier added: supplier_id=${result.insertId}`);
    res.status(201).json(newSupplier);
  } catch (error) {
    logger.error(`[SUPPLIERS ERROR] Failed to add supplier: ${error.message}`);
    res.status(500).json({ message: "Failed to add supplier.", error: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_name, contact_person, phone, email, location_id } = req.body;

    if (!supplier_name?.trim()) return res.status(400).json({ message: "supplier_name is required." });
    if (!contact_person?.trim()) return res.status(400).json({ message: "contact_person is required." });
    if (!phone?.trim()) return res.status(400).json({ message: "phone is required." });

    const [result] = await db.query(
      "UPDATE supplier SET supplier_name = ?, contact_person = ?, phone = ?, email = ?, location_id = ? WHERE supplier_id = ?",
      [supplier_name.trim(), contact_person.trim(), phone.trim(), email?.trim() || null, location_id || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Supplier not found." });
    logger.info(`[SUPPLIERS] Supplier updated: supplier_id=${id}`);
    res.status(200).json({ message: "Supplier updated successfully." });
  } catch (error) {
    logger.error(`[SUPPLIERS ERROR] Failed to update supplier: ${error.message}`);
    res.status(500).json({ message: "Failed to update supplier.", error: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const [[{ carCount }]] = await db.query(
      "SELECT COUNT(*) AS carCount FROM car WHERE supplier_id = ?", [id]
    );
    if (carCount > 0) {
      return res.status(400).json({ message: "Cannot delete supplier with existing cars." });
    }
    const [result] = await db.query("DELETE FROM supplier WHERE supplier_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Supplier not found." });
    logger.info(`[SUPPLIERS] Supplier deleted: supplier_id=${id}`);
    res.status(200).json({ message: "Supplier deleted successfully." });
  } catch (error) {
    logger.error(`[SUPPLIERS ERROR] Failed to delete supplier: ${error.message}`);
    res.status(500).json({ message: "Failed to delete supplier.", error: error.message });
  }
};

module.exports = { getAllSuppliers, getSupplierById, addSupplier, updateSupplier, deleteSupplier };
