import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CarInventoryPage from "./pages/CarInventoryPage";
import DashboardReportsPage from "./pages/DashboardReportsPage";
import PaymentsPage from "./pages/PaymentsPage";
import SalesPage from "./pages/SalesPage";
import ServiceRecordsPage from "./pages/ServiceRecordsPage";
import "./App.css";

function PageShell({ title, subtitle, children }) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Customers() {
  return (
    <PageShell title="Customers" subtitle="Manage customer profiles, leads, and ownership history.">
      <DataTable
        columns={["Customer", "Phone", "Lead Status", "Last Visit"]}
        rows={[
          ["Riya Mehta", "+91 98765 43210", "High Priority", "Today"],
          ["Arjun Singh", "+91 91234 56780", "Active", "2 days ago"],
          ["Neha Kapoor", "+91 99887 76655", "Follow Up", "Last week"],
        ]}
      />
    </PageShell>
  );
}

function DataTable({ columns, rows }) {
  return (
    <article className="panel table-panel">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardReportsPage title="Dashboard" />} />
          <Route path="/cars" element={<CarInventoryPage />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/service" element={<ServiceRecordsPage />} />
          <Route path="/reports" element={<DashboardReportsPage title="Reports" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
