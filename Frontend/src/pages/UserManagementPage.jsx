import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

const ROLE_BADGE_CLASS = {
  Admin: "role-badge role-badge--admin",
  Manager: "role-badge role-badge--manager",
  "Sales Executive": "role-badge role-badge--sales",
  Mechanic: "role-badge role-badge--mechanic",
};

const formatLastLogin = (value) => {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
};

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function UserManagementPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", role_id: "" });
  const [isSaving, setIsSaving] = useState(false);

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", email: "", username: "", password: "", role_id: "" });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const totalEmployees = users.length;
  const activeAccounts = users.filter((u) => u.is_active).length;
  const disabledAccounts = users.filter((u) => !u.is_active).length;

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [usersRes, rolesRes] = await Promise.all([apiFetch("/users"), apiFetch("/roles")]);
      if (!usersRes.ok) throw new Error("Failed to fetch users.");
      if (!rolesRes.ok) throw new Error("Failed to fetch roles.");
      const [usersData, rolesData] = await Promise.all([usersRes.json(), rolesRes.json()]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEdit = (u) => {
    setEditTarget(u);
    setEditForm({ full_name: u.full_name, email: u.email, role_id: String(u.role_id) });
    setError("");
    setSuccess("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const res = await apiFetch(`/users/${editTarget.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editForm.full_name,
          email: editForm.email,
          role_id: Number(editForm.role_id),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update user.");
      setSuccess(`${editForm.full_name} updated successfully.`);
      setEditTarget(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (u) => {
    if (u.is_active) {
      const confirmed = window.confirm(
        `Are you sure you want to disable ${u.full_name}? They will not be able to log in.`
      );
      if (!confirmed) return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await apiFetch(`/users/${u.user_id}/toggle-status`, { method: "PUT" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to toggle status.");
      const action = u.is_active ? "disabled" : "enabled";
      setSuccess(`${u.full_name} ${action} successfully.`);
      setUsers((prev) =>
        prev.map((existing) =>
          existing.user_id === u.user_id
            ? { ...existing, is_active: !existing.is_active }
            : existing
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const openAddUser = () => {
    setAddForm({ full_name: "", email: "", username: "", password: "", role_id: "" });
    setShowAddPassword(false);
    setError("");
    setSuccess("");
    setIsAddingUser(true);
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    try {
      const res = await apiFetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.full_name,
          email: addForm.email,
          username: addForm.username,
          password: addForm.password,
          role_id: Number(addForm.role_id),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create user.");
      setSuccess(`${addForm.full_name} created successfully.`);
      setIsAddingUser(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const isSelf = (u) => u.user_id === currentUser?.employee_id;

  return (
    <section className="page-section">
      <div className="section-heading users-heading">
        <div>
          <h2>User Management</h2>
          <p>Manage employee accounts and access levels.</p>
        </div>
        <button className="primary-action" type="button" onClick={openAddUser}>
          Add New User
        </button>
      </div>

      {success && <div className="notice success">{success}</div>}
      {error && <div className="notice error">{error}</div>}

      <div className="um-metrics">
        <article className="um-metric-card">
          <span className="um-metric-value">{totalEmployees}</span>
          <span className="um-metric-label">Total Employees</span>
        </article>
        <article className="um-metric-card">
          <span className="um-metric-value um-metric-value--green">{activeAccounts}</span>
          <span className="um-metric-label">Active Accounts</span>
        </article>
        <article className="um-metric-card">
          <span className="um-metric-value um-metric-value--red">{disabledAccounts}</span>
          <span className="um-metric-label">Disabled Accounts</span>
        </article>
      </div>

      <article className="panel table-panel">
        {isLoading ? (
          <div className="empty-state">Loading users...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8}>No users found.</td>
                </tr>
              ) : (
                users.map((u) => {
                  const self = isSelf(u);
                  return (
                    <tr key={u.user_id} className={self ? "um-self-row" : undefined}>
                      <td>{u.user_id}</td>
                      <td>
                        {u.full_name}
                        {self && <span className="um-you-badge">You</span>}
                      </td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={ROLE_BADGE_CLASS[u.role_name] || "role-badge"}>
                          {u.role_name}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.is_active ? "available" : "sold"}`}>
                          {u.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td>{formatLastLogin(u.last_login)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="table-action"
                            type="button"
                            onClick={() => openEdit(u)}
                            disabled={self}
                            title={self ? "Cannot modify your own account" : undefined}
                          >
                            Edit
                          </button>
                          <button
                            className={`table-action ${u.is_active ? "danger" : ""}`}
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={self}
                            title={self ? "Cannot modify your own account" : undefined}
                          >
                            {u.is_active ? "Disable" : "Enable"}
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

      {isAddingUser && (
        <div className="um-modal-overlay" onClick={() => setIsAddingUser(false)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title form-title-row">
              <div>
                <h3>Add New User</h3>
                <p>Create a new employee account.</p>
              </div>
              <button className="ghost-action" type="button" onClick={() => setIsAddingUser(false)}>
                Cancel
              </button>
            </div>
            <form className="um-edit-form" onSubmit={handleAddSubmit}>
              <label>
                Full Name
                <input
                  name="full_name"
                  type="text"
                  value={addForm.full_name}
                  onChange={handleAddChange}
                  placeholder="Jane Smith"
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={addForm.email}
                  onChange={handleAddChange}
                  placeholder="jane@showroom.com"
                  required
                />
              </label>
              <label>
                Username
                <input
                  name="username"
                  type="text"
                  value={addForm.username}
                  onChange={handleAddChange}
                  placeholder="min. 3 characters"
                  minLength={3}
                  required
                />
              </label>
              <label>
                Password
                <div className="um-password-wrap">
                  <input
                    name="password"
                    type={showAddPassword ? "text" : "password"}
                    value={addForm.password}
                    onChange={handleAddChange}
                    placeholder="min. 8 characters"
                    minLength={8}
                    required
                    className="um-password-input"
                  />
                  <button
                    type="button"
                    className="um-eye-btn"
                    onClick={() => setShowAddPassword((s) => !s)}
                    aria-label={showAddPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showAddPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>
              <label>
                Role
                <select name="role_id" value={addForm.role_id} onChange={handleAddChange} required>
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="um-modal-actions">
                <button className="ghost-action" type="button" onClick={() => setIsAddingUser(false)}>
                  Cancel
                </button>
                <button className="primary-action" type="submit" disabled={isCreating}>
                  {isCreating ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="um-modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title form-title-row">
              <div>
                <h3>Edit User</h3>
                <p>Update details for {editTarget.full_name}.</p>
              </div>
              <button className="ghost-action" type="button" onClick={() => setEditTarget(null)}>
                Cancel
              </button>
            </div>
            <form className="um-edit-form" onSubmit={handleEditSave}>
              <label>
                Full Name
                <input
                  name="full_name"
                  type="text"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
              </label>
              <label>
                Role
                <select name="role_id" value={editForm.role_id} onChange={handleEditChange} required>
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="um-modal-actions">
                <button className="ghost-action" type="button" onClick={() => setEditTarget(null)}>
                  Cancel
                </button>
                <button className="primary-action" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default UserManagementPage;
