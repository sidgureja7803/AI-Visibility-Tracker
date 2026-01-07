/**
 * Application-wide configuration management
 * Single source of truth for all configuration values
 */

const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 5001,
        env: process.env.NODE_ENV || 'development',
        isDevelopment: process.env.NODE_ENV !== 'production',
        isProduction: process.env.NODE_ENV === 'production'
    },

    // CORS configuration
    cors: {
        origins: [
            'http://localhost:3000',
            'https://ai-visibility-tracker-liart.vercel.app',
            process.env.FRONTEND_URL
        ].filter(Boolean),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // OpenAI configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 600,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
        timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000 // 30 seconds
    },

    // Redis configuration
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT) || 5000,
        enabled: process.env.REDIS_ENABLED !== 'false'
    },

    // Queue configuration
    queue: {
        maxAttempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS) || 3,
        backoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY) || 2000,
        removeOnComplete: process.env.QUEUE_REMOVE_ON_COMPLETE === 'true',
        removeOnFail: process.env.QUEUE_REMOVE_ON_FAIL === 'true'
    },

    // Processing configuration
    processing: {
        defaultPromptCount: parseInt(process.env.DEFAULT_PROMPT_COUNT) || 5,
        maxPromptCount: parseInt(process.env.MAX_PROMPT_COUNT) || 20,
        rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY) || 300, // ms between API calls
        parallelExecutionEnabled: process.env.PARALLEL_EXECUTION === 'true',
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 3
    },

    // Retry configuration
    retry: {
        maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS) || 3,
        baseDelay: parseInt(process.env.RETRY_BASE_DELAY) || 1000,
        maxDelay: parseInt(process.env.RETRY_MAX_DELAY) || 10000,
        timeout: parseInt(process.env.RETRY_TIMEOUT) || 30000
    },

    // Circuit breaker configuration
    circuitBreaker: {
        failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5,
        resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET) || 60000
    },

    // Storage configuration
    storage: {
        dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS) || 90,
        autocleanupEnabled: process.env.STORAGE_AUTOCLEANUP !== 'false'
    },

    // Validation
    validation: {
        maxBrandsPerTracking: parseInt(process.env.MAX_BRANDS_PER_TRACKING) || 10,
        maxCompetitorsPerTracking: parseInt(process.env.MAX_COMPETITORS_PER_TRACKING) || 5,
        minCategoryLength: parseInt(process.env.MIN_CATEGORY_LENGTH) || 2,
        maxCategoryLength: parseInt(process.env.MAX_CATEGORY_LENGTH) || 100
    }
};

// Validate critical configuration
function validateConfig() {
    const errors = [];

    if (!config.openai.apiKey) {
        errors.push('OPENAI_API_KEY is not configured');
    }

    if (config.server.isProduction && !process.env.FRONTEND_URL) {
        errors.push('FRONTEND_URL must be set in production');
    }

    if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach(error => console.error(`   - ${error}`));

        if (config.server.isProduction) {
            throw new Error('Invalid configuration in production environment');
        } else {
            console.warn('⚠️  Application may not function correctly');
        }
    }
}

// Run validation
validateConfig();

module.exports = config;
