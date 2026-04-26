import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { usePermission } from "../hooks/usePermission";
import { useAuth } from "../hooks/useAuth";
import logger from "../utils/logger";

function InventoryPage() {
  const { canEdit } = usePermission("inventory");
  const { user } = useAuth();

  useEffect(() => {
    logger.nav(`Page mounted: Inventory user=${user?.username} role=${user?.role_name}`);
    return () => logger.nav("Page unmounted: Inventory");
  }, []);

  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newQuantity, setNewQuantity] = useState("");

  const fetchInventory = async () => {
    logger.api("Fetching inventory...");
    const res = await apiFetch("/inventory");
    if (!res.ok) throw new Error("Unable to fetch inventory.");
    const data = await res.json();
    setInventory(Array.isArray(data) ? data : []);
    logger.api(`Inventory loaded: ${Array.isArray(data) ? data.length : 0} records`);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        await fetchInventory();
      } catch (err) {
        logger.error(`Failed to load inventory: ${err.message}`);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const openEdit = (item) => {
    const id  = item.inventory_id ?? item.Inventory_ID;
    const qty = item.quantity ?? item.Quantity ?? 0;
    setEditingId(id);
    setNewQuantity(String(qty));
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewQuantity("");
  };

  const handleUpdate = async (id) => {
    setIsSaving(true);
    setError("");
    logger.api(`Updating inventory: inventory_id=${id} quantity=${newQuantity}`);
    try {
      const res = await apiFetch(`/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(newQuantity) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to update quantity.");
      logger.api(`Inventory updated: inventory_id=${id}`);
      await fetchInventory();
      setEditingId(null);
      setNewQuantity("");
      setSuccess("Inventory updated successfully.");
    } catch (err) {
      logger.error(`Failed to update inventory: ${err.message}`);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const colSpan = canEdit ? 6 : 5;

  return (
    <section className="page-section inventory-page">
      <div className="section-heading">
        <div>
          <h2>Inventory</h2>
          <p>Track stock levels and vehicle locations.</p>
        </div>
      </div>

      {success && <div className="notice success">{success}</div>}
      {error   && <div className="notice error">{error}</div>}

      <article className="panel table-panel">
        {isLoading ? (
          <div className="empty-state">Loading inventory...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Car</th>
                <th>Location</th>
                <th>Quantity</th>
                <th>Last Updated</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>No inventory records found.</td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const id         = item.inventory_id ?? item.Inventory_ID;
                  const carName    = item.Car_Name    ?? item.car_name    ?? item.car_id  ?? "-";
                  const location   = item.Location_Name ?? item.location_name ?? item.location_id ?? "-";
                  const quantity   = item.quantity ?? item.Quantity ?? 0;
                  const lastUpdated = item.last_updated ?? item.Last_Updated ?? "";
                  const isEditing  = editingId === id;

                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{carName}</td>
                      <td>{location}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(e.target.value)}
                            style={{ width: "80px" }}
                          />
                        ) : (
                          quantity
                        )}
                      </td>
                      <td>
                        {lastUpdated
                          ? new Date(lastUpdated).toLocaleDateString()
                          : "-"}
                      </td>
                      {canEdit && (
                        <td>
                          <div className="row-actions">
                            {isEditing ? (
                              <>
                                <button
                                  className="table-action"
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleUpdate(id)}
                                >
                                  {isSaving ? "Saving…" : "Save"}
                                </button>
                                <button
                                  className="ghost-action"
                                  type="button"
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                className="table-action"
                                type="button"
                                onClick={() => openEdit(item)}
                              >
                                Update Quantity
                              </button>
                            )}
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

export default InventoryPage;
