/**
 * In-Memory Storage Repository
 * 
 * NO JSON FILES! NO DISK I/O! NO BLOCKING!
 * 
 * All data stored in JavaScript Maps/Arrays in RAM:
 * - Fast (no disk I/O)
 * - Safe (single-threaded JavaScript)
 * - Simple (no file management)
 * - Scales better for temporary tracking sessions
 * 
 * Note: Data is lost on server restart (which is fine for tracking sessions)
 * If you need persistence, use PostgreSQL or MongoDB instead
 */

class StorageRepository {
    constructor() {
        // In-memory storage using Maps for O(1) lookup
        this.sessions = new Map();
        this.historicalData = [];
        this.scheduledJobs = new Map();

        console.log('✅ In-memory storage initialized (no JSON files!)');
    }

    // ============================================
    // Session Management
    // ============================================

    /**
     * Create a new session
     */
    async createSession(session) {
        const newSession = {
            ...session,
            createdAt: session.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.sessions.set(newSession.id, newSession);
        return newSession;
    }

    /**
     * Get session by ID
     */
    async getSessionById(sessionId) {
        return this.sessions.get(sessionId) || null;
    }

    /**
     * Update session
     */
    async updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);

        if (!session) {
            return null;
        }

        const updatedSession = {
            ...session,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.sessions.set(sessionId, updatedSession);
        return updatedSession;
    }

    /**
     * Get all sessions
     */
    async getAllSessions(options = {}) {
        const { limit, offset = 0, status } = options;

        // Convert Map to Array
        let sessions = Array.from(this.sessions.values());

        // Filter by status if provided
        if (status) {
            sessions = sessions.filter(s => s.status === status);
        }

        // Sort by creation date (newest first)
        sessions.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Apply offset and limit
        if (offset > 0) {
            sessions = sessions.slice(offset);
        }

        if (limit) {
            sessions = sessions.slice(0, limit);
        }

        return sessions;
    }

    /**
     * Delete session
     */
    async deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }

    // ============================================
    // Historical Data Management
    // ============================================

    /**
     * Save historical tracking data
     */
    async saveHistoricalData(data) {
        const historicalEntry = {
            id: this.generateUUID(),
            timestamp: new Date().toISOString(),
            category: data.category,
            brands: data.brands,
            brandStats: data.brandStats,
            summary: data.summary
        };

        this.historicalData.push(historicalEntry);

        // Auto-cleanup: Keep only last 90 days in memory
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        this.historicalData = this.historicalData.filter(
            item => new Date(item.timestamp) >= ninetyDaysAgo
        );

        return historicalEntry;
    }

    /**
     * Get historical data with filters
     */
    async getHistoricalData(filters = {}) {
        const { category, brands, startDate, endDate, days } = filters;

        let filtered = [...this.historicalData];

        // Filter by category
        if (category) {
            filtered = filtered.filter(item => item.category === category);
        }

        // Filter by brands
        if (brands && Array.isArray(brands)) {
            filtered = filtered.filter(item =>
                brands.every(brand => item.brands.includes(brand))
            );
        }

        // Filter by date range
        if (days) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            filtered = filtered.filter(
                item => new Date(item.timestamp) >= cutoffDate
            );
        } else {
            if (startDate) {
                filtered = filtered.filter(
                    item => new Date(item.timestamp) >= new Date(startDate)
                );
            }

            if (endDate) {
                filtered = filtered.filter(
                    item => new Date(item.timestamp) <= new Date(endDate)
                );
            }
        }

        // Sort by timestamp
        filtered.sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        return filtered;
    }

    /**
     * Cleanup old historical data
     */
    async cleanupOldHistoricalData() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);

        const originalLength = this.historicalData.length;

        this.historicalData = this.historicalData.filter(
            item => new Date(item.timestamp) >= cutoffDate
        );

        const removed = originalLength - this.historicalData.length;

        if (removed > 0) {
            console.log(`🧹 Cleaned up ${removed} old historical entries from memory`);
        }

        return removed;
    }

    // ============================================
    // Scheduled Jobs Management
    // ============================================

    /**
     * Save scheduled job
     */
    async saveScheduledJob(jobConfig) {
        const job = {
            id: this.generateUUID(),
            ...jobConfig,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        };

        this.scheduledJobs.set(job.id, job);
        return job;
    }

    /**
     * Get all active scheduled jobs
     */
    async getActiveScheduledJobs() {
        return Array.from(this.scheduledJobs.values())
            .filter(job => job.status === 'active');
    }

    /**
     * Get scheduled job by ID
     */
    async getScheduledJobById(jobId) {
        return this.scheduledJobs.get(jobId) || null;
    }

    /**
     * Update scheduled job
     */
    async updateScheduledJob(jobId, updates) {
        const job = this.scheduledJobs.get(jobId);

        if (!job) {
            return null;
        }

        const updatedJob = {
            ...job,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.scheduledJobs.set(jobId, updatedJob);
        return updatedJob;
    }

    /**
     * Delete scheduled job (soft delete)
     */
    async deleteScheduledJob(jobId) {
        const job = this.scheduledJobs.get(jobId);

        if (!job) {
            return false;
        }

        const updatedJob = {
            ...job,
            status: 'deleted',
            updatedAt: new Date().toISOString()
        };

        this.scheduledJobs.set(jobId, updatedJob);
        return true;
    }

    // ============================================
    // Utility Methods
    // ============================================

    /**
     * Generate UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get database statistics
     */
    async getStats() {
        const sessions = Array.from(this.sessions.values());
        const jobs = Array.from(this.scheduledJobs.values());

        return {
            sessions: {
                total: sessions.length,
                processing: sessions.filter(s => s.status === 'processing').length,
                completed: sessions.filter(s => s.status === 'completed').length,
                error: sessions.filter(s => s.status === 'error').length
            },
            historicalData: {
                total: this.historicalData.length,
                oldest: this.historicalData[0]?.timestamp,
                newest: this.historicalData[this.historicalData.length - 1]?.timestamp
            },
            scheduledJobs: {
                total: jobs.length,
                active: jobs.filter(j => j.status === 'active').length,
                deleted: jobs.filter(j => j.status === 'deleted').length
            },
            storage: {
                type: 'in-memory',
                persistent: false,
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 + ' MB'
            }
        };
    }

    /**
     * Clear all data (useful for testing)
     */
    async clearAll() {
        this.sessions.clear();
        this.historicalData = [];
        this.scheduledJobs.clear();
        console.log('🧹 All in-memory data cleared');
    }
}

// Export singleton instance
module.exports = new StorageRepository();
