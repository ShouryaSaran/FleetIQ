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

const getAllServiceRecords = async (req, res) => {
  try {
    const [serviceColumns, carColumns, centerColumns] = await Promise.all([
      getTableColumns("Service_Record"),
      getTableColumns("Cars"),
      getTableColumns("Service_Center"),
    ]);

    const serviceIdColumn = firstColumn(
      serviceColumns,
      ["service_record_id", "Service_Record_ID", "service_id", "Service_ID"],
      "sr"
    );
    const serviceCarIdColumn = firstColumn(serviceColumns, ["car_id", "Car_ID"], "sr");
    const serviceCenterIdColumn = firstColumn(
      serviceColumns,
      ["service_center_id", "Service_Center_ID", "center_id", "Center_ID"],
      "sr"
    );
    const serviceDateColumn = firstColumn(serviceColumns, ["service_date", "Service_Date"], "sr");
    const totalCostColumn = firstColumn(serviceColumns, ["total_cost", "Total_Cost"], "sr");
    const carIdColumn = firstColumn(carColumns, ["car_id", "Car_ID"], "c");
    const centerIdColumn = firstColumn(
      centerColumns,
      ["service_center_id", "Service_Center_ID", "center_id", "Center_ID"],
      "sc"
    );
    const carModelColumn = firstColumn(
      carColumns,
      ["model", "Model", "car_model", "Car_Model", "Car_Name", "name", "Name"],
      "c"
    );
    const centerNameColumn = firstColumn(
      centerColumns,
      ["service_center_name", "Service_Center_Name", "center_name", "Center_Name", "name", "Name"],
      "sc"
    );

    const [records] = await db.query(`
      SELECT
        ${serviceIdColumn} AS service_id,
        ${serviceCarIdColumn} AS car_id,
        ${carModelColumn} AS car_model,
        ${serviceCenterIdColumn} AS center_id,
        ${centerNameColumn} AS center_name,
        ${serviceDateColumn} AS service_date,
        ${totalCostColumn} AS total_cost
      FROM Service_Record sr
      LEFT JOIN Cars c ON ${serviceCarIdColumn} = ${carIdColumn}
      LEFT JOIN Service_Center sc ON ${serviceCenterIdColumn} = ${centerIdColumn}
      ORDER BY ${serviceDateColumn} DESC, ${serviceIdColumn} DESC
    `);

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service records.",
      error: error.message,
    });
  }
};

const getServiceDetails = async (req, res) => {
  try {
    const detailColumns = await getTableColumns("Service_Details");
    const serviceRecordIdColumn = detailColumns.find((column) =>
      ["service_record_id", "Service_Record_ID", "service_id", "Service_ID"].includes(column)
    );
    const partNameColumn = detailColumns.find((column) =>
      ["part_name", "Part_Name"].includes(column)
    );
    const costColumn = detailColumns.find((column) => ["cost", "Cost"].includes(column));
    const descriptionColumn = detailColumns.find((column) =>
      ["description", "Description"].includes(column)
    );

    if (!serviceRecordIdColumn) {
      return res.status(500).json({
        message: "Service_Details table must include a service record id column.",
      });
    }

    const [details] = await db.query(
      `
        SELECT
          ${partNameColumn ? `\`${partNameColumn}\`` : "NULL"} AS part_name,
          ${costColumn ? `\`${costColumn}\`` : "NULL"} AS cost,
          ${descriptionColumn ? `\`${descriptionColumn}\`` : "NULL"} AS description
        FROM Service_Details
        WHERE \`${serviceRecordIdColumn}\` = ?
      `,
      [req.params.id]
    );

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service details.",
      error: error.message,
    });
  }
};

const createService = async (req, res) => {
  const {
    car_id,
    center_id,
    service_center_id,
    employee_id,
    service_date,
    description,
    total_cost,
    details,
    parts,
  } = req.body;
  const selectedCenterId = service_center_id || center_id;
  const serviceParts = Array.isArray(parts) ? parts : details;

  if (!car_id || !selectedCenterId || !service_date || !Array.isArray(serviceParts)) {
    return res.status(400).json({
      message: "car_id, center_id, service_date, and parts array are required.",
    });
  }

  let connection;

  try {
    const detailColumns = await getTableColumns("Service_Details");
    const serviceRecordIdColumn =
      detailColumns.find((column) =>
        ["service_record_id", "Service_Record_ID", "service_id", "Service_ID"].includes(column)
      ) || "service_record_id";
    const partNameColumn =
      detailColumns.find((column) => ["part_name", "Part_Name"].includes(column)) || "part_name";
    const costColumn = detailColumns.find((column) => ["cost", "Cost"].includes(column)) || "cost";
    const quantityColumn = detailColumns.find((column) => ["quantity", "Quantity"].includes(column));
    const descriptionColumn = detailColumns.find((column) =>
      ["description", "Description"].includes(column)
    );

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [serviceResult] = await connection.query(
      `
        INSERT INTO Service_Record
          (car_id, service_center_id, employee_id, service_date, description, total_cost)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        car_id,
        selectedCenterId,
        employee_id || null,
        service_date,
        description || null,
        total_cost || 0,
      ]
    );

    const serviceRecordId = serviceResult.insertId;

    for (const detail of serviceParts) {
      const { part_name, quantity, cost, description: partDescription } = detail;

      if (!part_name || cost === undefined) {
        throw new Error("Each service part must include part_name and cost.");
      }

      const columns = [serviceRecordIdColumn, partNameColumn, costColumn];
      const values = [serviceRecordId, part_name, cost];

      if (quantityColumn) {
        columns.push(quantityColumn);
        values.push(quantity || 1);
      }

      if (descriptionColumn) {
        columns.push(descriptionColumn);
        values.push(partDescription || null);
      }

      await connection.query(
        `
          INSERT INTO Service_Details (${columns.map((column) => `\`${column}\``).join(", ")})
          VALUES (${columns.map(() => "?").join(", ")})
        `,
        values
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Service record created successfully.",
      serviceRecordId,
      detailsCount: serviceParts.length,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    res.status(500).json({
      message: "Failed to record service transaction.",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getAllServiceRecords,
  getServiceDetails,
  createService,
};
