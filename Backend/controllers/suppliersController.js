const db = require("../config/db");

const getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await db.query("SELECT * FROM Supplier ORDER BY Supplier_ID");
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch suppliers.", error: error.message });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[supplier]] = await db.query(
      "SELECT * FROM Supplier WHERE Supplier_ID = ?",
      [id]
    );

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    const [cars] = await db.query(
      "SELECT * FROM Car WHERE Supplier_ID = ?",
      [id]
    );

    res.status(200).json({ ...supplier, cars });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch supplier.", error: error.message });
  }
};

const addSupplier = async (req, res) => {
  try {
    const { supplier_name, contact_person, phone } = req.body;

    if (!supplier_name?.trim()) {
      return res.status(400).json({ message: "supplier_name is required." });
    }
    if (!contact_person?.trim()) {
      return res.status(400).json({ message: "contact_person is required." });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ message: "phone is required." });
    }

    const { email, Location_ID } = req.body;

    const [result] = await db.query(
      "INSERT INTO Supplier (supplier_name, contact_person, email, phone, Location_ID) VALUES (?, ?, ?, ?, ?)",
      [supplier_name.trim(), contact_person.trim(), email?.trim() || null, phone.trim(), Location_ID || null]
    );

    const [[newSupplier]] = await db.query(
      "SELECT * FROM Supplier WHERE Supplier_ID = ?",
      [result.insertId]
    );

    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(500).json({ message: "Failed to add supplier.", error: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_name, contact_person, phone } = req.body;

    if (!supplier_name?.trim()) {
      return res.status(400).json({ message: "supplier_name is required." });
    }
    if (!contact_person?.trim()) {
      return res.status(400).json({ message: "contact_person is required." });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ message: "phone is required." });
    }

    const { email, Location_ID } = req.body;

    const [result] = await db.query(
      "UPDATE Supplier SET supplier_name = ?, contact_person = ?, email = ?, phone = ?, Location_ID = ? WHERE Supplier_ID = ?",
      [supplier_name.trim(), contact_person.trim(), email?.trim() || null, phone.trim(), Location_ID || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    res.status(200).json({ message: "Supplier updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to update supplier.", error: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const [[{ carCount }]] = await db.query(
      "SELECT COUNT(*) AS carCount FROM Car WHERE Supplier_ID = ?",
      [id]
    );

    if (carCount > 0) {
      return res.status(400).json({ message: "Cannot delete supplier with existing cars." });
    }

    const [result] = await db.query(
      "DELETE FROM Supplier WHERE Supplier_ID = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    res.status(200).json({ message: "Supplier deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete supplier.", error: error.message });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  addSupplier,
  updateSupplier,
  deleteSupplier,
};
