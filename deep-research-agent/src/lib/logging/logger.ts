/**
 * Structured Logging Infrastructure
 *
 * Provides enterprise-grade logging with Winston for the Deep Research Agent.
 * Features:
 * - TOON-formatted structured logs (token-optimized)
 * - Multiple transports (console, file, session-specific)
 * - Log rotation (10MB per file, 5 files retained)
 * - Environment-aware log levels
 *
 * Uses TOON (Token-Oriented Object Notation) for file logs to minimize
 * token usage when logs are processed by LLMs. Console output remains
 * human-readable for development.
 */

import winston from "winston";
import { encode } from "@toon-format/toon";

export interface LogContext {
  sessionId?: string;
  agentId?: string;
  agentRole?: string;
  toolName?: string;
  phase?: string;
  [key: string]: unknown;
}

/**
 * Custom Winston format that encodes log entries as TOON
 * Reduces token usage by ~40% compared to JSON for LLM processing
 */
const toonFormat = winston.format.printf((info) => {
  try {
    // Structure log entry for TOON encoding with shortened keys
    const logEntry: Record<string, unknown> = {
      ts: info.timestamp,
      lvl: info.level,
      msg: info.message
    };

    // Add optional fields if present
    if (info.sessionId) logEntry.sid = info.sessionId;
    if (info.agentId) logEntry.aid = info.agentId;
    if (info.agentRole) logEntry.role = info.agentRole;
    if (info.toolName) logEntry.tool = info.toolName;
    if (info.error) logEntry.err = info.error;
    if (info.stack) logEntry.stack = info.stack;

    // Include any other context fields
    const excludedKeys = ["timestamp", "level", "message", "sessionId", "agentId", "agentRole", "toolName", "error", "stack", "splat", Symbol.for("level")];
    Object.keys(info).forEach(key => {
      if (!excludedKeys.includes(key) && key !== Symbol.for("level").toString()) {
        logEntry[key] = info[key];
      }
    });

    // Encode as TOON format
    return encode(logEntry);
  } catch (error) {
    // Fallback to JSON if TOON encoding fails
    return JSON.stringify(info);
  }
});

export class StructuredLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true })
      ),
      transports: [
        // Console (development) - human-readable
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File - all logs (TOON format)
        new winston.transports.File({
          filename: "logs/combined.log",
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          format: toonFormat
        }),
        // File - errors only (TOON format)
        new winston.transports.File({
          filename: "logs/errors.log",
          level: "error",
          maxsize: 10485760,
          maxFiles: 5,
          format: toonFormat
        })
        // Session-specific transports added dynamically via addSessionTransport()
      ]
    });
  }

  /**
   * Add a session-specific log file transport with TOON format
   */
  addSessionTransport(sessionId: string): void {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    this.logger.add(new winston.transports.File({
      filename: `logs/sessions/session_${sessionId}_${timestamp}.log`,
      format: toonFormat
    }));
  }

  /**
   * Log an informational message
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  /**
   * Log an error with stack trace
   */
  error(message: string, error: Error, context?: LogContext): void {
    this.logger.error(message, {
      ...context,
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Log a debug message (only if LOG_LEVEL=debug)
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }
}

// Singleton instance
export const logger = new StructuredLogger();
