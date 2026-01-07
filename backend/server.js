require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const trackingRoutes = require('./routes/tracking');
const promptRoutes = require('./routes/prompts');
const schedulerRoutes = require('./routes/scheduler');
const schedulerService = require('./services/schedulerService');
const { isUsingQueue, getQueueStats } = require('./queue/trackingQueue');
const storageRepository = require('./repositories/storageRepository');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors({
  origin: config.cors.origins,
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/tracking', trackingRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/scheduler', schedulerRoutes);

// Health check with detailed stats
app.get('/api/health', async (req, res) => {
  try {
    const queueStats = await getQueueStats();
    const dbStats = await storageRepository.getStats();

    res.json({
      status: 'ok',
      message: 'AI Visibility Tracker API is running',
      timestamp: new Date().toISOString(),
      environment: config.server.env,
      mode: isUsingQueue() ? 'queued' : 'direct',
      queue: queueStats,
      database: dbStats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: config.server.isDevelopment ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.server.env}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);

  // Check for OpenAI API key
  if (!config.openai.apiKey) {
    console.log(`⚠️  WARNING: OPENAI_API_KEY not set. Please add it to your .env file.`);
    console.log(`   Get your API key from: https://platform.openai.com/api-keys`);
  } else {
    console.log(`✅ OpenAI API key configured`);
  }

  // Show execution mode (wait for Redis check to complete)
  setTimeout(() => {
    if (isUsingQueue()) {
      console.log(`✅ Queue mode: Using Redis for job processing`);
    } else {
      console.log(`⚡ Direct mode: Processing jobs immediately (Redis not required)`);
    }

    // Show configuration summary
    console.log(`📝 Configuration:`);
    console.log(`   - Parallel execution: ${config.processing.parallelExecutionEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   - Max concurrent requests: ${config.processing.maxConcurrentRequests}`);
    console.log(`   - Default prompts: ${config.processing.defaultPromptCount}`);
    console.log(`   - Rate limit delay: ${config.processing.rateLimitDelay}ms`);
  }, 2000);

  // Restore scheduled jobs on server start
  schedulerService.restoreSchedules();
  console.log(`📅 Scheduler service initialized`);
});


