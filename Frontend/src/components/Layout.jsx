import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const pageTitles = {
  "/": "Dashboard",
  "/cars": "Car Inventory",
  "/customers": "Customers",
  "/sales": "Sales",
  "/payments": "Payments",
  "/service": "Service Records",
  "/reports": "Reports",
};

function Layout() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "Dashboard";

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
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
