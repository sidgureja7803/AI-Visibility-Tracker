require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const trackingRoutes = require('./routes/tracking');
const promptRoutes = require('./routes/prompts');
const schedulerRoutes = require('./routes/scheduler');
const schedulerService = require('./services/schedulerService');
const { isUsingQueue } = require('./queue/trackingQueue');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/tracking', trackingRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/scheduler', schedulerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI Visibility Tracker API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
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
  }, 2000);
  
  // Restore scheduled jobs on server start
  schedulerService.restoreSchedules();
  console.log(`📅 Scheduler service initialized`);
});

