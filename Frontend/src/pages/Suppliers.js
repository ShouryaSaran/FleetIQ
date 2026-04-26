import { Fragment, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";

const PHONE_RE = /^\d{10}$/;

const initialForm = { supplier_name: "", contact_person: "", phone: "" };

function getVal(obj, keys, fallback = "") {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);
  return (
    <div className={`sup-toast sup-toast--${type}`} role="alert">
      {message}
    </div>
  );
}

function validate(f) {
  const errs = {};
  if (!f.supplier_name.trim()) errs.supplier_name = "Supplier name is required.";
  if (!f.contact_person.trim()) errs.contact_person = "Address / contact details are required.";
  if (!f.phone.trim()) {
    errs.phone = "Contact number is required.";
  } else if (!PHONE_RE.test(f.phone.trim())) {
    errs.phone = "Must be exactly 10 digits.";
  }
  return errs;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState({});

  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchSuppliers = async () => {
    const res = await apiFetch("/suppliers");
    if (!res.ok) throw new Error("Unable to fetch suppliers.");
    const data = await res.json();
    setSuppliers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [suppRes, carsRes] = await Promise.all([
          apiFetch("/suppliers"),
          apiFetch("/cars"),
        ]);
        if (!suppRes.ok) throw new Error("Unable to fetch suppliers.");
        if (!carsRes.ok) throw new Error("Unable to fetch cars.");
        const [suppData, carsData] = await Promise.all([suppRes.json(), carsRes.json()]);
        setSuppliers(Array.isArray(suppData) ? suppData : []);
        setCars(Array.isArray(carsData) ? carsData : []);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const carCountMap = useMemo(() => {
    const map = {};
    cars.forEach((car) => {
      const sid = getVal(car, ["Supplier_ID", "supplier_id"]);
      if (sid != null && sid !== "") map[sid] = (map[sid] || 0) + 1;
    });
    return map;
  }, [cars]);

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        getVal(s, ["supplier_name", "Supplier_Name"]).toLowerCase().includes(q) ||
        getVal(s, ["contact_person", "Contact_Person"]).toLowerCase().includes(q) ||
        getVal(s, ["phone", "Phone"]).toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const handleRowClick = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (expandedData[id]) return;
    setExpandedData((prev) => ({ ...prev, [id]: { cars: [], loading: true, error: "" } }));
    try {
      const res = await apiFetch(`/suppliers/${id}`);
      if (!res.ok) throw new Error("Unable to fetch supplier details.");
      const data = await res.json();
      setExpandedData((prev) => ({
        ...prev,
        [id]: { cars: Array.isArray(data.cars) ? data.cars : [], loading: false, error: "" },
      }));
    } catch (err) {
      setExpandedData((prev) => ({
        ...prev,
        [id]: { cars: [], loading: false, error: err.message },
      }));
    }
  };

  const openAdd = () => {
    setForm(initialForm);
    setFormErrors({});
    setEditingId(null);
    setIsFormOpen(true);
    setDeleteError("");
  };

  const openEdit = (s) => {
    setForm({
      supplier_name: getVal(s, ["supplier_name", "Supplier_Name"]),
      contact_person: getVal(s, ["contact_person", "Contact_Person"]),
      phone: getVal(s, ["phone", "Phone"]),
    });
    setFormErrors({});
    setEditingId(getVal(s, ["Supplier_ID", "supplier_id"]));
    setIsFormOpen(true);
    setDeleteError("");
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setFormErrors({});
  };

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setIsSaving(true);
    try {
      const url = editingId ? `/suppliers/${editingId}` : "/suppliers";
      const method = editingId ? "PUT" : "POST";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_name: form.supplier_name.trim(),
          contact_person: form.contact_person.trim(),
          phone: form.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save supplier.");
      if (editingId) {
        setExpandedData((prev) => {
          const next = { ...prev };
          delete next[editingId];
          return next;
        });
      }
      await fetchSuppliers();
      closeForm();
      showToast(editingId ? "Supplier updated successfully." : "Supplier added successfully.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (s) => {
    const id = getVal(s, ["Supplier_ID", "supplier_id"]);
    const name = getVal(s, ["supplier_name", "Supplier_Name"], "this supplier");
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setDeleteError("");
    try {
      const res = await apiFetch(`/suppliers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400) {
          setDeleteError("This supplier has cars linked and cannot be deleted.");
          return;
        }
        throw new Error(data.message || "Failed to delete supplier.");
      }
      setExpandedData((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (expandedId === id) setExpandedId(null);
      await fetchSuppliers();
      showToast("Supplier deleted successfully.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <section className="page-section suppliers-page">
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      <div className="section-heading suppliers-heading">
        <div>
          <h2>
            Supplier Management
            <span className="count-badge">{suppliers.length}</span>
          </h2>
          <p>Manage supplier contacts and their vehicle contributions.</p>
        </div>
        <div className="suppliers-toolbar">
          <input
            className="suppliers-search"
            type="search"
            placeholder="Search by name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search suppliers"
          />
          <button className="primary-action" type="button" onClick={openAdd}>
            Add Supplier
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="notice error" role="alert">
          {deleteError}
        </div>
      )}

      {isFormOpen && (
        <article className="panel suppliers-form-panel">
          <div className="panel-title form-title-row">
            <div>
              <h3>{editingId ? "Edit Supplier" : "Add Supplier"}</h3>
              <p>All fields are required.</p>
            </div>
            <button className="ghost-action" type="button" onClick={closeForm}>
              Cancel
            </button>
          </div>

          <form className="suppliers-form" onSubmit={handleSubmit} noValidate>
            <div className={`sup-field${formErrors.supplier_name ? " sup-field--error" : ""}`}>
              <label htmlFor="sup-name">Full Name</label>
              <input
                id="sup-name"
                value={form.supplier_name}
                onChange={(e) => setField("supplier_name", e.target.value)}
                placeholder="e.g. Toyota Motors Ltd."
                disabled={isSaving}
              />
              {formErrors.supplier_name && (
                <span className="sup-field-msg">{formErrors.supplier_name}</span>
              )}
            </div>

            <div className={`sup-field${formErrors.phone ? " sup-field--error" : ""}`}>
              <label htmlFor="sup-phone">Contact Number</label>
              <input
                id="sup-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit number"
                maxLength={10}
                disabled={isSaving}
              />
              {formErrors.phone && (
                <span className="sup-field-msg">{formErrors.phone}</span>
              )}
            </div>

            <div className={`sup-field sup-field--span${formErrors.contact_person ? " sup-field--error" : ""}`}>
              <label htmlFor="sup-address">Address</label>
              <textarea
                id="sup-address"
                className="sup-textarea"
                value={form.contact_person}
                onChange={(e) => setField("contact_person", e.target.value)}
                placeholder="Contact person, address, or location details"
                rows={3}
                disabled={isSaving}
              />
              {formErrors.contact_person && (
                <span className="sup-field-msg">{formErrors.contact_person}</span>
              )}
            </div>

            <div className="sup-form-actions">
              <button className="primary-action" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingId ? "Update Supplier" : "Save Supplier"}
              </button>
              <button className="ghost-action" type="button" onClick={closeForm} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </form>
        </article>
      )}

      <article className="panel table-panel">
        {isLoading ? (
          <div className="spinner-wrap">
            <span className="loading-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {suppliers.length === 0
              ? "No suppliers found. Add your first supplier."
              : "No suppliers match your search."}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Name</th>
                <th>Contact Number</th>
                <th>Address</th>
                <th>Cars Supplied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const id = getVal(s, ["Supplier_ID", "supplier_id"]);
                const name = getVal(s, ["supplier_name", "Supplier_Name"], "—");
                const phone = getVal(s, ["phone", "Phone"], "—");
                const contact = getVal(s, ["contact_person", "Contact_Person"], "—");
                const count = carCountMap[id] ?? 0;
                const isExpanded = expandedId === id;
                const expanded = expandedData[id];

                return (
                  <Fragment key={id}>
                    <tr className="expandable-row" onClick={() => handleRowClick(id)}>
                      <td>{id}</td>
                      <td>{name}</td>
                      <td>{phone}</td>
                      <td>{contact}</td>
                      <td>
                        <span className="count-badge count-badge--sm">{count}</span>
                      </td>
                      <td>
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="table-action"
                            type="button"
                            onClick={() => openEdit(s)}
                          >
                            Edit
                          </button>
                          <button
                            className="table-action danger"
                            type="button"
                            onClick={() => handleDelete(s)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="details-row">
                        <td colSpan="6">
                          <div className="supplier-cars-panel">
                            {!expanded || expanded.loading ? (
                              <p className="sup-detail-msg">Loading cars…</p>
                            ) : expanded.error ? (
                              <p className="sup-detail-msg sup-detail-msg--error">
                                {expanded.error}
                              </p>
                            ) : expanded.cars.length === 0 ? (
                              <p className="sup-detail-msg">
                                No cars are linked to this supplier.
                              </p>
                            ) : (
                              <div className="supplier-cars-grid">
                                {expanded.cars.map((car) => {
                                  const carId = getVal(car, ["Car_ID", "car_id"]);
                                  const make = getVal(
                                    car,
                                    ["make", "Make", "brand", "Brand"],
                                    "—"
                                  );
                                  const model = getVal(car, ["model", "Model"], "—");
                                  const year = getVal(car, ["year", "Year"], "—");
                                  const status = getVal(
                                    car,
                                    ["status", "Status"],
                                    "Available"
                                  );
                                  return (
                                    <div className="supplier-car-card" key={carId}>
                                      <div className="supplier-car-info">
                                        <strong>
                                          {make} {model}
                                        </strong>
                                        <span>{year}</span>
                                      </div>
                                      <span
                                        className={`status-badge ${String(status).toLowerCase()}`}
                                      >
                                        {status}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
