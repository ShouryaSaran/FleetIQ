import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { usePermission } from "../hooks/usePermission";
import { useAuth } from "../hooks/useAuth";
import logger from "../utils/logger";

const initialForm = { name: "" };

function ServiceCentersPage() {
  const { canCreate } = usePermission("service-centers");
  const { user } = useAuth();

  useEffect(() => {
    logger.nav(`Page mounted: Service Centers user=${user?.username} role=${user?.role_name}`);
    return () => logger.nav("Page unmounted: Service Centers");
  }, []);

  const [centers, setCenters] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCenters = async () => {
    logger.api("Fetching service centers...");
    const res = await apiFetch("/service-centers");
    if (!res.ok) throw new Error("Unable to fetch service centers.");
    const data = await res.json();
    setCenters(Array.isArray(data) ? data : []);
    logger.api(`Service centers loaded: ${Array.isArray(data) ? data.length : 0} records`);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        await fetchCenters();
      } catch (err) {
        logger.error(`Failed to load service centers: ${err.message}`);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    setError("");
    logger.api(`Creating service center: name=${form.name.trim()}`);
    try {
      const res = await apiFetch("/service-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add service center.");
      logger.api(`Service center created: center_id=${data.centerId ?? data.id ?? "?"}`);
      await fetchCenters();
      setForm(initialForm);
      setIsFormOpen(false);
      setSuccess("Service center added successfully.");
    } catch (err) {
      logger.error(`Failed to add service center: ${err.message}`);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="page-section service-centers-page">
      <div className="section-heading">
        <div>
          <h2>Service Centers</h2>
          <p>Manage vehicle service and maintenance locations.</p>
        </div>
        {canCreate && (
          <button
            className="primary-action"
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setError("");
              setSuccess("");
            }}
          >
            Add Service Center
          </button>
        )}
      </div>

      {success && <div className="notice success">{success}</div>}
      {error   && <div className="notice error">{error}</div>}

      {isFormOpen && (
        <article className="panel">
          <div className="panel-title form-title-row">
            <div>
              <h3>Add Service Center</h3>
            </div>
            <button
              className="ghost-action"
              type="button"
              onClick={() => { setIsFormOpen(false); setForm(initialForm); }}
            >
              Cancel
            </button>
          </div>
          <form className="inventory-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                placeholder="e.g. AutoCare Delhi"
                required
              />
            </label>
            <button className="primary-action submit-action" type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save Service Center"}
            </button>
          </form>
        </article>
      )}

      <article className="panel table-panel">
        {isLoading ? (
          <div className="empty-state">Loading service centers...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {centers.length === 0 ? (
                <tr>
                  <td colSpan="2">No service centers found.</td>
                </tr>
              ) : (
                centers.map((center) => {
                  const id   = center.center_id ?? center.service_center_id ?? center.id;
                  const name = center.name ?? center.center_name ?? "-";
                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{name}</td>
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

export default ServiceCentersPage;
