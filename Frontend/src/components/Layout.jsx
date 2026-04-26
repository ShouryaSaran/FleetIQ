import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

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
