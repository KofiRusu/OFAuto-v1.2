import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { QUEUE_NAMES, MediaProcessingJob } from '@/lib/queue';
import { mediaProcessingService } from '@/lib/services/mediaProcessingService';

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Create worker
const mediaWorker = new Worker<MediaProcessingJob>(
  QUEUE_NAMES.MEDIA_PROCESSING,
  async (job: Job<MediaProcessingJob>) => {
    console.log(`Processing job ${job.id} for media ${job.data.mediaId}`);
    
    try {
      const result = await mediaProcessingService.processMediaTask({
        mediaId: job.data.mediaId,
        taskId: job.data.taskId,
      });

      // Update job progress
      await job.updateProgress(100);
      
      return result;
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.MEDIA_WORKER_CONCURRENCY || '2'),
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  }
);

// Worker event handlers
mediaWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

mediaWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

mediaWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down media worker...');
  await mediaWorker.close();
  await connection.quit();
});

// Start message
console.log('Media processor worker started');

// Export for testing
export { mediaWorker }; 