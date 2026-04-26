import { createContext, createElement, useCallback, useEffect, useMemo, useReducer } from "react";
import { API_BASE_URL, configureAuthHandlers } from "../utils/api";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthContext = createContext(null);

const getAuthIdFromToken = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.auth_id;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");

    if (storedToken && storedUser) {
      try {
        dispatch({
          type: "LOGIN",
          payload: {
            token: storedToken,
            user: JSON.parse(storedUser),
          },
        });
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        dispatch({ type: "LOGOUT" });
      }

      return;
    }

    dispatch({ type: "SET_LOADING", payload: false });
  }, []);

  const getToken = useCallback(() => {
    return state.token || localStorage.getItem("authToken");
  }, [state.token]);

  const login = useCallback(async (username, password) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      const user = {
        employee_id: data.employee_id,
        username: data.username,
        name: data.name,
        email: data.email,
        role_name: data.role_name,
      };

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(user));

      dispatch({
        type: "LOGIN",
        payload: {
          token: data.token,
          user,
        },
      });

      return { token: data.token, user };
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  }, []);

  const logout = useCallback(
    async ({ notifyServer = true } = {}) => {
      const token = getToken();
      const authId = token ? getAuthIdFromToken(token) : null;

      if (notifyServer && authId) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ auth_id: authId }),
          });
        } catch {
          // Local logout should still complete if the server is unavailable.
        }
      }

      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      dispatch({ type: "LOGOUT" });
    },
    [getToken]
  );

  useEffect(() => {
    configureAuthHandlers({ getToken, logout });
  }, [getToken, logout]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      getToken,
    }),
    [state, login, logout, getToken]
  );

  return createElement(AuthContext.Provider, { value }, children);
}
