#!/usr/bin/env node

/**
 * Scheduler worker process
 * 
 * This worker polls the database for scheduled tasks and executes them.
 * It can be run as a separate process or integrated with the main application.
 */

import { SchedulerService } from "./scheduler-service";
import { PrismaClient } from "@prisma/client";

// Create a new prisma client for the worker
const prisma = new PrismaClient();

// Polling interval in milliseconds
const POLL_INTERVAL = process.env.SCHEDULER_POLL_INTERVAL 
  ? parseInt(process.env.SCHEDULER_POLL_INTERVAL) 
  : 60000; // Default to 1 minute

// Create and configure the scheduler service
const scheduler = SchedulerService.getInstance();

// Set up event handlers for logging
scheduler.on("polling:started", ({ interval }) => {
  console.log(`[WORKER] Scheduler polling started with interval ${interval}ms`);
});

scheduler.on("polling:stopped", () => {
  console.log("[WORKER] Scheduler polling stopped");
});

scheduler.on("polling:error", (error) => {
  console.error("[WORKER] Polling error:", error);
});

scheduler.on("tasks:polled", ({ count, tasks }) => {
  if (count > 0) {
    console.log(`[WORKER] Found ${count} tasks to execute: ${tasks.join(", ")}`);
  }
});

scheduler.on("task:executing", ({ taskId }) => {
  console.log(`[WORKER] Executing task ${taskId}`);
});

scheduler.on("task:executed", ({ taskId, success, result }) => {
  console.log(`[WORKER] Task ${taskId} executed ${success ? "successfully" : "with failure"}`);
  if (!success && result.error) {
    console.error(`[WORKER] Task error: ${result.error}`);
  }
});

scheduler.on("task:error", ({ taskId, error, retryCount, maxRetries, willRetry }) => {
  console.error(`[WORKER] Error executing task ${taskId}: ${error}`);
  console.log(`[WORKER] Retry ${retryCount}/${maxRetries}${willRetry ? ", will retry" : ", max retries reached"}`);
});

scheduler.on("task:window-expired", ({ taskId, scheduledAt }) => {
  console.log(`[WORKER] Task ${taskId} window expired, scheduled for ${scheduledAt}`);
});

// Graceful shutdown handler
const shutdown = async () => {
  console.log("[WORKER] Shutting down scheduler worker...");
  scheduler.stopPolling();
  
  // Wait for any pending tasks to complete (limited wait time)
  if (scheduler.getCurrentExecutionCount() > 0) {
    console.log(`[WORKER] Waiting for ${scheduler.getCurrentExecutionCount()} tasks to complete...`);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait max 5 seconds
  }
  
  // Close the database connection
  await prisma.$disconnect();
  
  console.log("[WORKER] Scheduler worker shut down successfully");
  process.exit(0);
};

// Set up signal handlers
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", (error) => {
  console.error("[WORKER] Uncaught exception:", error);
  shutdown();
});

// Start the worker
async function startWorker() {
  try {
    console.log("[WORKER] Starting scheduler worker...");
    
    // Verify database connection
    await prisma.$connect();
    console.log("[WORKER] Connected to database");
    
    // Start polling
    scheduler.startPolling(POLL_INTERVAL);
    console.log(`[WORKER] Scheduler worker started with poll interval of ${POLL_INTERVAL}ms`);
    
  } catch (error) {
    console.error("[WORKER] Failed to start scheduler worker:", error);
    process.exit(1);
  }
}

// Start the worker if this file is executed directly
if (require.main === module) {
  startWorker();
}

export { startWorker }; 