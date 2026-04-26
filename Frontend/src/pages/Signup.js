import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import "./Signup.css";

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function getPasswordStrength(pwd) {
  if (!pwd) return null;
  const hasNumber = /[0-9]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const len = pwd.length;
  if (len >= 8 && hasNumber && hasUpper && (hasSpecial || len >= 12)) return "strong";
  if (len >= 8 && (hasNumber || hasUpper)) return "medium";
  return "weak";
}

const strengthLabel = { weak: "Weak", medium: "Medium", strong: "Strong" };

function validate(fields) {
  const { name, email, username, password, confirmPassword, roleId } = fields;
  const errors = {};

  if (!name.trim()) errors.name = "Full name is required";

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!username.trim()) {
    errors.username = "Username is required";
  } else if (username.trim().length < 3) {
    errors.username = "Username must be at least 3 characters";
  } else if (/\s/.test(username)) {
    errors.username = "Username cannot contain spaces";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (!/[0-9]/.test(password)) {
    errors.password = "Password must contain at least one number";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!roleId) errors.roleId = "Please select a role";

  return errors;
}

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/roles`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRoles(data);
        else setRolesError("Could not load roles.");
      })
      .catch(() => setRolesError("Could not load roles."))
      .finally(() => setRolesLoading(false));
  }, []);

  // Navigate to /login after success
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => navigate("/login", { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [successMsg, navigate]);

  function clearFieldError(field) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate({ name, email, username, password, confirmPassword, roleId });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setApiError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password,
          role_id: Number(roleId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed.");
      setSuccessMsg("Account created successfully. You can now log in.");
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const strength = getPasswordStrength(password);

  if (successMsg) {
    return (
      <div className="signup-page">
        <div className="signup-card signup-card--narrow">
          <div className="signup-header">
            <div className="signup-logo-wrap"><CarIcon /></div>
            <h1 className="signup-title">Smart Vehicle IMS</h1>
            <p className="signup-subtitle">Vehicle Showroom Management</p>
          </div>
          <div className="signup-success-view">
            <div className="signup-success-icon"><CheckCircleIcon /></div>
            <p className="signup-success-msg">{successMsg}</p>
            <p className="signup-redirect-hint">Redirecting to login…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-header">
          <div className="signup-logo-wrap"><CarIcon /></div>
          <h1 className="signup-title">Smart Vehicle IMS</h1>
          <p className="signup-subtitle">Vehicle Showroom Management</p>
          <p className="signup-tagline">Create your employee account</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>

          {/* ── Personal Information ── */}
          <div className="signup-section">
            <h2 className="signup-section-title">Personal Information</h2>
            <div className="signup-grid">

              <div className={`signup-field${fieldErrors.name ? " signup-field--error" : ""}`}>
                <label htmlFor="su-name" className="signup-label">Full Name</label>
                <input
                  id="su-name"
                  type="text"
                  className="signup-input"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  disabled={submitting}
                />
                {fieldErrors.name && <span className="signup-field-msg">{fieldErrors.name}</span>}
              </div>

              <div className={`signup-field${fieldErrors.email ? " signup-field--error" : ""}`}>
                <label htmlFor="su-email" className="signup-label">Email Address</label>
                <input
                  id="su-email"
                  type="email"
                  className="signup-input"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                  placeholder="jane@showroom.com"
                  autoComplete="email"
                  disabled={submitting}
                />
                {fieldErrors.email && <span className="signup-field-msg">{fieldErrors.email}</span>}
              </div>

            </div>
          </div>

          {/* ── Account Information ── */}
          <div className="signup-section">
            <h2 className="signup-section-title">Account Information</h2>
            <div className="signup-grid">

              <div className={`signup-field signup-field--span${fieldErrors.username ? " signup-field--error" : ""}`}>
                <label htmlFor="su-username" className="signup-label">Username</label>
                <input
                  id="su-username"
                  type="text"
                  className="signup-input"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearFieldError("username"); }}
                  placeholder="min. 3 characters, no spaces"
                  autoComplete="username"
                  disabled={submitting}
                />
                {fieldErrors.username && <span className="signup-field-msg">{fieldErrors.username}</span>}
              </div>

              {/* Password with strength bar */}
              <div className={`signup-field${fieldErrors.password ? " signup-field--error" : ""}`}>
                <label htmlFor="su-password" className="signup-label">Password</label>
                <div className="signup-input-wrap">
                  <input
                    id="su-password"
                    type={showPassword ? "text" : "password"}
                    className="signup-input signup-input--padded"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                    placeholder="min. 8 chars, one number"
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="signup-eye-btn"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {fieldErrors.password && <span className="signup-field-msg">{fieldErrors.password}</span>}
                {strength && (
                  <div className="signup-strength">
                    <div className="signup-strength-bar">
                      <div className={`signup-strength-fill signup-strength-fill--${strength}`} />
                    </div>
                    <span className={`signup-strength-label signup-strength-label--${strength}`}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className={`signup-field${fieldErrors.confirmPassword ? " signup-field--error" : ""}`}>
                <label htmlFor="su-confirm" className="signup-label">Confirm Password</label>
                <div className="signup-input-wrap">
                  <input
                    id="su-confirm"
                    type={showConfirm ? "text" : "password"}
                    className="signup-input signup-input--padded"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="signup-eye-btn"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <span className="signup-field-msg">{fieldErrors.confirmPassword}</span>}
              </div>

            </div>
          </div>

          {/* ── Role ── */}
          <div className="signup-section">
            <h2 className="signup-section-title">Role</h2>
            <div className={`signup-field${fieldErrors.roleId ? " signup-field--error" : ""}`}>
              <label htmlFor="su-role" className="signup-label">Select Role</label>
              {rolesError ? (
                <p className="signup-roles-error">{rolesError}</p>
              ) : (
                <select
                  id="su-role"
                  className={`signup-select${fieldErrors.roleId ? " signup-select--error" : ""}`}
                  value={roleId}
                  onChange={(e) => { setRoleId(e.target.value); clearFieldError("roleId"); }}
                  disabled={submitting || rolesLoading}
                >
                  <option value="">
                    {rolesLoading ? "Loading roles…" : "Select a role"}
                  </option>
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.roleId && <span className="signup-field-msg">{fieldErrors.roleId}</span>}
            </div>
          </div>

          {/* ── API Error ── */}
          {apiError && (
            <div className="signup-error" role="alert">{apiError}</div>
          )}

          <button type="submit" className="signup-btn" disabled={submitting || rolesLoading}>
            {submitting ? (
              <>
                <span className="signup-spinner" aria-hidden="true" />
                Creating Account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="signup-footer-note">
          Already have an account?{" "}
          <Link to="/login" className="signup-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
