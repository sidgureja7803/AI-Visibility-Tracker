const aiService = require('./aiService');
const storageRepository = require('../repositories/storageRepository');
const config = require('../config');
const { sleep } = require('../utils/retry');

/**
 * Tracking Service - Business logic for tracking operations
 * Handles orchestration and business rules
 */

class TrackingService {
    /**
     * Start a new tracking session
     * @param {Object} params - Tracking parameters
     * @returns {Promise<Object>} Created session
     */
    async startTracking(params) {
        const { category, brands, competitors = [], mode = 'normal' } = params;

        // Validate inputs
        this.validateTrackingParams({ category, brands, competitors });

        // Create session
        const sessionId = aiService.generateUUID();
        const session = {
            id: sessionId,
            category,
            brands,
            competitors,
            mode,
            status: 'processing',
            progress: 0,
            results: null,
            jobId: null
        };

        await storageRepository.createSession(session);

        return {
            sessionId,
            category,
            brands,
            competitors,
            mode,
            status: 'processing'
        };
    }

    /**
     * Execute tracking (core business logic)
     * @param {Object} data - Tracking data
     * @param {Function} progressCallback - Progress callback
     * @returns {Promise<Object>} Tracking results
     */
    async executeTracking(data, progressCallback = null) {
        const { sessionId, category, brands, competitors = [], mode = 'normal' } = data;

        try {
            // Update progress: Starting
            await this.updateProgress(sessionId, 10, progressCallback);

            // Generate prompts
            const promptCount = config.processing.defaultPromptCount;
            const prompts = await aiService.generatePrompts(category, promptCount);

            await this.updateProgress(sessionId, 30, progressCallback);

            // Execute prompts (parallel or sequential based on config)
            const promptResults = config.processing.parallelExecutionEnabled
                ? await this.executePromptsParallel(prompts, brands, competitors, mode, sessionId, progressCallback)
                : await this.executePromptsSequential(prompts, brands, competitors, mode, sessionId, progressCallback);

            await this.updateProgress(sessionId, 90, progressCallback);

            // Calculate metrics
            const results = this.calculateMetrics(promptResults, brands, competitors);

            await this.updateProgress(sessionId, 100, progressCallback);

            return {
                sessionId,
                category,
                brands,
                competitors,
                mode,
                results,
                completedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Tracking execution error:', error);
            throw error;
        }
    }

    /**
     * Execute prompts in parallel (faster but more resource intensive)
     * @private
     */
    async executePromptsParallel(prompts, brands, competitors, mode, sessionId, progressCallback) {
        const results = [];
        const batchSize = config.processing.maxConcurrentRequests;

        for (let i = 0; i < prompts.length; i += batchSize) {
            const batch = prompts.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(prompt =>
                    aiService.queryWithTracking(prompt, brands, competitors, mode)
                )
            );

            results.push(...batchResults);

            // Update progress
            const progress = 30 + Math.floor(((i + batch.length) / prompts.length) * 50);
            await this.updateProgress(sessionId, progress, progressCallback);

            // Rate limiting between batches
            if (i + batchSize < prompts.length) {
                await sleep(config.processing.rateLimitDelay);
            }
        }

        return results;
    }

    /**
     * Execute prompts sequentially (safer, less resource intensive)
     * @private
     */
    async executePromptsSequential(prompts, brands, competitors, mode, sessionId, progressCallback) {
        const results = [];

        for (let i = 0; i < prompts.length; i++) {
            const prompt = prompts[i];

            const result = await aiService.queryWithTracking(
                prompt,
                brands,
                competitors,
                mode
            );

            results.push(result);

            // Update progress
            const progress = 30 + Math.floor(((i + 1) / prompts.length) * 50);
            await this.updateProgress(sessionId, progress, progressCallback);

            // Rate limiting
            if (i < prompts.length - 1) {
                await sleep(config.processing.rateLimitDelay);
            }
        }

        return results;
    }

    /**
     * Calculate tracking metrics
     * @private
     */
    calculateMetrics(promptResults, brands, competitors = []) {
        const allBrands = [...brands, ...competitors];
        const brandStats = {};

        // Initialize stats
        allBrands.forEach(brand => {
            brandStats[brand] = {
                totalMentions: 0,
                totalPrompts: promptResults.length,
                mentionedInPrompts: [],
                missingInPrompts: [],
                contexts: [],
                citedPages: [],
                citationShare: 0,
                visibilityScore: 0
            };
        });

        // Process results
        promptResults.forEach(result => {
            result.mentions.forEach(mention => {
                const stats = brandStats[mention.brand];
                if (stats) {
                    stats.totalMentions += mention.count;
                    stats.mentionedInPrompts.push(result.prompt);
                    stats.contexts.push(...mention.contexts);
                    if (mention.citations) {
                        stats.citedPages.push(...mention.citations);
                    }
                }
            });

            // Track missing brands
            const mentionedBrands = result.mentions.map(m => m.brand);
            allBrands.forEach(brand => {
                if (!mentionedBrands.includes(brand)) {
                    brandStats[brand].missingInPrompts.push(result.prompt);
                }
            });
        });

        // Calculate derived metrics
        const totalMentions = Object.values(brandStats).reduce(
            (sum, stats) => sum + stats.totalMentions,
            0
        );

        Object.keys(brandStats).forEach(brand => {
            const stats = brandStats[brand];
            stats.citationShare = totalMentions > 0
                ? ((stats.totalMentions / totalMentions) * 100).toFixed(2)
                : 0;
            stats.visibilityScore = (
                (stats.mentionedInPrompts.length / stats.totalPrompts) * 100
            ).toFixed(2);
            stats.citedPages = [...new Set(stats.citedPages)];
        });

        return {
            promptResults,
            brandStats,
            summary: {
                totalPrompts: promptResults.length,
                totalMentions,
                brandsTracked: brands.length,
                competitorsTracked: competitors.length
            }
        };
    }

    /**
     * Complete tracking session
     * @param {string} sessionId - Session ID
     * @param {Object} results - Tracking results
     */
    async completeTracking(sessionId, results) {
        // Update session
        await storageRepository.updateSession(sessionId, {
            status: 'completed',
            results: results.results,
            completedAt: results.completedAt,
            progress: 100
        });

        // Save to historical data
        await storageRepository.saveHistoricalData({
            category: results.category,
            brands: results.brands,
            brandStats: results.results.brandStats,
            summary: results.results.summary
        });

        console.log(`✅ Tracking completed for session ${sessionId}`);
    }

    /**
     * Mark tracking session as failed
     * @param {string} sessionId - Session ID
     * @param {Error} error - Error object
     */
    async failTracking(sessionId, error) {
        await storageRepository.updateSession(sessionId, {
            status: 'error',
            error: error.message,
            failedAt: new Date().toISOString()
        });

        console.error(`❌ Tracking failed for session ${sessionId}:`, error.message);
    }

    /**
     * Get tracking results
     * @param {string} sessionId - Session ID
     * @returns {Promise<Object>} Session data
     */
    async getTrackingResults(sessionId) {
        const session = await storageRepository.getSessionById(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        return session;
    }

    /**
     * Get all tracking sessions
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Sessions
     */
    async getAllSessions(options = {}) {
        return await storageRepository.getAllSessions(options);
    }

    /**
     * Get trend data
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Trend data
     */
    async getTrendData(params) {
        const { category, brand, days = 30 } = params;

        if (!category || !brand) {
            throw new Error('Category and brand are required');
        }

        const historicalData = await storageRepository.getHistoricalData({
            category,
            brands: [brand],
            days: parseInt(days)
        });

        const trends = historicalData.map(entry => ({
            date: entry.timestamp,
            visibilityScore: parseFloat(entry.brandStats[brand]?.visibilityScore || 0),
            citationShare: parseFloat(entry.brandStats[brand]?.citationShare || 0),
            totalMentions: entry.brandStats[brand]?.totalMentions || 0
        }));

        return {
            category,
            brand,
            days: parseInt(days),
            trends
        };
    }

    /**
     * Validate tracking parameters
     * @private
     */
    validateTrackingParams(params) {
        const { category, brands, competitors = [] } = params;

        if (!category || typeof category !== 'string') {
            throw new Error('Category must be a non-empty string');
        }

        if (category.length < config.validation.minCategoryLength ||
            category.length > config.validation.maxCategoryLength) {
            throw new Error(
                `Category length must be between ${config.validation.minCategoryLength} and ${config.validation.maxCategoryLength} characters`
            );
        }

        if (!Array.isArray(brands) || brands.length === 0) {
            throw new Error('At least one brand is required');
        }

        if (brands.length > config.validation.maxBrandsPerTracking) {
            throw new Error(`Maximum ${config.validation.maxBrandsPerTracking} brands allowed`);
        }

        if (competitors.length > config.validation.maxCompetitorsPerTracking) {
            throw new Error(`Maximum ${config.validation.maxCompetitorsPerTracking} competitors allowed`);
        }
    }

    /**
     * Update progress
     * @private
     */
    async updateProgress(sessionId, progress, callback) {
        await storageRepository.updateSession(sessionId, { progress });

        if (callback) {
            await callback(progress);
        }
    }
}

module.exports = new TrackingService();
