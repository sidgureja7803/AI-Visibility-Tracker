const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');

// Schedule daily tracking
router.post('/schedule/daily', (req, res) => {
  try {
    const { category, brands, competitors, mode, time } = req.body;

    if (!category || !brands) {
      return res.status(400).json({
        error: 'Category and brands are required'
      });
    }

    const jobId = schedulerService.scheduleDaily({
      category,
      brands,
      competitors,
      mode,
      time
    });

    res.json({
      jobId,
      message: 'Daily tracking scheduled successfully',
      schedule: 'Daily at ' + (time || '9:00 AM')
    });

  } catch (error) {
    console.error('Schedule daily error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Schedule weekly tracking
router.post('/schedule/weekly', (req, res) => {
  try {
    const { category, brands, competitors, mode, dayOfWeek, time } = req.body;

    if (!category || !brands) {
      return res.status(400).json({
        error: 'Category and brands are required'
      });
    }

    const jobId = schedulerService.scheduleWeekly({
      category,
      brands,
      competitors,
      mode,
      dayOfWeek,
      time
    });

    res.json({
      jobId,
      message: 'Weekly tracking scheduled successfully'
    });

  } catch (error) {
    console.error('Schedule weekly error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all scheduled jobs
router.get('/schedules', (req, res) => {
  try {
    const jobs = schedulerService.getScheduledJobs();
    res.json(jobs);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel scheduled job
router.delete('/schedule/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = schedulerService.cancelSchedule(jobId);

    if (cancelled) {
      res.json({ message: 'Schedule cancelled successfully' });
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }

  } catch (error) {
    console.error('Cancel schedule error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

