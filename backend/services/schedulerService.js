const cron = require('node-cron');
const { queue: trackingQueue, processTracking, isUsingQueue } = require('../queue/trackingQueue');
const storageService = require('./storageService');
const aiService = require('./aiService');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  // Schedule daily tracking
  scheduleDaily(config) {
    const { category, brands, competitors, mode, time } = config;
    
    // Default: run at 9 AM daily
    const cronExpression = time || '0 9 * * *';
    
    const jobId = storageService.saveScheduledJob({
      category,
      brands,
      competitors,
      mode,
      cronExpression,
      type: 'daily'
    }).id;

    const task = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Running scheduled tracking for: ${category}`);
      
      try {
        const sessionId = `scheduled-${Date.now()}`;
        const trackingData = {
          sessionId,
          category,
          brands,
          competitors,
          mode: mode || 'normal',
          scheduled: true
        };

        if (isUsingQueue() && trackingQueue) {
          const job = await trackingQueue.add(trackingData);
          console.log(`✅ Scheduled job ${job.id} added to queue`);
        } else {
          // Process directly if queue not available
          processTracking(trackingData).then((result) => {
            storageService.saveHistoricalData({
              category: result.category,
              brands: result.brands,
              results: result.results
            });
            console.log(`✅ Scheduled tracking completed directly for ${category}`);
          }).catch((error) => {
            console.error('Scheduled tracking error:', error);
          });
        }
      } catch (error) {
        console.error('Scheduler error:', error);
      }
    });

    this.jobs.set(jobId, task);
    
    console.log(`📅 Scheduled daily tracking for ${category} at ${cronExpression}`);
    
    return jobId;
  }

  // Schedule weekly tracking
  scheduleWeekly(config) {
    const { category, brands, competitors, mode, dayOfWeek, time } = config;
    
    // Default: run every Monday at 9 AM
    const day = dayOfWeek || 1;
    const cronExpression = `0 9 * * ${day}`;
    
    const jobId = storageService.saveScheduledJob({
      category,
      brands,
      competitors,
      mode,
      cronExpression,
      type: 'weekly'
    }).id;

    const task = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Running weekly tracking for: ${category}`);
      
      const sessionId = `scheduled-weekly-${Date.now()}`;
      const trackingData = {
        sessionId,
        category,
        brands,
        competitors,
        mode: mode || 'normal',
        scheduled: true
      };

      if (isUsingQueue() && trackingQueue) {
        await trackingQueue.add(trackingData);
      } else {
        processTracking(trackingData).then((result) => {
          storageService.saveHistoricalData({
            category: result.category,
            brands: result.brands,
            results: result.results
          });
        }).catch((error) => {
          console.error('Scheduled tracking error:', error);
        });
      }
    });

    this.jobs.set(jobId, task);
    
    return jobId;
  }

  // Cancel scheduled job
  cancelSchedule(jobId) {
    const task = this.jobs.get(jobId);
    if (task) {
      task.stop();
      this.jobs.delete(jobId);
      storageService.deleteScheduledJob(jobId);
      console.log(`🛑 Cancelled scheduled job: ${jobId}`);
      return true;
    }
    return false;
  }

  // Get all scheduled jobs
  getScheduledJobs() {
    return storageService.getScheduledJobs();
  }

  // Restore scheduled jobs on server restart
  restoreSchedules() {
    const scheduledJobs = storageService.getScheduledJobs();
    
    scheduledJobs.forEach(job => {
      const task = cron.schedule(job.cronExpression, async () => {
        const sessionId = `scheduled-${Date.now()}`;
        const trackingData = {
          sessionId,
          category: job.category,
          brands: job.brands,
          competitors: job.competitors,
          mode: job.mode || 'normal',
          scheduled: true
        };

        if (isUsingQueue() && trackingQueue) {
          await trackingQueue.add(trackingData);
        } else {
          processTracking(trackingData).then((result) => {
            storageService.saveHistoricalData({
              category: result.category,
              brands: result.brands,
              results: result.results
            });
          }).catch((error) => {
            console.error('Scheduled tracking error:', error);
          });
        }
      });

      this.jobs.set(job.id, task);
    });

    console.log(`♻️ Restored ${scheduledJobs.length} scheduled jobs`);
  }
}

module.exports = new SchedulerService();

