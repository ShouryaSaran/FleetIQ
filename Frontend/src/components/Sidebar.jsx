import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Dashboard", icon: "dashboard" },
  { path: "/cars", label: "Cars", icon: "cars" },
  { path: "/customers", label: "Customers", icon: "customers" },
  { path: "/sales", label: "Sales", icon: "sales" },
  { path: "/payments", label: "Payments", icon: "payments" },
  { path: "/service", label: "Service", icon: "service" },
  { path: "/reports", label: "Reports", icon: "reports" },
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
    service: (
      <path d="M21 7.5a5.5 5.5 0 0 1-7 5.3L7.8 19a2.8 2.8 0 0 1-4-4l6.2-6.2A5.5 5.5 0 0 1 16.5 2L13 5.5 15.5 8 19 4.5c1.2.8 2 1.9 2 3Z" />
    ),
    reports: (
      <path d="M4 20V4h16v16H4Zm4-3h2V9H8v8Zm4 0h2V6h-2v11Zm4 0h2v-5h-2v5Z" />
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">AutoInventory</div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">AR</div>
        <div>
          <strong>Alex Rivera</strong>
          <span>Inventory Manager</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
