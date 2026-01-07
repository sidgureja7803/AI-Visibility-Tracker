const trackingService = require('../services/trackingService');
const { queue: trackingQueue, processTracking, isUsingQueue } = require('../queue/trackingQueue');

/**
 * Tracking Controller - Thin layer for HTTP handling
 * Delegates all business logic to services
 * Only handles request/response formatting and error responses
 */

const trackingController = {
  /**
   * Start a new tracking session
   * POST /api/tracking/start
   */
  async startTracking(req, res) {
    try {
      const { category, brands, competitors, mode } = req.body;

      // Start tracking (service handles validation)
      const session = await trackingService.startTracking({
        category,
        brands,
        competitors,
        mode
      });

      const { sessionId } = session;

      // Prepare tracking data
      const trackingData = {
        sessionId,
        category,
        brands,
        competitors: competitors || [],
        mode: mode || 'normal'
      };

      // Use queue if available, otherwise process directly
      if (isUsingQueue() && trackingQueue) {
        // Queue mode
        const job = await trackingQueue.add(trackingData);
        console.log(`📋 Job ${job.id} queued for session ${sessionId}`);
      } else {
        // Direct mode - process in background
        processTracking(trackingData, async (progress) => {
          // Progress callback is handled inside processTracking
        }).then(async (result) => {
          await trackingService.completeTracking(sessionId, result);
        }).catch(async (error) => {
          await trackingService.failTracking(sessionId, error);
        });
      }

      // Return immediate response
      res.json({
        sessionId,
        message: 'Tracking started',
        status: 'processing',
        mode: isUsingQueue() ? 'queued' : 'direct'
      });

    } catch (error) {
      console.error('Start tracking error:', error);

      // Send appropriate error response
      const statusCode = error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('Maximum') ? 400 : 500;

      res.status(statusCode).json({
        error: error.message,
        status: 'error'
      });
    }
  },

  /**
   * Get tracking results
   * GET /api/tracking/results/:sessionId
   */
  async getResults(req, res) {
    try {
      const { sessionId } = req.params;

      // Get session from service
      const session = await trackingService.getTrackingResults(sessionId);

      // If using queue, check job status
      if (session.status === 'processing' && session.jobId && isUsingQueue() && trackingQueue) {
        try {
          const job = await trackingQueue.getJob(session.jobId);

          if (job) {
            const state = await job.getState();

            if (state === 'completed') {
              const result = job.returnvalue;
              await trackingService.completeTracking(sessionId, result);
            } else if (state === 'failed') {
              await trackingService.failTracking(sessionId, new Error(job.failedReason));
            }
          }
        } catch (queueError) {
          console.log('Queue check error (non-critical):', queueError.message);
        }
      }

      // Get updated session
      const updatedSession = await trackingService.getTrackingResults(sessionId);

      res.json(updatedSession);

    } catch (error) {
      console.error('Get results error:', error);

      const statusCode = error.message === 'Session not found' ? 404 : 500;

      res.status(statusCode).json({
        error: error.message,
        status: 'error'
      });
    }
  },

  /**
   * Get all sessions
   * GET /api/tracking/sessions
   */
  async getSessions(req, res) {
    try {
      const { limit, offset, status } = req.query;

      const sessions = await trackingService.getAllSessions({
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : 0,
        status
      });

      res.json({
        sessions,
        count: sessions.length
      });

    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        error: error.message,
        status: 'error'
      });
    }
  },

  /**
   * Get trend data
   * GET /api/tracking/trends
   */
  async getTrends(req, res) {
    try {
      const { category, brand, days } = req.query;

      const trendData = await trackingService.getTrendData({
        category,
        brand,
        days
      });

      res.json(trendData);

    } catch (error) {
      console.error('Get trends error:', error);

      const statusCode = error.message.includes('required') ? 400 : 500;

      res.status(statusCode).json({
        error: error.message,
        status: 'error'
      });
    }
  }
};

module.exports = trackingController;
