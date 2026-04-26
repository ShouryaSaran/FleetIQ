export const API_BASE_URL = "http://localhost:5000/api";

let tokenGetter = () => localStorage.getItem("authToken");
let unauthorizedHandler = null;

export const configureAuthHandlers = ({ getToken, logout } = {}) => {
  if (typeof getToken === "function") {
    tokenGetter = getToken;
  }

  if (typeof logout === "function") {
    unauthorizedHandler = logout;
  }
};

const buildUrl = (url) => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

export const apiFetch = async (url, options = {}) => {
  const token = tokenGetter();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(url), {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (unauthorizedHandler) {
      await unauthorizedHandler({ notifyServer: false });
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    }

    window.location.assign("/login");
  }

  return response;
};
