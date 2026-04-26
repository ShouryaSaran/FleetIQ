import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

const initialForm = {
  model: "",
  brand: "",
  year: "",
  fuel_type: "",
  price: "",
  status: "Available",
  supplier_id: "",
};

const getValue = (item, keys, fallback = "") =>
  keys.map((key) => item[key]).find((value) => value !== undefined && value !== null) ?? fallback;

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
};

function CarInventoryPage() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingCarId, setEditingCarId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCars = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiFetch("/cars");

      if (!response.ok) {
        throw new Error("Unable to fetch cars.");
      }

      const data = await response.json();
      setCars(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadCars = async () => {
      await fetchCars();
    };

    loadCars();
  }, [fetchCars]);

  const openAddForm = () => {
    setForm(initialForm);
    setEditingCarId(null);
    setIsFormOpen(true);
    setError("");
    setSuccess("");
  };

  const openEditForm = (car) => {
    const carId = getValue(car, ["car_id", "Car_ID", "id"]);

    setForm({
      model: getValue(car, ["model", "Model", "car_model", "Car_Model", "Car_Name"]),
      brand: getValue(car, ["brand", "Brand", "make", "Make"]),
      year: getValue(car, ["year", "Year", "model_year", "Model_Year"]),
      fuel_type: getValue(car, ["fuel_type", "Fuel_Type", "fuelType"]),
      price: getValue(car, ["price", "Price"]),
      status: getValue(car, ["status", "Status"], "Available"),
      supplier_id: getValue(car, ["supplier_id", "Supplier_ID"]),
    });
    setEditingCarId(carId);
    setIsFormOpen(true);
    setError("");
    setSuccess("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      model: form.model,
      brand: form.brand,
      year: Number(form.year),
      fuel_type: form.fuel_type,
      price: Number(form.price),
      status: form.status,
      supplier_id: Number(form.supplier_id),
    };

    try {
      const url = editingCarId ? `/cars/${editingCarId}` : "/cars";
      const method = editingCarId ? "PUT" : "POST";
      const response = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save car.");
      }

      await fetchCars();
      setForm(initialForm);
      setEditingCarId(null);
      setIsFormOpen(false);
      setSuccess(editingCarId ? "Car updated successfully." : "Car added successfully.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (car) => {
    const carId = getValue(car, ["car_id", "Car_ID", "id"]);
    const model = getValue(car, ["model", "Model", "car_model", "Car_Model", "Car_Name"], "this car");

    if (!window.confirm(`Delete ${model}?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(`/cars/${carId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete car.");
      }

      await fetchCars();
      setSuccess("Car deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <section className="page-section inventory-page">
      <div className="section-heading inventory-heading">
        <div>
          <h2>Car Inventory</h2>
          <p>Manage stock, pricing, availability, and supplier assignments.</p>
        </div>
        <button className="primary-action" type="button" onClick={openAddForm}>
          Add Car
        </button>
      </div>

      {success && <div className="notice success">{success}</div>}
      {error && <div className="notice error">{error}</div>}

      {isFormOpen && (
        <article className="panel inventory-form-panel">
          <div className="panel-title form-title-row">
            <div>
              <h3>{editingCarId ? "Edit Car" : "Add Car"}</h3>
              <p>Enter vehicle details exactly as they should appear in inventory.</p>
            </div>
            <button
              className="ghost-action"
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingCarId(null);
                setForm(initialForm);
              }}
            >
              Cancel
            </button>
          </div>

          <form className="inventory-form" onSubmit={handleSubmit}>
            <label>
              Model
              <input name="model" value={form.model} onChange={handleChange} required />
            </label>

            <label>
              Brand
              <input name="brand" value={form.brand} onChange={handleChange} required />
            </label>

            <label>
              Year
              <input
                name="year"
                type="number"
                min="1900"
                max="2100"
                value={form.year}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Fuel Type
              <input
                name="fuel_type"
                value={form.fuel_type}
                onChange={handleChange}
                placeholder="Petrol, Diesel, EV"
                required
              />
            </label>

            <label>
              Price
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange} required>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </label>

            <label>
              Supplier ID
              <input
                name="supplier_id"
                type="number"
                min="1"
                value={form.supplier_id}
                onChange={handleChange}
                required
              />
            </label>

            <button className="primary-action submit-action" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingCarId ? "Update Car" : "Save Car"}
            </button>
          </form>
        </article>
      )}

      <article className="panel table-panel">
        {isLoading ? (
          <div className="empty-state">Loading cars...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Model</th>
                <th>Brand</th>
                <th>Year</th>
                <th>Fuel Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Supplier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.length === 0 ? (
                <tr>
                  <td colSpan="9">No cars found.</td>
                </tr>
              ) : (
                cars.map((car) => {
                  const carId = getValue(car, ["car_id", "Car_ID", "id"]);
                  const status = getValue(car, ["status", "Status"], "Available");

                  return (
                    <tr key={carId}>
                      <td>{carId}</td>
                      <td>{getValue(car, ["model", "Model", "car_model", "Car_Model", "Car_Name"], "-")}</td>
                      <td>{getValue(car, ["brand", "Brand", "make", "Make"], "-")}</td>
                      <td>{getValue(car, ["year", "Year", "model_year", "Model_Year"], "-")}</td>
                      <td>{getValue(car, ["fuel_type", "Fuel_Type", "fuelType"], "-")}</td>
                      <td>{formatPrice(getValue(car, ["price", "Price"]))}</td>
                      <td>
                        <span className={`status-badge ${String(status).toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        {getValue(
                          car,
                          ["supplier_name", "Supplier_Name", "supplier", "Supplier", "supplier_id", "Supplier_ID"],
                          "-"
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="table-action" type="button" onClick={() => openEditForm(car)}>
                            Edit
                          </button>
                          <button className="table-action danger" type="button" onClick={() => handleDelete(car)}>
                            Delete
                          </button>
                        </div>
                      </td>
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

export default CarInventoryPage;
