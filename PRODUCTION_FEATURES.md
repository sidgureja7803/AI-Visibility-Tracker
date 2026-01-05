# Production Features

## 🚀 Queue-Based Execution Model

The AI Visibility Tracker now uses a **production-grade queue system** for scalable, reliable processing.

### Architecture

```
User Request → Job Queue → Background Worker → Process → Store Results → Dashboard
```

### Key Components

####1. **Job Queue (Bull + Redis)**
- Async job processing
- Retry logic (3 attempts with exponential backoff)
- Progress tracking
- Job persistence

#### 2. **Background Workers**
- Process tracking jobs independently
- Handle failures gracefully
- Rate limiting to avoid API throttling
- Real-time progress updates

#### 3. **Persistent Storage (LowDB)**
- Session management
- Historical data storage (90 days)
- Scheduled jobs configuration
- Analytics and trends

---

## 📅 Daily Scheduled Evaluations

### Features

- **Daily Tracking**: Automatically run tracking at specified times
- **Weekly Tracking**: Schedule weekly evaluations
- **Custom Schedules**: Configure time and frequency
- **Multi-Brand Support**: Track multiple categories simultaneously

### How It Works

1. **Create Schedule** via UI or API
2. **Cron Job** triggers at specified time
3. **Job Added to Queue** automatically
4. **Results Stored** in historical database
5. **Trends Calculated** from historical data

### API Endpoints

```javascript
// Schedule daily tracking
POST /api/scheduler/schedule/daily
{
  "category": "CRM software",
  "brands": ["Salesforce", "HubSpot"],
  "competitors": ["Zoho"],
  "time": "09:00"
}

// Schedule weekly tracking
POST /api/scheduler/schedule/weekly
{
  "category": "CRM software",
  "brands": ["Salesforce"],
  "dayOfWeek": 1,  // Monday
  "time": "09:00"
}

// Get all schedules
GET /api/scheduler/schedules

// Cancel schedule
DELETE /api/scheduler/schedule/:jobId
```

---

## 📊 Historical Tracking & Trends

### Features

- **Historical Data Storage**: Stores up to 90 days of tracking data
- **Trend Analysis**: Visualize changes over time
- **Multiple Time Ranges**: 7, 30, or 90-day views
- **Per-Brand Trends**: Track each brand individually

### Metrics Tracked Over Time

1. **Visibility Score** - % of prompts where brand appears
2. **Citation Share** - % of total mentions
3. **Total Mentions** - Absolute count

### Trend Charts

The dashboard displays:
- Line charts for visibility score trends
- Citation share evolution
- Mention frequency over time
- Comparative analysis across brands

---

## 🏗️ Post-Processing & Analytics

### Automated Post-Processing

After each tracking session:

1. **Calculate Rankings**
   - Sort brands by visibility score
   - Determine leaderboard positions
   - Identify top performers

2. **Compute Trends**
   - Compare with previous sessions
   - Calculate growth/decline rates
   - Identify patterns

3. **Store Historical Data**
   - Save to persistent storage
   - Maintain 90-day rolling window
   - Enable trend analysis

4. **Generate Insights**
   - Top cited pages
   - Context analysis
   - Missing prompt identification

### Analytics Dashboard

View comprehensive analytics:
- Total sessions run
- Success rate
- Average visibility scores
- Trend direction (improving/declining)

---

## 🔧 Technical Implementation

### Queue System (Bull)

```javascript
// Create queue
const trackingQueue = new Queue('ai-visibility-tracking', {
  redis: { port: 6379, host: '127.0.0.1' },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
});

// Process jobs
trackingQueue.process(async (job) => {
  // Generate prompts
  // Query AI
  // Calculate metrics
  // Return results
});
```

### Scheduler (node-cron)

```javascript
// Schedule daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  await trackingQueue.add({
    category,
    brands,
    competitors,
    scheduled: true
  });
});
```

### Storage (LowDB)

```javascript
// Save historical data
storageService.saveHistoricalData({
  timestamp: new Date(),
  category,
  brands,
  results
});

// Get trends
const trends = storageService.getTrendData(
  category,
  brand,
  days
);
```

---

## 💪 Production Benefits

### Scalability
- ✅ Queue handles high load
- ✅ Background processing doesn't block UI
- ✅ Multiple workers can be added
- ✅ Redis clustering support

### Reliability
- ✅ Automatic retries on failure
- ✅ Job persistence
- ✅ Error tracking
- ✅ Graceful degradation

### Performance
- ✅ Async processing
- ✅ Progress tracking
- ✅ Rate limiting
- ✅ Efficient storage

### Monitoring
- ✅ Job status tracking
- ✅ Progress updates
- ✅ Success/failure metrics
- ✅ Historical analytics

---

## 📈 Usage Examples

### 1. One-Time Tracking

```javascript
// Immediate tracking request
POST /api/tracking/start
{
  "category": "CRM software",
  "brands": ["Salesforce", "HubSpot"]
}

// Check progress
GET /api/tracking/results/:sessionId

// View trends
GET /api/tracking/trends?category=CRM&brand=Salesforce&days=30
```

### 2. Scheduled Tracking

```javascript
// Set up daily tracking
POST /api/scheduler/schedule/daily
{
  "category": "CRM software",
  "brands": ["Salesforce"],
  "time": "09:00"
}

// Runs automatically every day at 9 AM
// Results accumulate in historical database
// View trends in dashboard
```

### 3. Competitor Monitoring

```javascript
// Track competitors daily
POST /api/scheduler/schedule/daily
{
  "category": "CRM software",
  "brands": ["YourBrand"],
  "competitors": ["Competitor1", "Competitor2"],
  "mode": "normal"
}

// See competitive trends over time
// Identify when competitors gain/lose visibility
// Adjust strategy accordingly
```

---

## 🎯 Dashboard Features

### 1. Overview Tab
- Real-time metrics
- Brand leaderboard
- Visibility charts
- Mention distribution

### 2. Prompts Tab
- All prompts tested
- AI responses
- Brand mentions
- Filter by status

### 3. Citations Tab
- Per-brand analysis
- Cited pages
- Context examples
- Citation share

### 4. Trends Tab (NEW!)
- Historical charts
- 7/30/90-day views
- Visibility trends
- Citation trends
- Mention frequency

---

## 🔐 Configuration

### Environment Variables

```env
# OpenAI API
OPENAI_API_KEY=your_key

# Server
PORT=5000
NODE_ENV=production

# Redis (Optional - falls back to in-memory)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### Redis Setup (Optional)

For production, use Redis for reliable queue management:

```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis  # Ubuntu

# Start Redis
redis-server

# Or use Redis Cloud/AWS ElastiCache
```

**Without Redis**: The system works with in-memory storage (fine for development).

---

## 🚀 Deployment

### Backend Deployment

1. **Install Redis** (recommended for production)
2. **Set environment variables**
3. **Start server**: `npm start`
4. **Workers run automatically** within the same process

### Scaling

For high-volume production:

```javascript
// Option 1: Single process (default)
npm start

// Option 2: Separate worker process
node backend/worker.js

// Option 3: Multiple workers
pm2 start backend/server.js -i 2
pm2 start backend/worker.js -i 4
```

---

## 📊 Monitoring

### Job Monitoring

```javascript
// Queue dashboard (optional)
// Install: npm install bull-board

const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullAdapter(trackingQueue)],
  serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());
```

### Health Checks

```javascript
// Check queue health
GET /api/queue/health

// Check scheduler status
GET /api/scheduler/status

// View analytics
GET /api/tracking/analytics?category=CRM
```

---

## 🎉 Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| **Processing** | Synchronous | Async queue-based |
| **Reliability** | Basic | Retry + persistence |
| **Scheduling** | Manual | Automated daily/weekly |
| **Trends** | None | 90-day historical |
| **Scalability** | Single-threaded | Multi-worker ready |
| **Monitoring** | Limited | Full job tracking |

---

## 🔄 Upgrade Path

If upgrading from basic version:

1. **Install new dependencies**: `npm install`
2. **Add Redis** (optional but recommended)
3. **Migrate data** (if any)
4. **Update frontend** (already included)
5. **Test queue system**
6. **Set up schedules**

---

**You now have a production-ready AI Visibility Tracker! 🚀**

