const Queue = require('bull');
const trackingService = require('../services/trackingService');
const storageRepository = require('../repositories/storageRepository');
const config = require('../config');

/**
 * Queue Manager - Handles job queue infrastructure
 * Delegates business logic to services
 */

// Create tracking queue with Redis connection error handling
let trackingQueue = null;
let useQueue = false;

// Simple check if Redis is available before creating queue
const checkRedisAvailability = () => {
  return new Promise((resolve) => {
    const net = require('net');
    const client = net.createConnection({
      port: config.redis.port,
      host: config.redis.host
    });

    client.on('connect', () => {
      client.end();
      resolve(true);
    });

    client.on('error', () => {
      client.destroy();
      resolve(false);
    });

    // Timeout
    setTimeout(() => {
      client.destroy();
      resolve(false);
    }, config.redis.connectionTimeout);
  });
};

// Initialize queue only if Redis is available and enabled
const initQueue = async () => {
  if (!config.redis.enabled) {
    console.log('⚠️  Redis disabled in configuration - Using direct execution mode');
    return;
  }

  const redisAvailable = await checkRedisAvailability();

  if (redisAvailable) {
    try {
      trackingQueue = new Queue('ai-visibility-tracking', {
        redis: {
          port: config.redis.port,
          host: config.redis.host
        },
        defaultJobOptions: {
          attempts: config.queue.maxAttempts,
          backoff: {
            type: 'exponential',
            delay: config.queue.backoffDelay
          },
          removeOnComplete: config.queue.removeOnComplete,
          removeOnFail: config.queue.removeOnFail
        }
      });

      useQueue = true;
      console.log('✅ Redis connected - Queue mode enabled');

      // Set up event handlers
      setupQueueHandlers();

      // Set up job processor
      trackingQueue.process(async (job) => {
        return processTracking(job.data, (progress) => {
          job.progress(progress);
        });
      });

    } catch (error) {
      console.log('⚠️  Redis initialization failed - Using direct execution mode');
      trackingQueue = null;
      useQueue = false;
    }
  } else {
    console.log('⚠️  Redis not available - Using direct execution mode');
    trackingQueue = null;
    useQueue = false;
  }
};

/**
 * Setup queue event handlers
 */
function setupQueueHandlers() {
  if (!trackingQueue) return;

  trackingQueue.on('completed', async (job, result) => {
    console.log(`✅ Job ${job.id} completed for session ${result.sessionId}`);

    try {
      await trackingService.completeTracking(result.sessionId, result);

      // Update session with job completion
      await storageRepository.updateSession(result.sessionId, {
        jobId: job.id,
        status: 'completed'
      });
    } catch (error) {
      console.error(`Error updating completed job ${job.id}:`, error);
    }
  });

  trackingQueue.on('failed', async (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);

    try {
      const sessionId = job.data.sessionId;
      await trackingService.failTracking(sessionId, err);
    } catch (error) {
      console.error(`Error updating failed job ${job.id}:`, error);
    }
  });

  trackingQueue.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
  });

  trackingQueue.on('error', (error) => {
    console.error('Queue error:', error);
  });
}

/**
 * Core processing function (used by both queue and direct execution)
 * Delegates to trackingService for business logic
 */
async function processTracking(data, progressCallback) {
  const { sessionId } = data;

  try {
    // Delegate to service layer
    const result = await trackingService.executeTracking(data, progressCallback);
    return result;

  } catch (error) {
    console.error('Processing error:', error);
    throw error;
  }
}

// Initialize asynchronously
initQueue();

module.exports = {
  queue: trackingQueue,
  processTracking,
  isUsingQueue: () => useQueue && trackingQueue !== null,
  getQueueStats: async () => {
    if (!trackingQueue) return null;

    try {
      const [waiting, active, completed, failed] = await Promise.all([
        trackingQueue.getWaitingCount(),
        trackingQueue.getActiveCount(),
        trackingQueue.getCompletedCount(),
        trackingQueue.getFailedCount()
      ]);

      return { waiting, active, completed, failed };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return null;
    }
  }
};

