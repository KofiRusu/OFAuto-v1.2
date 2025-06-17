import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Define queue names
export const QUEUE_NAMES = {
  MEDIA_PROCESSING: 'media-processing',
} as const;

// Media processing queue
export const mediaQueue = new Queue(QUEUE_NAMES.MEDIA_PROCESSING, {
  connection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600, // keep completed jobs for 1 hour
      count: 100, // keep last 100 completed jobs
    },
    removeOnFail: {
      age: 24 * 3600, // keep failed jobs for 24 hours
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Queue events for monitoring
export const mediaQueueEvents = new QueueEvents(QUEUE_NAMES.MEDIA_PROCESSING, {
  connection,
});

// Job types
export interface MediaProcessingJob {
  mediaId: string;
  taskId: string;
  type: 'process' | 'thumbnail' | 'watermark';
}

// Add job to queue
export async function addMediaProcessingJob(data: MediaProcessingJob) {
  return await mediaQueue.add('process-media', data, {
    priority: data.type === 'thumbnail' ? 1 : 0,
  });
}

// Queue monitoring
mediaQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`Job ${jobId} completed with result:`, returnvalue);
});

mediaQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} failed:`, failedReason);
});

// Clean up on exit
process.on('SIGTERM', async () => {
  await mediaQueue.close();
  await connection.quit();
}); 