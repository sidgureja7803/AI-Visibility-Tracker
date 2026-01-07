/**
 * Storage Service - Backwards compatibility wrapper
 * Delegates to the new repository layer
 * This file exists for backwards compatibility and will be deprecated
 */

const storageRepository = require('../repositories/storageRepository');

// Re-export all repository methods
const storageService = {
  // Session management
  saveSession: (session) => storageRepository.createSession(session),
  getSession: (sessionId) => storageRepository.getSessionById(sessionId),
  updateSession: (sessionId, updates) => storageRepository.updateSession(sessionId, updates),
  getAllSessions: () => storageRepository.getAllSessions(),

  // Historical data
  saveHistoricalData: (data) => storageRepository.saveHistoricalData(data),
  getHistoricalData: (category, brands, days) => storageRepository.getHistoricalData({
    category,
    brands,
    days
  }),
  getTrendData: (category, brandName, days) => {
    return storageRepository.getHistoricalData({
      category,
      brands: [brandName],
      days
    }).then(historicalData => {
      return historicalData.map(entry => ({
        date: entry.timestamp,
        visibilityScore: parseFloat(entry.brandStats[brandName]?.visibilityScore || 0),
        citationShare: parseFloat(entry.brandStats[brandName]?.citationShare || 0),
        totalMentions: entry.brandStats[brandName]?.totalMentions || 0
      }));
    });
  },

  // Scheduled jobs
  saveScheduledJob: (jobConfig) => storageRepository.saveScheduledJob(jobConfig),
  getScheduledJobs: () => storageRepository.getActiveScheduledJobs(),
  updateScheduledJob: (jobId, updates) => storageRepository.updateScheduledJob(jobId, updates),
  deleteScheduledJob: (jobId) => storageRepository.deleteScheduledJob(jobId),

  // Analytics
  getAnalytics: async (category) => {
    const sessions = await storageRepository.getAllSessions({ status: undefined });
    const categorySessions = sessions.filter(s => s.category === category);
    const totalSessions = categorySessions.length;
    const completedSessions = categorySessions.filter(s => s.status === 'completed').length;

    return {
      totalSessions,
      completedSessions,
      successRate: totalSessions > 0
        ? ((completedSessions / totalSessions) * 100).toFixed(2)
        : 0
    };
  }
};

module.exports = storageService;
