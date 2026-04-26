const isDev = import.meta.env.MODE === "development";

const styles = {
  AUTH:  "color: #2563eb; font-weight: bold",
  API:   "color: #16a34a; font-weight: bold",
  ERROR: "color: #dc2626; font-weight: bold",
  ROLE:  "color: #7c3aed; font-weight: bold",
  NAV:   "color: #ea580c; font-weight: bold",
};

const log = (type, message, data) => {
  if (!isDev) return;
  const style = styles[type] || "";
  if (data !== undefined) {
    console.log(`%c[${type}]%c ${message}`, style, "", data);
  } else {
    console.log(`%c[${type}]%c ${message}`, style, "");
  }
};

const logger = {
  auth:  (message, data) => log("AUTH",  message, data),
  api:   (message, data) => log("API",   message, data),
  error: (message, data) => log("ERROR", message, data),
  role:  (message, data) => log("ROLE",  message, data),
  nav:   (message, data) => log("NAV",   message, data),
};

export default logger;
