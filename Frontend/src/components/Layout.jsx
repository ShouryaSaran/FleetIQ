import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useTheme } from "../context/ThemeContext";

const pageTitles = {
  "/":                 "Dashboard",
  "/dashboard":        "Dashboard",
  "/cars":             "Car Inventory",
  "/customers":        "Customers",
  "/suppliers":        "Supplier Management",
  "/inventory":        "Inventory",
  "/sales":            "Sales",
  "/payments":         "Payments",
  "/service":          "Service Records",
  "/service-centers":  "Service Centers",
  "/reports":          "Reports",
  "/users":            "User Management",
};

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'relative',
        width: '52px',
        height: '26px',
        borderRadius: '99px',
        background: isDark ? '#1E3A5F' : '#CBD5E1',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background 0.3s ease',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '3px',
      }}
    >
      <span style={{
        position: 'absolute',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'var(--accent)',
        transform: isDark ? 'translateX(0px)' : 'translateX(26px)',
        transition: 'transform 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }}>
        {isDark ? '☽' : '☀'}
      </span>
    </button>
  );
}

function Layout() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "Dashboard";
  const [accessToast, setAccessToast] = useState(null);

  useEffect(() => {
    if (location.state?.toast) {
      setAccessToast(location.state.toast);
      const id = setTimeout(() => setAccessToast(null), 3000);
      return () => clearTimeout(id);
    }
  }, [location.key]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <header className="top-header">
          <button className="menu-button" type="button" aria-label="Open navigation">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h1>{pageTitle}</h1>
          <div style={{ marginLeft: 'auto' }}>
            <ThemeToggle />
          </div>
        </header>
        {accessToast && (
          <div className="notice error" role="alert" style={{ margin: "0 1.5rem" }}>
            {accessToast}
          </div>
        )}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
