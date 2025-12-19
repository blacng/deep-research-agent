/**
 * Memory Monitor - Resource usage tracking
 *
 * Tracks memory usage per agent and detects resource pressure.
 * Features:
 * - Periodic memory snapshots
 * - Per-agent memory baselines and deltas
 * - Peak memory tracking
 * - Memory pressure detection (>75% warning, >90% critical)
 */

import { logger } from "../logging/logger";

export interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  agentId?: string;
}

export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private intervalId?: NodeJS.Timeout;
  private agentMemoryBaseline: Map<string, number> = new Map();

  /**
   * Start periodic memory monitoring
   *
   * @param intervalMs - Interval in milliseconds (default: 5000ms = 5s)
   */
  startMonitoring(intervalMs: number = 5000): void {
    this.intervalId = setInterval(() => {
      this.captureSnapshot();
    }, intervalMs);

    logger.info("Memory monitoring started", { intervalMs });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info("Memory monitoring stopped");
    }
  }

  /**
   * Capture a memory snapshot
   */
  captureSnapshot(agentId?: string): MemorySnapshot {
    const usage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      agentId
    };

    this.snapshots.push(snapshot);

    // Keep only last 100 snapshots to avoid memory bloat
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Record baseline memory before agent starts
   */
  recordAgentStart(agentId: string): void {
    const snapshot = this.captureSnapshot(agentId);
    this.agentMemoryBaseline.set(agentId, snapshot.heapUsed);

    logger.debug("Agent memory baseline recorded", {
      agentId,
      heapUsed: (snapshot.heapUsed / 1024 / 1024).toFixed(2) + " MB"
    });
  }

  /**
   * Calculate memory delta for agent
   */
  recordAgentEnd(agentId: string): number | null {
    const baseline = this.agentMemoryBaseline.get(agentId);
    if (!baseline) return null;

    const snapshot = this.captureSnapshot(agentId);
    const delta = snapshot.heapUsed - baseline;

    logger.info("Agent memory usage", {
      agentId,
      memoryDelta: (delta / 1024 / 1024).toFixed(2) + " MB",
      finalHeapUsed: (snapshot.heapUsed / 1024 / 1024).toFixed(2) + " MB"
    });

    return delta;
  }

  /**
   * Get peak memory usage from all snapshots
   */
  getPeakMemory(): MemorySnapshot | null {
    if (this.snapshots.length === 0) return null;

    return this.snapshots.reduce((peak, snapshot) =>
      snapshot.heapUsed > peak.heapUsed ? snapshot : peak
    );
  }

  /**
   * Check if memory usage is critical
   */
  checkMemoryPressure(): { critical: boolean; warningMessage?: string } {
    const snapshot = this.captureSnapshot();
    const heapUsagePercent = (snapshot.heapUsed / snapshot.heapTotal) * 100;

    if (heapUsagePercent > 90) {
      const message = `Critical memory usage: ${heapUsagePercent.toFixed(1)}%`;
      logger.error(message, new Error("Memory pressure detected"), {
        heapUsed: snapshot.heapUsed,
        heapTotal: snapshot.heapTotal
      });
      return { critical: true, warningMessage: message };
    }

    if (heapUsagePercent > 75) {
      const message = `High memory usage: ${heapUsagePercent.toFixed(1)}%`;
      logger.warn(message, {
        heapUsed: snapshot.heapUsed,
        heapTotal: snapshot.heapTotal
      });
    }

    return { critical: false };
  }

  /**
   * Log final memory report for the session
   */
  logMemoryReport(sessionId: string): void {
    const peak = this.getPeakMemory();
    if (!peak) return;

    logger.info("Session memory report", {
      sessionId,
      peakHeapUsed: (peak.heapUsed / 1024 / 1024).toFixed(2) + " MB",
      peakRSS: (peak.rss / 1024 / 1024).toFixed(2) + " MB",
      snapshotCount: this.snapshots.length
    });
  }
}
