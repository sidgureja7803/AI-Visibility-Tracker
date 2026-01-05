const aiService = require('../services/aiService');
const { queue: trackingQueue, processTracking, isUsingQueue } = require('../queue/trackingQueue');
const storageService = require('../services/storageService');

const trackingController = {
  async startTracking(req, res) {
    try {
      const { category, brands, competitors, mode } = req.body;

      if (!category || !brands || brands.length === 0) {
        return res.status(400).json({ 
          error: 'Category and at least one brand are required' 
        });
      }

      const sessionId = aiService.generateUUID();
      const session = {
        id: sessionId,
        category,
        brands,
        competitors: competitors || [],
        mode: mode || 'normal',
        createdAt: new Date().toISOString(),
        status: 'processing',
        results: null,
        jobId: null
      };

      storageService.saveSession(session);

      const trackingData = {
        sessionId,
        category,
        brands,
        competitors,
        mode
      };

      // Use queue if Redis is available, otherwise process directly
      if (isUsingQueue() && trackingQueue) {
        const job = await trackingQueue.add(trackingData);
        
        storageService.updateSession(sessionId, {
          jobId: job.id,
          status: 'processing'
        });
      } else {
        // Process directly in background without queue
        processTracking(trackingData, async (progress) => {
          storageService.updateSession(sessionId, { progress });
        }).then((result) => {
          storageService.updateSession(sessionId, {
            status: 'completed',
            results: result.results,
            completedAt: result.completedAt
          });

          // Save to historical data
          storageService.saveHistoricalData({
            category: result.category,
            brands: result.brands,
            results: result.results
          });
          
          console.log(`✅ Direct processing completed for session ${sessionId}`);
        }).catch((error) => {
          console.error(`❌ Direct processing failed for session ${sessionId}:`, error);
          storageService.updateSession(sessionId, {
            status: 'error',
            error: error.message
          });
        });
      }

      res.json({
        sessionId,
        message: 'Tracking started',
        status: 'processing',
        mode: isUsingQueue() ? 'queued' : 'direct'
      });

    } catch (error) {
      console.error('Start tracking error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getResults(req, res) {
    try {
      const { sessionId } = req.params;
      const session = storageService.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check job status if still processing via queue
      if (session.status === 'processing' && session.jobId && isUsingQueue() && trackingQueue) {
        try {
          const job = await trackingQueue.getJob(session.jobId);
          if (job) {
            const state = await job.getState();
            const progress = job.progress();

            if (state === 'completed') {
              const result = job.returnvalue;
              storageService.updateSession(sessionId, {
                status: 'completed',
                results: result.results,
                completedAt: result.completedAt
              });

              // Save to historical data
              storageService.saveHistoricalData({
                category: result.category,
                brands: result.brands,
                results: result.results
              });
            } else if (state === 'failed') {
              storageService.updateSession(sessionId, {
                status: 'error',
                error: job.failedReason
              });
            } else {
              storageService.updateSession(sessionId, {
                progress: progress
              });
            }
          }
        } catch (queueError) {
          console.log('Queue check error (non-critical):', queueError.message);
        }
      }

      const updatedSession = storageService.getSession(sessionId);
      res.json(updatedSession);

    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getSessions(req, res) {
    try {
      const allSessions = storageService.getAllSessions();
      res.json(allSessions);

    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getTrends(req, res) {
    try {
      const { category, brand, days } = req.query;

      if (!category || !brand) {
        return res.status(400).json({
          error: 'Category and brand are required'
        });
      }

      const trendData = storageService.getTrendData(
        category,
        brand,
        parseInt(days) || 30
      );

      res.json({
        category,
        brand,
        days: parseInt(days) || 30,
        trends: trendData
      });

    } catch (error) {
      console.error('Get trends error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = trackingController;

