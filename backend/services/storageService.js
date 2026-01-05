const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// Initialize database
const adapter = new FileSync(path.join(__dirname, '../data/db.json'));
const db = low(adapter);

// Set defaults
db.defaults({
  sessions: [],
  historicalData: [],
  scheduledJobs: []
}).write();

const storageService = {
  // Session management
  saveSession(session) {
    db.get('sessions')
      .push({
        ...session,
        createdAt: session.createdAt || new Date().toISOString()
      })
      .write();
    return session;
  },

  getSession(sessionId) {
    return db.get('sessions')
      .find({ id: sessionId })
      .value();
  },

  updateSession(sessionId, updates) {
    db.get('sessions')
      .find({ id: sessionId })
      .assign({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .write();
    return this.getSession(sessionId);
  },

  getAllSessions() {
    return db.get('sessions')
      .orderBy(['createdAt'], ['desc'])
      .value();
  },

  // Historical data for trends
  saveHistoricalData(data) {
    const historicalEntry = {
      id: aiService.generateUUID(),
      timestamp: new Date().toISOString(),
      category: data.category,
      brands: data.brands,
      brandStats: data.results.brandStats,
      summary: data.results.summary
    };

    db.get('historicalData')
      .push(historicalEntry)
      .write();

    // Keep only last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    db.get('historicalData')
      .remove(item => new Date(item.timestamp) < ninetyDaysAgo)
      .write();

    return historicalEntry;
  },

  getHistoricalData(category, brands, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db.get('historicalData')
      .filter(item => {
        const matchesCategory = item.category === category;
        const matchesBrands = brands.every(brand => item.brands.includes(brand));
        const withinTimeRange = new Date(item.timestamp) >= startDate;
        return matchesCategory && matchesBrands && withinTimeRange;
      })
      .orderBy(['timestamp'], ['asc'])
      .value();
  },

  getTrendData(category, brandName, days = 30) {
    const historicalData = this.getHistoricalData(category, [brandName], days);
    
    return historicalData.map(entry => ({
      date: entry.timestamp,
      visibilityScore: parseFloat(entry.brandStats[brandName]?.visibilityScore || 0),
      citationShare: parseFloat(entry.brandStats[brandName]?.citationShare || 0),
      totalMentions: entry.brandStats[brandName]?.totalMentions || 0
    }));
  },

  // Scheduled jobs management
  saveScheduledJob(jobConfig) {
    const job = {
      id: aiService.generateUUID(),
      ...jobConfig,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    db.get('scheduledJobs')
      .push(job)
      .write();

    return job;
  },

  getScheduledJobs() {
    return db.get('scheduledJobs')
      .filter({ status: 'active' })
      .value();
  },

  updateScheduledJob(jobId, updates) {
    db.get('scheduledJobs')
      .find({ id: jobId })
      .assign({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .write();
  },

  deleteScheduledJob(jobId) {
    db.get('scheduledJobs')
      .find({ id: jobId })
      .assign({ status: 'deleted' })
      .write();
  },

  // Analytics
  getAnalytics(category) {
    const sessions = db.get('sessions')
      .filter({ category })
      .value();

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;

    return {
      totalSessions,
      completedSessions,
      successRate: totalSessions > 0 
        ? ((completedSessions / totalSessions) * 100).toFixed(2)
        : 0
    };
  }
};

// Import aiService for UUID generation
const aiService = require('./aiService');

module.exports = storageService;

