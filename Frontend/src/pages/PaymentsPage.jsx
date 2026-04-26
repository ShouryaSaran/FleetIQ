import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { usePermission } from "../hooks/usePermission";
import { useAuth } from "../hooks/useAuth";
import logger from "../utils/logger";

const initialForm = {
  sale_id: "",
  amount: "",
  payment_method: "Cash",
  payment_date: "",
  status: "Pending",
};

const getValue = (item, keys, fallback = "") =>
  keys.map((key) => item[key]).find((value) => value !== undefined && value !== null) ?? fallback;

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString();
};

const formatAmount = (value) => {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
};

function PaymentsPage() {
  const { canCreate, canDelete } = usePermission("payments");
  const { user } = useAuth();

  useEffect(() => {
    logger.nav(`Page mounted: Payments user=${user?.username} role=${user?.role_name}`);
    return () => logger.nav("Page unmounted: Payments");
  }, []);

  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPayments = async () => {
    logger.api("Fetching payments...");
    const response = await apiFetch("/payments");
    if (!response.ok) throw new Error("Unable to fetch payments.");
    const data = await response.json();
    setPayments(Array.isArray(data) ? data : []);
    logger.api(`Payments loaded: ${Array.isArray(data) ? data.length : 0} records`);
  };

  useEffect(() => {
    const loadPaymentsPageData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [paymentsResponse, salesResponse] = await Promise.all([
          apiFetch("/payments"),
          apiFetch("/sales"),
        ]);

        if (!paymentsResponse.ok) throw new Error("Unable to fetch payments.");
        if (!salesResponse.ok) throw new Error("Unable to fetch sales.");

        const [paymentsData, salesData] = await Promise.all([
          paymentsResponse.json(),
          salesResponse.json(),
        ]);

        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setSales(Array.isArray(salesData) ? salesData : []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentsPageData();
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
      logger.api(`Creating payment for sale_id=${form.sale_id}`);
      const response = await apiFetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_id: Number(form.sale_id),
          amount: Number(form.amount),
          payment_method: form.payment_method,
          payment_date: form.payment_date,
          status: form.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to record payment.");
      }

      logger.api(`Payment created: payment_id=${result.paymentId}`);
      await fetchPayments();
      setForm(initialForm);
      setIsFormOpen(false);
      setSuccess("Payment recorded successfully.");
    } catch (submitError) {
      logger.error(`Failed to record payment: ${submitError.message}`);
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm(`Delete payment #${paymentId}?`)) return;
    setError("");
    setSuccess("");

    try {
      logger.api(`Deleting payment: payment_id=${paymentId}`);
      const response = await apiFetch(`/payments/${paymentId}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete payment.");
      }

      logger.api(`Payment deleted: payment_id=${paymentId}`);
      await fetchPayments();
      setSuccess("Payment deleted successfully.");
    } catch (deleteError) {
      logger.error(`Failed to delete payment: ${deleteError.message}`);
      setError(deleteError.message);
    }
  };

  const colSpan = 6 + (canDelete ? 1 : 0);

  return (
    <section className="page-section payments-page">
      <div className="section-heading payments-heading">
        <div>
          <h2>Payments</h2>
          <p>Record and monitor payment status for completed vehicle sales.</p>
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
            Record Payment
          </button>
        )}
      </div>

      {success && <div className="notice success">{success}</div>}
      {error && <div className="notice error">{error}</div>}

      {isFormOpen && (
        <article className="panel payments-form-panel">
          <div className="panel-title form-title-row">
            <div>
              <h3>Record Payment</h3>
              <p>Select a sale and enter payment details.</p>
            </div>
            <button
              className="ghost-action"
              type="button"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </button>
          </div>

          <form className="payments-form" onSubmit={handleSubmit}>
            <label>
              Sale ID
              <select name="sale_id" value={form.sale_id} onChange={handleChange} required>
                <option value="">Select sale</option>
                {sales.map((sale) => {
                  const saleId = getValue(sale, ["sale_id", "Sale_ID", "id"]);
                  const car = getValue(sale, ["car_model", "Car_Model", "car", "Car"], "Sale");
                  const customer = getValue(
                    sale,
                    ["customer_name", "Customer_Name", "customer", "Customer"],
                    ""
                  );

                  return (
                    <option key={saleId} value={saleId}>
                      #{saleId} {car} {customer ? `- ${customer}` : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            <label>
              Amount
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Method
              <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </label>

            <label>
              Date
              <input
                name="payment_date"
                type="date"
                value={form.payment_date}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>
            </label>

            <button className="primary-action submit-action" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Submit Payment"}
            </button>
          </form>
        </article>
      )}

      <article className="panel table-panel">
        {isLoading ? (
          <div className="empty-state">Loading payments...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Sale ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                {canDelete && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>No payments found.</td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const paymentId = getValue(payment, ["payment_id", "Payment_ID", "id"]);
                  const saleId = getValue(payment, ["sale_id", "Sale_ID"]);
                  const amount = getValue(payment, ["amount", "Amount"]);
                  const method = getValue(payment, ["payment_method", "Payment_Method"], "-");
                  const date = getValue(payment, ["payment_date", "Payment_Date"], "");
                  const status = getValue(payment, ["status", "Status"], "Pending");

                  return (
                    <tr key={paymentId}>
                      <td>{paymentId}</td>
                      <td>{saleId}</td>
                      <td>{formatAmount(amount)}</td>
                      <td>{method}</td>
                      <td>{formatDate(date)}</td>
                      <td>
                        <span className={`payment-status-badge ${String(status).toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      {canDelete && (
                        <td>
                          <div className="row-actions">
                            <button
                              className="table-action danger"
                              type="button"
                              onClick={() => handleDelete(paymentId)}
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

export default PaymentsPage;
