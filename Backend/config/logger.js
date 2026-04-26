const { createLogger, format, transports } = require("winston");

const { combine, timestamp, colorize, printf } = format;

const isDev = process.env.NODE_ENV === "development";

const logFormat = printf(({ level, message, timestamp: ts }) => {
  return `${ts} [${level}] ${message}`;
});

const logger = createLogger({
  level: isDev ? "debug" : "info",
  format: combine(
    timestamp({ format: "HH:mm:ss" }),
    colorize(),
    logFormat
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
