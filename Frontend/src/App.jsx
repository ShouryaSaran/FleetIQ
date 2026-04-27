import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CarInventoryPage from "./pages/CarInventoryPage";
import DashboardReportsPage from "./pages/DashboardReportsPage";
import PaymentsPage from "./pages/PaymentsPage";
import SalesPage from "./pages/SalesPage";
import ServiceRecordsPage from "./pages/ServiceRecordsPage";
import SuppliersPage from "./pages/Suppliers";
import InventoryPage from "./pages/InventoryPage";
import ServiceCentersPage from "./pages/ServiceCentersPage";
import UserManagementPage from "./pages/UserManagementPage";
import { usePermission } from "./hooks/usePermission";
import "./App.css";

function RoleRoute({ resource, children }) {
  const { canView } = usePermission(resource);
  if (!canView) {
    return <Navigate to="/dashboard" replace state={{ toast: "Access Denied." }} />;
  }
  return children;
}

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


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — redirect to /dashboard when already authenticated */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Protected — redirect to /login when not authenticated */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/"          element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardReportsPage title="Dashboard" />} />

            <Route path="/cars" element={
              <RoleRoute resource="cars"><CarInventoryPage /></RoleRoute>
            } />
            <Route path="/customers" element={
              <RoleRoute resource="customers"><Customers /></RoleRoute>
            } />
            <Route path="/suppliers" element={
              <RoleRoute resource="suppliers"><SuppliersPage /></RoleRoute>
            } />
            <Route path="/inventory" element={
              <RoleRoute resource="inventory"><InventoryPage /></RoleRoute>
            } />
            <Route path="/sales" element={
              <RoleRoute resource="sales"><SalesPage /></RoleRoute>
            } />
            <Route path="/payments" element={
              <RoleRoute resource="payments"><PaymentsPage /></RoleRoute>
            } />
            <Route path="/service" element={
              <RoleRoute resource="service"><ServiceRecordsPage /></RoleRoute>
            } />
            <Route path="/service-centers" element={
              <RoleRoute resource="service-centers"><ServiceCentersPage /></RoleRoute>
            } />
            <Route path="/reports" element={
              <RoleRoute resource="reports">
                <DashboardReportsPage title="Reports" />
              </RoleRoute>
            } />
            <Route path="/users" element={
              <RoleRoute resource="users"><UserManagementPage /></RoleRoute>
            } />
            <Route path="/signup" element={
              <RoleRoute resource="users"><Signup /></RoleRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
