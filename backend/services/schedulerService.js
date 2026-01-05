const cron = require('node-cron');
const trackingQueue = require('../queue/trackingQueue');
const storageService = require('./storageService');

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
        // Add job to queue
        const job = await trackingQueue.add({
          sessionId: `scheduled-${Date.now()}`,
          category,
          brands,
          competitors,
          mode: mode || 'normal',
          scheduled: true
        });

        console.log(`✅ Scheduled job ${job.id} added to queue`);
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
      
      await trackingQueue.add({
        sessionId: `scheduled-weekly-${Date.now()}`,
        category,
        brands,
        competitors,
        mode: mode || 'normal',
        scheduled: true
      });
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
        await trackingQueue.add({
          sessionId: `scheduled-${Date.now()}`,
          category: job.category,
          brands: job.brands,
          competitors: job.competitors,
          mode: job.mode || 'normal',
          scheduled: true
        });
      });

      this.jobs.set(job.id, task);
    });

    console.log(`♻️ Restored ${scheduledJobs.length} scheduled jobs`);
  }
}

module.exports = new SchedulerService();

