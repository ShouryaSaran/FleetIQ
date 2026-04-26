import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import logger from "../utils/logger";

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

function LoadingSpinner() {
  return (
    <div className="spinner-wrap">
      <span className="loading-spinner" aria-label="Loading"></span>
    </div>
  );
}

function StatCard({ label, value, colorClass }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${colorClass}`}></span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
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
              {columns.map((col) => (
                <th key={col.label}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{emptyMessage}</td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.label}>{col.render(row)}</td>
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

// ── Admin / Manager view ──────────────────────────────────────────────────────
function FullDashboard({ reports }) {
  const m = reports?.metrics || reports || {};
  const carsBySupplier   = reports?.carsBySupplier   || reports?.carsPerSupplier || [];
  const servicesByCenter = reports?.servicesByCenter || [];
  const topSalesByEmployee = reports?.topSalesByEmployee
    ? reports.topSalesByEmployee
    : reports?.topSaleByEmployee
      ? [reports.topSaleByEmployee]
      : [];
  const carsAboveAverage = reports?.carsAboveAverage || [];

  return (
    <>
      <div className="stats-grid">
        <StatCard label="Total Cars"       value={formatNumber(m.totalCars)}           colorClass="blue"   />
        <StatCard label="Total Sales"      value={formatCurrency(m.totalSalesAmount)}  colorClass="green"  />
        <StatCard label="Total Customers"  value={formatNumber(m.totalCustomers)}       colorClass="indigo" />
        <StatCard label="Service Records"  value={formatNumber(m.totalServiceRecords)}  colorClass="gray"   />
      </div>

      <div className="reports-layout">
        <ReportTable
          title="Cars by Supplier"
          columns={[
            { label: "Supplier", render: (r) => r.supplier_name ?? r.Supplier_Name ?? "-" },
            { label: "Count",    render: (r) => formatNumber(r.cars_count ?? r.count ?? 0) },
          ]}
          rows={carsBySupplier}
          emptyMessage="No supplier data found."
        />

        <ReportTable
          title="Services by Center"
          columns={[
            { label: "Center",     render: (r) => r.center_name ?? r.service_center_name ?? "-" },
            { label: "Count",      render: (r) => formatNumber(r.services_count ?? r.count ?? 0) },
            { label: "Total Cost", render: (r) => formatCurrency(r.total_cost ?? 0) },
          ]}
          rows={servicesByCenter}
          emptyMessage="No service center data found."
        />

        <ReportTable
          title="Top Sales by Employee"
          columns={[
            { label: "Employee",     render: (r) => r.employee_name ?? r.Employee_Name ?? "-" },
            { label: "Highest Sale", render: (r) => formatCurrency(r.highest_sale ?? r.sale_price ?? 0) },
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
              {carsAboveAverage.map((car, i) => (
                <div className="above-average-item" key={i}>
                  <div>
                    <strong>{car.model ?? car.Model ?? "-"}</strong>
                    <span>{car.brand ?? car.Brand ?? "-"}</span>
                  </div>
                  <b>{formatCurrency(car.price ?? car.Price ?? 0)}</b>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  );
}

// ── Sales Executive view ──────────────────────────────────────────────────────
function SalesExecutiveDashboard({ cars, customers, sales, payments }) {
  const totalSalesAmount = sales.reduce(
    (sum, s) => sum + Number(s.sale_price ?? s.Sale_Price ?? 0),
    0
  );

  return (
    <>
      <div className="stats-grid">
        <StatCard label="Total Cars"        value={formatNumber(cars.length)}       colorClass="blue"   />
        <StatCard label="Total Customers"   value={formatNumber(customers.length)}  colorClass="indigo" />
        <StatCard label="Total Sales"       value={formatNumber(sales.length)}      colorClass="green"  />
        <StatCard label="Sales Amount"      value={formatCurrency(totalSalesAmount)} colorClass="gray"  />
      </div>

      <div className="reports-layout">
        <ReportTable
          title="Recent Sales"
          columns={[
            { label: "Sale ID",    render: (r) => r.sale_id ?? "-" },
            { label: "Car",        render: (r) => r.model ? `${r.brand ?? ""} ${r.model}`.trim() : (r.car_id ?? "-") },
            { label: "Customer",   render: (r) => r.customer_name ?? "-" },
            { label: "Date",       render: (r) => formatDate(r.sale_date) },
            { label: "Sale Price", render: (r) => formatCurrency(r.sale_price) },
          ]}
          rows={sales.slice(0, 10)}
          emptyMessage="No sales found."
        />
      </div>
    </>
  );
}

// ── Mechanic view ─────────────────────────────────────────────────────────────
function MechanicDashboard({ cars, inventory, serviceRecords }) {
  const totalInventoryQty = inventory.reduce(
    (sum, i) => sum + Number(i.quantity ?? i.Quantity ?? 0),
    0
  );

  return (
    <>
      <div className="stats-grid">
        <StatCard label="Total Cars"       value={formatNumber(cars.length)}           colorClass="blue" />
        <StatCard label="Inventory Items"  value={formatNumber(totalInventoryQty)}     colorClass="indigo" />
        <StatCard label="Service Records"  value={formatNumber(serviceRecords.length)} colorClass="gray"  />
      </div>

      <div className="reports-layout">
        <ReportTable
          title="Recent Service Records"
          columns={[
            { label: "Service ID",  render: (r) => r.service_id ?? "-" },
            { label: "Car",         render: (r) => r.model ? `${r.brand ?? ""} ${r.model}`.trim() : (r.car_id ?? "-") },
            { label: "Center",      render: (r) => r.center_name ?? "-" },
            { label: "Date",        render: (r) => formatDate(r.service_date) },
            { label: "Total Cost",  render: (r) => formatCurrency(r.total_cost) },
          ]}
          rows={serviceRecords.slice(0, 10)}
          emptyMessage="No service records found."
        />
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function DashboardReportsPage({ title = "Dashboard" }) {
  const { user } = useAuth();
  const role = user?.role_name;

  const [data, setData]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    logger.nav(`Dashboard mounted: role=${role}`);
    return () => logger.nav("Dashboard unmounted");
  }, []);

  useEffect(() => {
    if (!role) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      setData(null);

      try {
        if (role === "Admin" || role === "Manager") {
          logger.api("Dashboard fetching: /api/reports");
          const res = await apiFetch("/reports");
          if (!res.ok) throw new Error("Unable to fetch reports.");
          const reports = await res.json();
          logger.api("Dashboard reports loaded");
          setData({ type: "full", reports });

        } else if (role === "Sales Executive") {
          logger.api("Dashboard skipping /api/reports (insufficient role: Sales Executive)");
          logger.api("Dashboard fetching: /api/cars, /api/customers, /api/sales, /api/payments");
          const [carsRes, custRes, salesRes, payRes] = await Promise.all([
            apiFetch("/cars"),
            apiFetch("/customers"),
            apiFetch("/sales"),
            apiFetch("/payments"),
          ]);
          const [cars, customers, sales, payments] = await Promise.all([
            carsRes.ok  ? carsRes.json()  : Promise.resolve([]),
            custRes.ok  ? custRes.json()  : Promise.resolve([]),
            salesRes.ok ? salesRes.json() : Promise.resolve([]),
            payRes.ok   ? payRes.json()   : Promise.resolve([]),
          ]);
          setData({
            type: "sales-executive",
            cars:      Array.isArray(cars)      ? cars      : [],
            customers: Array.isArray(customers) ? customers : [],
            sales:     Array.isArray(sales)     ? sales     : [],
            payments:  Array.isArray(payments)  ? payments  : [],
          });

        } else if (role === "Mechanic") {
          logger.api("Dashboard skipping /api/reports (insufficient role: Mechanic)");
          logger.api("Dashboard fetching: /api/cars, /api/inventory, /api/service");
          const [carsRes, invRes, svcRes] = await Promise.all([
            apiFetch("/cars"),
            apiFetch("/inventory"),
            apiFetch("/service"),
          ]);
          const [cars, inventory, serviceRecords] = await Promise.all([
            carsRes.ok ? carsRes.json() : Promise.resolve([]),
            invRes.ok  ? invRes.json()  : Promise.resolve([]),
            svcRes.ok  ? svcRes.json()  : Promise.resolve([]),
          ]);
          setData({
            type: "mechanic",
            cars:           Array.isArray(cars)           ? cars           : [],
            inventory:      Array.isArray(inventory)      ? inventory      : [],
            serviceRecords: Array.isArray(serviceRecords) ? serviceRecords : [],
          });
        }
      } catch (err) {
        logger.error(`Dashboard fetch error: ${err.message}`);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [role]);

  return (
    <section className="page-section reports-page">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>Live metrics and recent activity for your role.</p>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <div className="notice error">{error}</div>}

      {!isLoading && !error && data && (
        <>
          {data.type === "full" && <FullDashboard reports={data.reports} />}
          {data.type === "sales-executive" && (
            <SalesExecutiveDashboard
              cars={data.cars}
              customers={data.customers}
              sales={data.sales}
              payments={data.payments}
            />
          )}
          {data.type === "mechanic" && (
            <MechanicDashboard
              cars={data.cars}
              inventory={data.inventory}
              serviceRecords={data.serviceRecords}
            />
          )}
        </>
      )}
    </section>
  );
}

export default DashboardReportsPage;
