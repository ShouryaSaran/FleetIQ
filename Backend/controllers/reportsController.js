const db = require("../config/db");

const getTableColumns = async (tableName) => {
  const [columns] = await db.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [tableName]
  );

  return columns.map((column) => column.COLUMN_NAME);
};

const firstColumn = (columns, columnNames, alias) => {
  const columnName = columnNames.find((name) => columns.includes(name));
  return columnName ? `${alias}.\`${columnName}\`` : "NULL";
};

const getReports = async (req, res) => {
  try {
    const [
      carColumns,
      supplierColumns,
      salesColumns,
      customerColumns,
      serviceColumns,
      centerColumns,
      userColumns,
    ] = await Promise.all([
      getTableColumns("Cars"),
      getTableColumns("Suppliers"),
      getTableColumns("Sales"),
      getTableColumns("Customers"),
      getTableColumns("Service_Record"),
      getTableColumns("Service_Center"),
      getTableColumns("Users"),
    ]);

    const carId = firstColumn(carColumns, ["car_id", "Car_ID"], "c");
    const carSupplierId = firstColumn(carColumns, ["supplier_id", "Supplier_ID"], "c");
    const carModel = firstColumn(
      carColumns,
      ["model", "Model", "car_model", "Car_Model", "Car_Name", "name", "Name"],
      "c"
    );
    const carBrand = firstColumn(carColumns, ["brand", "Brand", "make", "Make"], "c");
    const carPrice = firstColumn(carColumns, ["price", "Price"], "c");
    const supplierId = firstColumn(supplierColumns, ["supplier_id", "Supplier_ID"], "s");
    const supplierName = firstColumn(
      supplierColumns,
      ["supplier_name", "Supplier_Name", "name", "Name"],
      "s"
    );
    const saleEmployeeId = firstColumn(salesColumns, ["employee_id", "Employee_ID"], "sa");
    const salePrice = firstColumn(salesColumns, ["sale_price", "Sale_Price"], "sa");
    const serviceId = firstColumn(
      serviceColumns,
      ["service_record_id", "Service_Record_ID", "service_id", "Service_ID"],
      "sr"
    );
    const serviceCenterId = firstColumn(
      serviceColumns,
      ["service_center_id", "Service_Center_ID", "center_id", "Center_ID"],
      "sr"
    );
    const serviceCost = firstColumn(serviceColumns, ["total_cost", "Total_Cost"], "sr");
    const centerId = firstColumn(
      centerColumns,
      ["service_center_id", "Service_Center_ID", "center_id", "Center_ID"],
      "sc"
    );
    const centerName = firstColumn(
      centerColumns,
      ["service_center_name", "Service_Center_Name", "center_name", "Center_Name", "name", "Name"],
      "sc"
    );
    const userId = firstColumn(userColumns, ["employee_id", "Employee_ID", "user_id", "User_ID"], "u");
    const employeeName = firstColumn(
      userColumns,
      ["employee_name", "Employee_Name", "user_name", "User_Name", "name", "Name", "full_name", "Full_Name"],
      "u"
    );

    const [
      [carStats],
      [salesStats],
      [customerStats],
      [serviceStats],
      [carsBySupplier],
      [servicesByCenter],
      [topSalesByEmployee],
      [carsAboveAverage],
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) AS totalCars, AVG(${carPrice}) AS averageCarPrice FROM Cars c`),
      db.query(`SELECT COALESCE(SUM(${salePrice}), 0) AS totalSalesAmount FROM Sales sa`),
      db.query("SELECT COUNT(*) AS totalCustomers FROM Customers"),
      db.query(`SELECT COUNT(${serviceId}) AS totalServiceRecords FROM Service_Record sr`),
      db.query(`
        SELECT
          ${supplierName} AS supplier_name,
          COUNT(${carId}) AS cars_count
        FROM Suppliers s
        LEFT JOIN Cars c ON ${supplierId} = ${carSupplierId}
        GROUP BY ${supplierId}, ${supplierName}
        ORDER BY cars_count DESC
      `),
      db.query(`
        SELECT
          ${centerName} AS center_name,
          COUNT(${serviceId}) AS services_count,
          COALESCE(SUM(${serviceCost}), 0) AS total_cost
        FROM Service_Center sc
        LEFT JOIN Service_Record sr ON ${centerId} = ${serviceCenterId}
        GROUP BY ${centerId}, ${centerName}
        ORDER BY services_count DESC
      `),
      db.query(`
        SELECT
          ${employeeName} AS employee_name,
          MAX(${salePrice}) AS highest_sale
        FROM Sales sa
        LEFT JOIN Users u ON ${saleEmployeeId} = ${userId}
        GROUP BY ${saleEmployeeId}, ${employeeName}
        ORDER BY highest_sale DESC
        LIMIT 10
      `),
      db.query(`
        SELECT
          ${carModel} AS model,
          ${carBrand} AS brand,
          ${carPrice} AS price
        FROM Cars c
        WHERE ${carPrice} > (SELECT AVG(${carPrice}) FROM Cars c)
        ORDER BY ${carPrice} DESC
      `),
    ]);

    res.status(200).json({
      metrics: {
        totalCars: carStats[0].totalCars,
        totalSalesAmount: salesStats[0].totalSalesAmount,
        totalCustomers: customerStats[0].totalCustomers,
        totalServiceRecords: serviceStats[0].totalServiceRecords,
        averageCarPrice: carStats[0].averageCarPrice,
      },
      totalCars: carStats[0].totalCars,
      totalSalesAmount: salesStats[0].totalSalesAmount,
      totalCustomers: customerStats[0].totalCustomers,
      totalServiceRecords: serviceStats[0].totalServiceRecords,
      averageCarPrice: carStats[0].averageCarPrice,
      carsBySupplier,
      carsPerSupplier: carsBySupplier,
      servicesByCenter,
      topSalesByEmployee,
      topSaleByEmployee: topSalesByEmployee[0] || null,
      carsAboveAverage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate reports.",
      error: error.message,
    });
  }
};

module.exports = {
  getReports,
};
