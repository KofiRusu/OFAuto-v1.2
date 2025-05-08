'use server';

import pino from "pino";

// Define log level based on environment
const level = process.env.NODE_ENV === "production" ? "info" : "debug";

// Define destination based on environment
// In production, logs should go to proper log collection; in development, to console
const transport = 
  process.env.NODE_ENV === "production"
    ? undefined // Use default transport in production (process.stdout)
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      };

// Create a base logger
const baseLogger = pino({
  level,
  transport,
  redact: {
    paths: [
      "password",
      "email",
      "access_token",
      "refresh_token",
      "credential",
      "apiKey",
      "apiSecret",
      "*.password",
      "*.credential",
      "*.apiKey",
      "*.apiSecret",
      "*.access_token",
      "*.refresh_token",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { env: process.env.NODE_ENV },
});

// Export a logger that automatically includes request identifiers when available
export const logger = baseLogger;

// Create a child logger for client-side logging (minimal logging)
export const clientLogger = {
  error: (message: string, ...args: any[]) => {
    // Only log critical errors on client-side in production
    if (typeof window !== "undefined") {
      if (process.env.NODE_ENV === "development") {
        console.error(message, ...args);
      } else {
        // In production, we might send critical errors to a monitoring service
        console.error(message);
      }
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn(message, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log(message, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.debug(message, ...args);
    }
  },
};

// Example usage (can be removed from final file):
// logger.debug({ event: "debug-event", data: { sensitive: "password123" } });
// logger.info({ event: "auth-success", userId: "user_123" });
// try {
//   throw new Error("Something broke");
// } catch (err) {
//   logger.error({ err }, "An error occurred during processing");
// } 