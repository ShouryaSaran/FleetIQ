const db = require("../config/db");

const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM Users");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
};
