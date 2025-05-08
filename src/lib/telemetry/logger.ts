import winston from 'winston';
// import winston-datadog from 'winston-datadog'; // Uncomment when using Datadog

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Create format for structured JSON logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

// Create format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.stack || ''}`
  )
);

// Define transports for logging
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/all.log',
    format: structuredFormat,
  }),
  // File transport for error logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: structuredFormat,
  }),
  
  // Datadog transport configuration (uncomment when using Datadog)
  /*
  new (winston-datadog)({
    apiKey: process.env.DD_API_KEY,
    hostname: process.env.DD_HOSTNAME || 'ofauto-service',
    service: 'ofauto-api',
    ddsource: 'nodejs',
    ddtags: `env:${process.env.NODE_ENV || 'development'}`,
  }),
  */
];

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// Export a middleware to log HTTP requests
export const httpLogger = (req, res, next) => {
  const startHrTime = process.hrtime();
  
  // Log when the response is finished
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(3);
    
    logger.http({
      message: `${req.method} ${req.originalUrl} ${res.statusCode}`,
      metadata: {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${elapsedTimeInMs}ms`,
        userAgent: req.get('user-agent') || '',
        ip: req.ip,
      },
    });
  });
  
  next();
};

// Helper function to add request context to logs
export function createContextualLogger(context = {}) {
  return {
    error: (message, meta = {}) => logger.error(message, { ...meta, ...context }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, ...context }),
    info: (message, meta = {}) => logger.info(message, { ...meta, ...context }),
    http: (message, meta = {}) => logger.http(message, { ...meta, ...context }),
    debug: (message, meta = {}) => logger.debug(message, { ...meta, ...context }),
  };
} 