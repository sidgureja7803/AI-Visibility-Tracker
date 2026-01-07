const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const config = require('../config');

/**
 * Storage Repository - Pure data access layer
 * No business logic, only CRUD operations
 * Uses async/await pattern for better error handling
 */

class StorageRepository {
    constructor() {
        // Initialize database with error handling
        try {
            const adapter = new FileSync(path.join(__dirname, '../data/db.json'));
            this.db = low(adapter);

            // Set defaults
            this.db.defaults({
                sessions: [],
                historicalData: [],
                scheduledJobs: []
            }).write();

            console.log('✅ Storage initialized');
        } catch (error) {
            console.error('❌ Failed to initialize storage:', error);
            throw error;
        }
    }

    // ============================================
    // Session Management
    // ============================================

    /**
     * Create a new session
     * @param {Object} session - Session data
     * @returns {Promise<Object>} Created session
     */
    async createSession(session) {
        try {
            const newSession = {
                ...session,
                createdAt: session.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await this.db.get('sessions')
                .push(newSession)
                .write();

            return newSession;
        } catch (error) {
            console.error('Error creating session:', error);
            throw new Error(`Failed to create session: ${error.message}`);
        }
    }

    /**
     * Get session by ID
     * @param {string} sessionId - Session ID
     * @returns {Promise<Object|null>} Session or null if not found
     */
    async getSessionById(sessionId) {
        try {
            const session = await this.db.get('sessions')
                .find({ id: sessionId })
                .value();

            return session || null;
        } catch (error) {
            console.error('Error getting session:', error);
            throw new Error(`Failed to get session: ${error.message}`);
        }
    }

    /**
     * Update session
     * @param {string} sessionId - Session ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object|null>} Updated session or null
     */
    async updateSession(sessionId, updates) {
        try {
            const session = await this.getSessionById(sessionId);

            if (!session) {
                return null;
            }

            await this.db.get('sessions')
                .find({ id: sessionId })
                .assign({
                    ...updates,
                    updatedAt: new Date().toISOString()
                })
                .write();

            return await this.getSessionById(sessionId);
        } catch (error) {
            console.error('Error updating session:', error);
            throw new Error(`Failed to update session: ${error.message}`);
        }
    }

    /**
     * Get all sessions
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of sessions
     */
    async getAllSessions(options = {}) {
        try {
            const { limit, offset = 0, status } = options;

            let query = this.db.get('sessions');

            if (status) {
                query = query.filter({ status });
            }

            query = query.orderBy(['createdAt'], ['desc']);

            if (offset > 0) {
                query = query.slice(offset);
            }

            if (limit) {
                query = query.slice(0, limit);
            }

            return query.value();
        } catch (error) {
            console.error('Error getting sessions:', error);
            throw new Error(`Failed to get sessions: ${error.message}`);
        }
    }

    /**
     * Delete session
     * @param {string} sessionId - Session ID
     * @returns {Promise<boolean>} True if deleted
     */
    async deleteSession(sessionId) {
        try {
            const removed = await this.db.get('sessions')
                .remove({ id: sessionId })
                .write();

            return removed.length > 0;
        } catch (error) {
            console.error('Error deleting session:', error);
            throw new Error(`Failed to delete session: ${error.message}`);
        }
    }

    // ============================================
    // Historical Data Management
    // ============================================

    /**
     * Save historical tracking data
     * @param {Object} data - Historical data
     * @returns {Promise<Object>} Saved data
     */
    async saveHistoricalData(data) {
        try {
            const historicalEntry = {
                id: this.generateUUID(),
                timestamp: new Date().toISOString(),
                category: data.category,
                brands: data.brands,
                brandStats: data.brandStats,
                summary: data.summary
            };

            await this.db.get('historicalData')
                .push(historicalEntry)
                .write();

            // Cleanup old data if enabled
            if (config.storage.autocleanupEnabled) {
                await this.cleanupOldHistoricalData();
            }

            return historicalEntry;
        } catch (error) {
            console.error('Error saving historical data:', error);
            throw new Error(`Failed to save historical data: ${error.message}`);
        }
    }

    /**
     * Get historical data with filters
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Historical data
     */
    async getHistoricalData(filters = {}) {
        try {
            const { category, brands, startDate, endDate, days } = filters;

            let query = this.db.get('historicalData');

            if (category) {
                query = query.filter({ category });
            }

            if (brands && Array.isArray(brands)) {
                query = query.filter(item =>
                    brands.every(brand => item.brands.includes(brand))
                );
            }

            if (days) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                query = query.filter(item =>
                    new Date(item.timestamp) >= cutoffDate
                );
            } else {
                if (startDate) {
                    query = query.filter(item =>
                        new Date(item.timestamp) >= new Date(startDate)
                    );
                }

                if (endDate) {
                    query = query.filter(item =>
                        new Date(item.timestamp) <= new Date(endDate)
                    );
                }
            }

            return query.orderBy(['timestamp'], ['asc']).value();
        } catch (error) {
            console.error('Error getting historical data:', error);
            throw new Error(`Failed to get historical data: ${error.message}`);
        }
    }

    /**
     * Cleanup old historical data
     * @returns {Promise<number>} Number of entries removed
     */
    async cleanupOldHistoricalData() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - config.storage.dataRetentionDays);

            const removed = await this.db.get('historicalData')
                .remove(item => new Date(item.timestamp) < cutoffDate)
                .write();

            if (removed.length > 0) {
                console.log(`🧹 Cleaned up ${removed.length} old historical entries`);
            }

            return removed.length;
        } catch (error) {
            console.error('Error cleaning up historical data:', error);
            return 0;
        }
    }

    // ============================================
    // Scheduled Jobs Management
    // ============================================

    /**
     * Save scheduled job
     * @param {Object} jobConfig - Job configuration
     * @returns {Promise<Object>} Saved job
     */
    async saveScheduledJob(jobConfig) {
        try {
            const job = {
                id: this.generateUUID(),
                ...jobConfig,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active'
            };

            await this.db.get('scheduledJobs')
                .push(job)
                .write();

            return job;
        } catch (error) {
            console.error('Error saving scheduled job:', error);
            throw new Error(`Failed to save scheduled job: ${error.message}`);
        }
    }

    /**
     * Get all active scheduled jobs
     * @returns {Promise<Array>} Active jobs
     */
    async getActiveScheduledJobs() {
        try {
            return await this.db.get('scheduledJobs')
                .filter({ status: 'active' })
                .value();
        } catch (error) {
            console.error('Error getting scheduled jobs:', error);
            throw new Error(`Failed to get scheduled jobs: ${error.message}`);
        }
    }

    /**
     * Get scheduled job by ID
     * @param {string} jobId - Job ID
     * @returns {Promise<Object|null>} Job or null
     */
    async getScheduledJobById(jobId) {
        try {
            const job = await this.db.get('scheduledJobs')
                .find({ id: jobId })
                .value();

            return job || null;
        } catch (error) {
            console.error('Error getting scheduled job:', error);
            throw new Error(`Failed to get scheduled job: ${error.message}`);
        }
    }

    /**
     * Update scheduled job
     * @param {string} jobId - Job ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object|null>} Updated job or null
     */
    async updateScheduledJob(jobId, updates) {
        try {
            const job = await this.getScheduledJobById(jobId);

            if (!job) {
                return null;
            }

            await this.db.get('scheduledJobs')
                .find({ id: jobId })
                .assign({
                    ...updates,
                    updatedAt: new Date().toISOString()
                })
                .write();

            return await this.getScheduledJobById(jobId);
        } catch (error) {
            console.error('Error updating scheduled job:', error);
            throw new Error(`Failed to update scheduled job: ${error.message}`);
        }
    }

    /**
     * Delete scheduled job (soft delete)
     * @param {string} jobId - Job ID
     * @returns {Promise<boolean>} True if deleted
     */
    async deleteScheduledJob(jobId) {
        try {
            const job = await this.updateScheduledJob(jobId, { status: 'deleted' });
            return job !== null;
        } catch (error) {
            console.error('Error deleting scheduled job:', error);
            throw new Error(`Failed to delete scheduled job: ${error.message}`);
        }
    }

    // ============================================
    // Utility Methods
    // ============================================

    /**
     * Generate UUID
     * @returns {string} UUID
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
     * @returns {Promise<Object>} Database statistics
     */
    async getStats() {
        try {
            const sessions = await this.db.get('sessions').value();
            const historicalData = await this.db.get('historicalData').value();
            const scheduledJobs = await this.db.get('scheduledJobs').value();

            return {
                sessions: {
                    total: sessions.length,
                    processing: sessions.filter(s => s.status === 'processing').length,
                    completed: sessions.filter(s => s.status === 'completed').length,
                    error: sessions.filter(s => s.status === 'error').length
                },
                historicalData: {
                    total: historicalData.length,
                    oldest: historicalData[0]?.timestamp,
                    newest: historicalData[historicalData.length - 1]?.timestamp
                },
                scheduledJobs: {
                    total: scheduledJobs.length,
                    active: scheduledJobs.filter(j => j.status === 'active').length,
                    deleted: scheduledJobs.filter(j => j.status === 'deleted').length
                }
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return null;
        }
    }
}

// Export singleton instance
module.exports = new StorageRepository();
