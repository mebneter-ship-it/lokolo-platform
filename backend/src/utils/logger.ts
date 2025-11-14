/**
 * Simple logging utility
 * In production, you might want to use Winston or Pino
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const shouldLog = (level: LogLevel): boolean => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production' && level === LogLevel.DEBUG) {
    return false;
  }
  
  return true;
};

const formatMessage = (level: LogLevel, message: string, meta?: any): string => {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaString}`;
};

export const logger = {
  debug: (message: string, meta?: any) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.debug(formatMessage(LogLevel.DEBUG, message, meta));
    }
  },

  info: (message: string, meta?: any) => {
    if (shouldLog(LogLevel.INFO)) {
      console.info(formatMessage(LogLevel.INFO, message, meta));
    }
  },

  warn: (message: string, meta?: any) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(formatMessage(LogLevel.WARN, message, meta));
    }
  },

  error: (message: string, meta?: any) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(formatMessage(LogLevel.ERROR, message, meta));
    }
  },
};
