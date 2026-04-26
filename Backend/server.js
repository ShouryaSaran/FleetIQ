const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const carsRoutes = require("./routes/carsRoutes");
const customersRoutes = require("./routes/customersRoutes");
const suppliersRoutes = require("./routes/suppliersRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const serviceCenterRoutes = require("./routes/serviceCenterRoutes");
const salesRoutes = require("./routes/salesRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const usersRoutes = require("./routes/usersRoutes");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const managerOnly = roleMiddleware(["Manager"]);
const managerOrSalesExecutive = roleMiddleware(["Manager", "Sales Executive"]);

const writeAccessMiddleware = (req, res, next) => {
  if (req.method === "GET") {
    return next();
  }

  if (req.method === "DELETE") {
    return managerOnly(req, res, next);
  }

  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    return managerOrSalesExecutive(req, res, next);
  }

  return next();
};

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/cars", authMiddleware, writeAccessMiddleware, carsRoutes);
app.use("/api/customers", authMiddleware, writeAccessMiddleware, customersRoutes);
app.use("/api/suppliers", authMiddleware, writeAccessMiddleware, suppliersRoutes);
app.use("/api/inventory", authMiddleware, writeAccessMiddleware, inventoryRoutes);
app.use("/api/service-centers", authMiddleware, writeAccessMiddleware, serviceCenterRoutes);
app.use("/api/sales", authMiddleware, writeAccessMiddleware, salesRoutes);
app.use("/api/payments", authMiddleware, writeAccessMiddleware, paymentsRoutes);
app.use("/api/service", authMiddleware, writeAccessMiddleware, serviceRoutes);
app.use("/api/reports", authMiddleware, writeAccessMiddleware, reportsRoutes);
app.use("/api/users", authMiddleware, writeAccessMiddleware, usersRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Smart Vehicle Inventory Management System API is running",
  });
});

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
