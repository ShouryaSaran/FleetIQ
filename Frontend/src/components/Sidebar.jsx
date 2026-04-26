import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const allNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/cars",      label: "Cars",       icon: "cars" },
  { path: "/customers", label: "Customers",  icon: "customers" },
  { path: "/suppliers", label: "Suppliers",  icon: "suppliers" },
  { path: "/sales",     label: "Sales",      icon: "sales" },
  { path: "/payments",  label: "Payments",   icon: "payments" },
  { path: "/service",   label: "Service",    icon: "service" },
  { path: "/reports",   label: "Reports",    icon: "reports", managerOnly: true },
];

function Icon({ name }) {
  const icons = {
    dashboard: (
      <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
    ),
    cars: (
      <path d="M5 11l1.6-4.2A3 3 0 0 1 9.4 5h5.2a3 3 0 0 1 2.8 1.8L19 11v6h-2v-2H7v2H5v-6Zm3 0h8l-1-2.8a1 1 0 0 0-.9-.6H9.9a1 1 0 0 0-.9.6L8 11Zm-.5 2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    ),
    customers: (
      <path d="M8 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8.5 1a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7ZM2 20a6 6 0 0 1 12 0H2Zm12.5 0a7.4 7.4 0 0 0-2-4.7A5 5 0 0 1 22 20h-7.5Z" />
    ),
    sales: (
      <path d="M4 4h9l7 7-9 9-7-7V4Zm5 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    ),
    payments: (
      <path d="M3 6h18v12H3V6Zm2 4h14V8H5v2Zm0 6h5v-2H5v2Zm9-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    ),
    suppliers: (
      <path d="M20 7l-8-4-8 4v10l8 4 8-4V7zm-8 1.56L16.57 11 12 13.44 7.43 11 12 8.56zM5 12.28l6 3v6.32l-6-3v-6.32zm8 3v6.32l6-3v-6.32l-6 3z" />
    ),
    service: (
      <path d="M21 7.5a5.5 5.5 0 0 1-7 5.3L7.8 19a2.8 2.8 0 0 1-4-4l6.2-6.2A5.5 5.5 0 0 1 16.5 2L13 5.5 15.5 8 19 4.5c1.2.8 2 1.9 2 3Z" />
    ),
    reports: (
      <path d="M4 20V4h16v16H4Zm4-3h2V9H8v8Zm4 0h2V6h-2v11Zm4 0h2v-5h-2v5Z" />
    ),
    logout: null,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Sidebar() {
  const { user, logout } = useAuth();

  const navItems = allNavItems.filter(
    (item) => !item.managerOnly || user?.role_name === "Manager"
  );

  return (
    <aside className="sidebar">
      <div className="brand">Smart Vehicle IMS</div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{getInitials(user?.name)}</div>
          <div className="sidebar-user-info">
            <strong>{user?.name || "Employee"}</strong>
            <span>{user?.role_name || ""}</span>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={() => logout()}
        >
          <LogoutIcon />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
