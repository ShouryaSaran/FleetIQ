import { Fragment, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";

const initialPart = {
  part_name: "",
  cost: "",
  description: "",
};

const initialForm = {
  car_id: "",
  center_id: "",
  service_date: "",
  parts: [{ ...initialPart }],
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

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
};

function ServiceRecordsPage() {
  const [records, setRecords] = useState([]);
  const [cars, setCars] = useState([]);
  const [centers, setCenters] = useState([]);
  const [detailsByRecord, setDetailsByRecord] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalCost = useMemo(
    () =>
      form.parts.reduce((total, part) => {
        const cost = Number(part.cost);
        return Number.isNaN(cost) ? total : total + cost;
      }, 0),
    [form.parts]
  );

  const fetchRecords = async () => {
    const response = await apiFetch("/service");

    if (!response.ok) {
      throw new Error("Unable to fetch service records.");
    }

    const data = await response.json();
    setRecords(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const loadServicePageData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [recordsResponse, carsResponse, centersResponse] = await Promise.all([
          apiFetch("/service"),
          apiFetch("/cars"),
          apiFetch("/service-centers"),
        ]);

        if (!recordsResponse.ok) throw new Error("Unable to fetch service records.");
        if (!carsResponse.ok) throw new Error("Unable to fetch cars.");
        if (!centersResponse.ok) throw new Error("Unable to fetch service centers.");

        const [recordsData, carsData, centersData] = await Promise.all([
          recordsResponse.json(),
          carsResponse.json(),
          centersResponse.json(),
        ]);

        setRecords(Array.isArray(recordsData) ? recordsData : []);
        setCars(Array.isArray(carsData) ? carsData : []);
        setCenters(Array.isArray(centersData) ? centersData : []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadServicePageData();
  }, []);

  const handleRecordClick = async (recordId) => {
    if (expandedId === recordId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(recordId);

    if (detailsByRecord[recordId]) {
      return;
    }

    try {
      const response = await apiFetch(`/service/${recordId}/details`);

      if (!response.ok) {
        throw new Error("Unable to fetch service details.");
      }

      const data = await response.json();
      setDetailsByRecord((currentDetails) => ({
        ...currentDetails,
        [recordId]: Array.isArray(data) ? data : [],
      }));
    } catch (detailsError) {
      setError(detailsError.message);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handlePartChange = (index, field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      parts: currentForm.parts.map((part, partIndex) =>
        partIndex === index ? { ...part, [field]: value } : part
      ),
    }));
  };

  const addPart = () => {
    setForm((currentForm) => ({
      ...currentForm,
      parts: [...currentForm.parts, { ...initialPart }],
    }));
  };

  const removePart = (index) => {
    setForm((currentForm) => ({
      ...currentForm,
      parts:
        currentForm.parts.length === 1
          ? currentForm.parts
          : currentForm.parts.filter((_, partIndex) => partIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch("/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          car_id: Number(form.car_id),
          center_id: Number(form.center_id),
          service_date: form.service_date,
          total_cost: totalCost,
          parts: form.parts.map((part) => ({
            part_name: part.part_name,
            cost: Number(part.cost),
            description: part.description,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to add service record.");
      }

      await fetchRecords();
      setForm(initialForm);
      setIsFormOpen(false);
      setExpandedId(null);
      setDetailsByRecord({});
      setSuccess("Service record added successfully.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section service-page">
      <div className="section-heading service-heading">
        <div>
          <h2>Service Records</h2>
          <p>Track service jobs, centers, parts, and total maintenance costs.</p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => {
            setIsFormOpen(true);
            setError("");
            setSuccess("");
          }}
        >
          Add Service Record
        </button>
      </div>

      {success && <div className="notice success">{success}</div>}
      {error && <div className="notice error">{error}</div>}

      {isFormOpen && (
        <article className="panel service-form-panel">
          <div className="panel-title form-title-row">
            <div>
              <h3>Add Service Record</h3>
              <p>Add the service header and one or more parts.</p>
            </div>
            <button className="ghost-action" type="button" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
          </div>

          <form className="service-form" onSubmit={handleSubmit}>
            <label>
              Car
              <select name="car_id" value={form.car_id} onChange={handleChange} required>
                <option value="">Select car</option>
                {cars.map((car) => {
                  const carId = getValue(car, ["car_id", "Car_ID", "id"]);
                  const model = getValue(car, ["model", "Model", "car_model", "Car_Model", "Car_Name"]);

                  return (
                    <option key={carId} value={carId}>
                      {model}
                    </option>
                  );
                })}
              </select>
            </label>

            <label>
              Service Center
              <select name="center_id" value={form.center_id} onChange={handleChange} required>
                <option value="">Select center</option>
                {centers.map((center) => {
                  const centerId = getValue(center, [
                    "center_id",
                    "Center_ID",
                    "service_center_id",
                    "Service_Center_ID",
                    "id",
                  ]);
                  const centerName = getValue(center, [
                    "center_name",
                    "Center_Name",
                    "service_center_name",
                    "Service_Center_Name",
                    "name",
                    "Name",
                  ]);

                  return (
                    <option key={centerId} value={centerId}>
                      {centerName}
                    </option>
                  );
                })}
              </select>
            </label>

            <label>
              Service Date
              <input
                name="service_date"
                type="date"
                value={form.service_date}
                onChange={handleChange}
                required
              />
            </label>

            <div className="total-cost-box">
              <span>Total Cost</span>
              <strong>{formatAmount(totalCost)}</strong>
            </div>

            <div className="parts-section">
              <div className="parts-header">
                <h3>Service Details</h3>
                <button className="ghost-action" type="button" onClick={addPart}>
                  Add Part
                </button>
              </div>

              {form.parts.map((part, index) => (
                <div className="part-row" key={index}>
                  <label>
                    Part Name
                    <input
                      value={part.part_name}
                      onChange={(event) => handlePartChange(index, "part_name", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Cost
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={part.cost}
                      onChange={(event) => handlePartChange(index, "cost", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      value={part.description}
                      onChange={(event) => handlePartChange(index, "description", event.target.value)}
                    />
                  </label>
                  <button className="table-action danger" type="button" onClick={() => removePart(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button className="primary-action submit-action" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Submit Service Record"}
            </button>
          </form>
        </article>
      )}

      <article className="panel table-panel">
        {isLoading ? (
          <div className="empty-state">Loading service records...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Service ID</th>
                <th>Car</th>
                <th>Service Center</th>
                <th>Date</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5">No service records found.</td>
                </tr>
              ) : (
                records.map((record) => {
                  const serviceId = getValue(record, ["service_id", "Service_ID", "service_record_id", "Service_Record_ID"]);
                  const details = detailsByRecord[serviceId];

                  return (
                    <Fragment key={serviceId}>
                      <tr className="expandable-row" onClick={() => handleRecordClick(serviceId)}>
                        <td>{serviceId}</td>
                        <td>{getValue(record, ["car_model", "Car_Model", "model", "Model"], "-")}</td>
                        <td>{getValue(record, ["center_name", "Center_Name", "service_center_name"], "-")}</td>
                        <td>{formatDate(getValue(record, ["service_date", "Service_Date"]))}</td>
                        <td>{formatAmount(getValue(record, ["total_cost", "Total_Cost"]))}</td>
                      </tr>
                      {expandedId === serviceId && (
                        <tr className="details-row">
                          <td colSpan="5">
                            <div className="service-details">
                              {details ? (
                                details.length === 0 ? (
                                  <p>No service details found.</p>
                                ) : (
                                  details.map((detail, detailIndex) => (
                                    <div className="service-detail-card" key={detailIndex}>
                                      <strong>{getValue(detail, ["part_name", "Part_Name"], "Part")}</strong>
                                      <span>{formatAmount(getValue(detail, ["cost", "Cost"]))}</span>
                                      <p>{getValue(detail, ["description", "Description"], "No description")}</p>
                                    </div>
                                  ))
                                )
                              ) : (
                                <p>Loading details...</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

export default ServiceRecordsPage;
