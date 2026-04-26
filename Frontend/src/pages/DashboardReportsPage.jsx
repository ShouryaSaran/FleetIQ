import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

const getValue = (item, keys, fallback = "") =>
  keys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null) ?? fallback;

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

function LoadingSpinner() {
  return (
    <div className="spinner-wrap">
      <span className="loading-spinner" aria-label="Loading"></span>
    </div>
  );
}

function ReportTable({ title, columns, rows, emptyMessage }) {
  return (
    <article className="panel report-table-panel">
      <div className="panel-title">
        <h3>{title}</h3>
      </div>
      <div className="table-panel embedded-table">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.label}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{emptyMessage}</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.label}>{column.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function DashboardReportsPage({ title = "Dashboard" }) {
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiFetch("/reports");

        if (!response.ok) {
          throw new Error("Unable to fetch reports.");
        }

        const data = await response.json();
        setReports(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const metrics = reports?.metrics || reports || {};
  const carsBySupplier = reports?.carsBySupplier || reports?.carsPerSupplier || [];
  const servicesByCenter = reports?.servicesByCenter || [];
  const topSalesByEmployee = reports?.topSalesByEmployee
    ? reports.topSalesByEmployee
    : reports?.topSaleByEmployee
      ? [reports.topSaleByEmployee]
      : [];
  const carsAboveAverage = reports?.carsAboveAverage || [];

  return (
    <section className="page-section reports-page">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>Inventory, sales, customer, and service performance from live reports.</p>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <div className="notice error">{error}</div>}

      {!isLoading && !error && reports && (
        <>
          <div className="stats-grid">
            <article className="stat-card">
              <span className="stat-icon blue"></span>
              <p>Total Cars</p>
              <strong>{formatNumber(getValue(metrics, ["totalCars"]))}</strong>
            </article>
            <article className="stat-card">
              <span className="stat-icon green"></span>
              <p>Total Sales</p>
              <strong>{formatCurrency(getValue(metrics, ["totalSalesAmount"]))}</strong>
            </article>
            <article className="stat-card">
              <span className="stat-icon indigo"></span>
              <p>Total Customers</p>
              <strong>{formatNumber(getValue(metrics, ["totalCustomers"]))}</strong>
            </article>
            <article className="stat-card">
              <span className="stat-icon gray"></span>
              <p>Service Records</p>
              <strong>{formatNumber(getValue(metrics, ["totalServiceRecords"]))}</strong>
            </article>
          </div>

          <div className="reports-layout">
            <ReportTable
              title="Cars by Supplier"
              columns={[
                {
                  label: "Supplier",
                  render: (row) => getValue(row, ["supplier_name", "Supplier_Name"], "-"),
                },
                {
                  label: "Count",
                  render: (row) => formatNumber(getValue(row, ["cars_count", "count"], 0)),
                },
              ]}
              rows={carsBySupplier}
              emptyMessage="No supplier data found."
            />

            <ReportTable
              title="Services by Center"
              columns={[
                {
                  label: "Center",
                  render: (row) => getValue(row, ["center_name", "service_center_name"], "-"),
                },
                {
                  label: "Count",
                  render: (row) => formatNumber(getValue(row, ["services_count", "count"], 0)),
                },
                {
                  label: "Total Cost",
                  render: (row) => formatCurrency(getValue(row, ["total_cost", "Total_Cost"], 0)),
                },
              ]}
              rows={servicesByCenter}
              emptyMessage="No service center data found."
            />

            <ReportTable
              title="Top Sales by Employee"
              columns={[
                {
                  label: "Employee",
                  render: (row) => getValue(row, ["employee_name", "Employee_Name"], "-"),
                },
                {
                  label: "Highest Sale",
                  render: (row) => formatCurrency(getValue(row, ["highest_sale", "sale_price"], 0)),
                },
              ]}
              rows={topSalesByEmployee}
              emptyMessage="No employee sales data found."
            />

            <article className="panel above-average-panel">
              <div className="panel-title">
                <h3>Cars Above Average Price</h3>
              </div>
              {carsAboveAverage.length === 0 ? (
                <div className="empty-state">No above-average cars found.</div>
              ) : (
                <div className="above-average-list">
                  {carsAboveAverage.map((car, index) => (
                    <div className="above-average-item" key={index}>
                      <div>
                        <strong>{getValue(car, ["model", "Model"], "-")}</strong>
                        <span>{getValue(car, ["brand", "Brand"], "-")}</span>
                      </div>
                      <b>{formatCurrency(getValue(car, ["price", "Price"], 0))}</b>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
}

export default DashboardReportsPage;
