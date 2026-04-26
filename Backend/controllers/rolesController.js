const db = require("../config/db");

const getRoles = async (req, res) => {
  try {
    const [roles] = await db.query(
      "SELECT Role_ID AS role_id, role_name FROM `Role` ORDER BY role_name"
    );
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch roles.", error: error.message });
  }
};

module.exports = { getRoles };
