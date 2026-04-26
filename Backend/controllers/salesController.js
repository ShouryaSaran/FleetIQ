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

const hasColumn = (columns, columnName) => columns.includes(columnName);

const firstColumn = (columns, columnNames, alias) => {
  const columnName = columnNames.find((name) => hasColumn(columns, name));
  return columnName ? `${alias}.\`${columnName}\`` : "NULL";
};

const getAllSales = async (req, res) => {
  try {
    const [salesColumns, carColumns, customerColumns, userColumns] = await Promise.all([
      getTableColumns("Sales"),
      getTableColumns("Cars"),
      getTableColumns("Customers"),
      getTableColumns("Users"),
    ]);

    const saleIdColumn = firstColumn(salesColumns, ["sale_id", "Sale_ID"], "s");
    const saleCarIdColumn = firstColumn(salesColumns, ["car_id", "Car_ID"], "s");
    const saleCustomerIdColumn = firstColumn(salesColumns, ["customer_id", "Customer_ID"], "s");
    const saleEmployeeIdColumn = firstColumn(salesColumns, ["employee_id", "Employee_ID"], "s");
    const saleDateColumn = firstColumn(salesColumns, ["sale_date", "Sale_Date"], "s");
    const salePriceColumn = firstColumn(salesColumns, ["sale_price", "Sale_Price"], "s");
    const carIdColumn = firstColumn(carColumns, ["car_id", "Car_ID"], "c");
    const customerIdColumn = firstColumn(customerColumns, ["customer_id", "Customer_ID"], "cu");
    const userIdColumn = firstColumn(userColumns, ["employee_id", "Employee_ID", "user_id", "User_ID"], "u");
    const carModelColumn = firstColumn(
      carColumns,
      ["model", "Model", "car_model", "Car_Model", "Car_Name", "name", "Name"],
      "c"
    );
    const customerNameColumn = firstColumn(
      customerColumns,
      ["customer_name", "Customer_Name", "name", "Name", "full_name", "Full_Name"],
      "cu"
    );
    const employeeNameColumn = firstColumn(
      userColumns,
      ["employee_name", "Employee_Name", "user_name", "User_Name", "name", "Name", "full_name", "Full_Name"],
      "u"
    );

    const [sales] = await db.query(`
      SELECT
        ${saleIdColumn} AS sale_id,
        ${saleCarIdColumn} AS car_id,
        ${carModelColumn} AS car_model,
        ${saleCustomerIdColumn} AS customer_id,
        ${customerNameColumn} AS customer_name,
        ${saleEmployeeIdColumn} AS employee_id,
        ${employeeNameColumn} AS employee_name,
        ${saleDateColumn} AS sale_date,
        ${salePriceColumn} AS sale_price
      FROM Sales s
      LEFT JOIN Cars c ON ${saleCarIdColumn} = ${carIdColumn}
      LEFT JOIN Customers cu ON ${saleCustomerIdColumn} = ${customerIdColumn}
      LEFT JOIN Users u ON ${saleEmployeeIdColumn} = ${userIdColumn}
      ORDER BY ${saleDateColumn} DESC, ${saleIdColumn} DESC
    `);

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch sales.",
      error: error.message,
    });
  }
};

const createSale = async (req, res) => {
  const { car_id, customer_id, employee_id, sale_date, sale_price } = req.body;

  if (!car_id || !customer_id || !employee_id || !sale_date || sale_price === undefined) {
    return res.status(400).json({
      message: "car_id, customer_id, employee_id, sale_date, and sale_price are required.",
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        INSERT INTO Sales (car_id, customer_id, employee_id, sale_date, sale_price)
        VALUES (?, ?, ?, ?, ?)
      `,
      [car_id, customer_id, employee_id, sale_date, sale_price]
    );

    await connection.commit();

    res.status(201).json({
      message: "Vehicle sale completed successfully.",
      saleId: result.insertId,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    res.status(500).json({
      message: "Failed to complete vehicle sale transaction.",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getAllSales,
  createSale,
};
