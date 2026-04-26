import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";
import { usePermission } from "../hooks/usePermission";
import { useAuth } from "../hooks/useAuth";
import logger from "../utils/logger";

const initialForm = {
  car_id: "",
  customer_id: "",
  user_id: "",
  sale_date: "",
  sale_price: "",
};

const getId = (item, keys) => keys.map((key) => item[key]).find((value) => value !== undefined);

const getText = (item, keys, fallback = "Unknown") =>
  keys.map((key) => item[key]).find((value) => value !== undefined && value !== null) || fallback;

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString();
};

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value));
};

function SalesPage() {
  const { canCreate, canDelete } = usePermission("sales");
  const { user } = useAuth();

  useEffect(() => {
    logger.nav(`Page mounted: Sales user=${user?.username} role=${user?.role_name}`);
    return () => logger.nav("Page unmounted: Sales");
  }, []);

  const [sales, setSales] = useState([]);
  const [cars, setCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableCars = useMemo(
    () =>
      cars.filter((car) => {
        const status = String(getText(car, ["status", "Status"], "")).toLowerCase();
        return status === "available";
      }),
    [cars]
  );

  const fetchSales = async () => {
    logger.api("Fetching sales...");
    const response = await apiFetch("/sales");
    if (!response.ok) throw new Error("Unable to fetch sales.");
    const data = await response.json();
    setSales(Array.isArray(data) ? data : []);
    logger.api(`Sales loaded: ${Array.isArray(data) ? data.length : 0} records`);
  };

  useEffect(() => {
    const loadSalesPageData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [salesResponse, carsResponse, customersResponse, employeesResponse] =
          await Promise.all([
            apiFetch("/sales"),
            apiFetch("/cars"),
            apiFetch("/customers"),
            apiFetch("/users"),
          ]);

        if (!salesResponse.ok) throw new Error("Unable to fetch sales.");
        if (!carsResponse.ok) throw new Error("Unable to fetch cars.");
        if (!customersResponse.ok) throw new Error("Unable to fetch customers.");
        if (!employeesResponse.ok) throw new Error("Unable to fetch employees.");

        const [salesData, carsData, customersData, employeesData] = await Promise.all([
          salesResponse.json(),
          carsResponse.json(),
          customersResponse.json(),
          employeesResponse.json(),
        ]);

        setSales(Array.isArray(salesData) ? salesData : []);
        setCars(Array.isArray(carsData) ? carsData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSalesPageData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      logger.api(`Creating new sale: ${JSON.stringify({ car_id: form.car_id, customer_id: form.customer_id })}`);
      const response = await apiFetch("/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_id: Number(form.car_id),
          customer_id: Number(form.customer_id),
          user_id: Number(form.user_id),
          sale_date: form.sale_date,
          sale_price: Number(form.sale_price),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to create sale.");
      }

      logger.api(`Sale created: sale_id=${result.saleId}`);
      await fetchSales();
      setForm(initialForm);
      setIsFormOpen(false);
      setSuccess("Sale completed successfully.");
    } catch (submitError) {
      logger.error(`Failed to create sale: ${submitError.message}`);
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (saleId) => {
    if (!window.confirm(`Delete sale #${saleId}?`)) return;
    setError("");
    setSuccess("");

    try {
      logger.api(`Deleting sale: sale_id=${saleId}`);
      const response = await apiFetch(`/sales/${saleId}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete sale.");
      }

      logger.api(`Sale deleted: sale_id=${saleId}`);
      await fetchSales();
      setSuccess("Sale deleted successfully.");
    } catch (deleteError) {
      logger.error(`Failed to delete sale: ${deleteError.message}`);
      setError(deleteError.message);
    }
  };

  const colSpan = 6 + (canDelete ? 1 : 0);

  return (
    <section className="page-section sales-page">
      <div className="section-heading sales-heading">
        <div>
          <h2>Sales</h2>
          <p>Complete vehicle sales and review transaction history.</p>
        </div>
        {canCreate && (
          <button
            className="primary-action"
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setSuccess("");
              setError("");
            }}
          >
            New Sale
          </button>
        )}
      </div>

      {success && <div className="notice success">{success}</div>}
      {error && <div className="notice error">{error}</div>}

      {isFormOpen && (
        <article className="panel sales-form-panel">
          <div className="panel-title form-title-row">
            <div>
              <h3>New Sale</h3>
              <p>Select an available car, customer, employee, and sale details.</p>
            </div>
            <button
              className="ghost-action"
              type="button"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </button>
          </div>

          <form className="sales-form" onSubmit={handleSubmit}>
            <label>
              Car
              <select
                name="car_id"
                value={form.car_id}
                onChange={handleChange}
                required
              >
                <option value="">Select available car</option>
                {availableCars.map((car) => {
                  const carId = getId(car, ["car_id", "Car_ID", "id"]);
                  const carName = getText(car, [
                    "car_model",
                    "Car_Model",
                    "model",
                    "Model",
                    "Car_Name",
                    "name",
                  ]);

                  return (
                    <option key={carId} value={carId}>
                      {carName}
                    </option>
                  );
                })}
              </select>
            </label>

            <label>
              Customer
              <select
                name="customer_id"
                value={form.customer_id}
                onChange={handleChange}
                required
              >
                <option value="">Select customer</option>
                {customers.map((customer) => {
                  const customerId = getId(customer, ["customer_id", "Customer_ID", "id"]);
                  const customerName = getText(customer, [
                    "customer_name",
                    "Customer_Name",
                    "name",
                    "Name",
                    "full_name",
                  ]);

                  return (
                    <option key={customerId} value={customerId}>
                      {customerName}
                    </option>
                  );
                })}
              </select>
            </label>

            <label>
              Employee
              <select
                name="user_id"
                value={form.user_id}
                onChange={handleChange}
                required
              >
                <option value="">Select employee</option>
                {employees.map((employee) => {
                  const employeeId = getId(employee, ["user_id", "employee_id", "Employee_ID", "id"]);
                  const employeeName = getText(employee, [
                    "full_name",
                    "employee_name",
                    "Employee_Name",
                    "user_name",
                    "User_Name",
                    "name",
                    "Name",
                  ]);

                  return (
                    <option key={employeeId} value={employeeId}>
                      {employeeName}
                    </option>
                  );
                })}
              </select>
            </label>

            <label>
              Sale Date
              <input
                name="sale_date"
                type="date"
                value={form.sale_date}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Sale Price
              <input
                name="sale_price"
                type="number"
                min="0"
                step="0.01"
                value={form.sale_price}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </label>

            <button className="primary-action submit-action" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Submit Sale"}
            </button>
          </form>
        </article>
      )}

      <article className="panel table-panel">
        {isLoading ? (
          <div className="empty-state">Loading sales...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Car</th>
                <th>Customer</th>
                <th>Employee</th>
                <th>Sale Date</th>
                <th>Sale Price</th>
                {canDelete && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>No sales found.</td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const saleId = getId(sale, ["sale_id", "Sale_ID", "id"]);
                  const car = getText(sale, ["car_model", "Car_Model", "car", "Car", "model", "Model"]);
                  const customer = getText(sale, [
                    "customer_name",
                    "Customer_Name",
                    "customer",
                    "Customer",
                  ]);
                  const employee = getText(sale, [
                    "employee_name",
                    "Employee_Name",
                    "employee",
                    "Employee",
                  ]);
                  const saleDate = getText(sale, ["sale_date", "Sale_Date"], "");
                  const salePrice = getText(sale, ["sale_price", "Sale_Price"], "");

                  return (
                    <tr key={saleId}>
                      <td>{saleId}</td>
                      <td>{car}</td>
                      <td>{customer}</td>
                      <td>{employee}</td>
                      <td>{formatDate(saleDate)}</td>
                      <td>{formatPrice(salePrice)}</td>
                      {canDelete && (
                        <td>
                          <div className="row-actions">
                            <button
                              className="table-action danger"
                              type="button"
                              onClick={() => handleDelete(saleId)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}

export default SalesPage;
