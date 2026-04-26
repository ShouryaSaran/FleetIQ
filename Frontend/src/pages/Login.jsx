import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Login.css";

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

export default function Login() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ username: false, password: false });
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("rememberedUsername");
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {
      username: !username.trim(),
      password: !password.trim(),
    };
    setFieldErrors(errors);
    if (errors.username || errors.password) return;

    setError("");
    setSubmitting(true);

    try {
      const { user } = await login(username.trim(), password);

      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username.trim());
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      setToast(`Welcome back, ${user.name}!`);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
    } catch (err) {
      setError(err.message || "Invalid username or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {toast && (
        <div className="login-toast" role="status">
          {toast}
        </div>
      )}

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrap">
            <CarIcon />
          </div>
          <h1 className="login-title">Smart Vehicle IMS</h1>
          <p className="login-subtitle">Vehicle Showroom Management</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className={`login-field${fieldErrors.username ? " login-field--error" : ""}`}>
            <label htmlFor="username" className="login-label">
              Username
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <PersonIcon />
              </span>
              <input
                id="username"
                type="text"
                className="login-input"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors((f) => ({ ...f, username: false }));
                }}
                placeholder="Enter your username"
                autoComplete="username"
                disabled={submitting}
              />
            </div>
            {fieldErrors.username && (
              <span className="login-field-msg">Username is required</span>
            )}
          </div>

          <div className={`login-field${fieldErrors.password ? " login-field--error" : ""}`}>
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="login-input login-input--password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: false }));
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="login-field-msg">Password is required</span>
            )}
          </div>

          <div className="login-remember">
            <label className="login-remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={submitting}
              />
              <span>Remember me</span>
            </label>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="login-footer-note">
          New employee? Contact your manager to get registered.
        </p>
      </div>
    </div>
  );
}
