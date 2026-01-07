# Backend Architecture Documentation

## Overview

The backend has been refactored to follow **clean architecture principles** with proper separation of concerns, robust error handling, and scalable design patterns.

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│             HTTP Layer (Controllers)         │  ← Request/Response handling only
├─────────────────────────────────────────────┤
│          Business Logic (Services)           │  ← Core business rules & orchestration
├─────────────────────────────────────────────┤
│         Data Access (Repositories)           │  ← Pure CRUD operations
├─────────────────────────────────────────────┤
│     External Services (AI, Queue)            │  ← Third-party integrations
├─────────────────────────────────────────────┤
│      Infrastructure (Utils, Config)          │  ← Cross-cutting concerns
└─────────────────────────────────────────────┘
```

## Directory Structure

```
backend/
├── config/                 # Configuration management
│   └── index.js           # Centralized config with validation
├── controllers/            # HTTP request handlers (thin layer)
│   ├── promptController.js
│   └── trackingController.js
├── services/              # Business logic layer
│   ├── aiService.js       # OpenAI integration & brand analysis
│   ├── trackingService.js # Tracking orchestration & metrics
│   ├── schedulerService.js
│   └── storageService.js  # (Deprecated - use repository)
├── repositories/          # Data access layer
│   └── storageRepository.js # Pure CRUD operations
├── queue/                 # Job queue management
│   └── trackingQueue.js   # Redis queue wrapper
├── routes/                # Express routes
│   ├── tracking.js
│   ├── prompts.js
│   └── scheduler.js
├── utils/                 # Shared utilities
│   └── retry.js          # Retry, timeout, circuit breaker
├── data/                  # Database files
│   └── db.json           # LowDB storage
└── server.js             # Application entry point
```

## Key Improvements

### 1. ✅ **Separation of Concerns**

**Problem:** Controllers contained business logic, services were tightly coupled to storage.

**Solution:**
- **Controllers**: Only handle HTTP concerns (req/res, status codes)
- **Services**: Contain all business logic and orchestration
- **Repositories**: Pure data access with no business logic
- **External Services**: Clean interfaces for third-party APIs

### 2. ✅ **Reliability & Performance**

#### Problem: No timeout, retry, or error handling for external API calls

**Solution - Retry with Exponential Backoff:**
```javascript
const result = await withRetry(
  async () => await openai.chat.completions.create(...),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    timeout: 30000,
    shouldRetry: (error) => error.status >= 500
  }
);
```

**Features:**
- ✅ Configurable timeouts (default: 30s)
- ✅ Exponential backoff with jitter
- ✅ Smart retry logic (only retry server errors, not client errors)
- ✅ Circuit breaker pattern to prevent cascading failures

#### Problem: Sequential prompt execution is slow

**Solution - Configurable Parallel Execution:**
```javascript
// Enable in .env
PARALLEL_EXECUTION=true
MAX_CONCURRENT_REQUESTS=3
```

**Features:**
- ✅ Batch processing in parallel
- ✅ Configurable concurrency limits
- ✅ Rate limiting between batches
- ✅ Fallback to sequential mode if disabled

### 3. ✅ **Better Data Handling**

#### Problem: Synchronous disk I/O, poor concurrency handling

**Solution - Async Repository Pattern:**
```javascript
// All operations are async
await storageRepository.createSession(session);
await storageRepository.updateSession(sessionId, updates);
const sessions = await storageRepository.getAllSessions();
```

**Features:**
- ✅ All operations use async/await
- ✅ Proper error handling with try/catch
- ✅ Transaction-like updates
- ✅ Automatic data cleanup (90-day retention)

### 4. ✅ **Centralized Configuration**

#### Problem: Configuration scattered across files, hard to manage

**Solution - Single Config File:**
```javascript
const config = require('./config');

// All settings in one place
config.openai.timeout
config.processing.parallelExecutionEnabled
config.retry.maxAttempts
```

**Features:**
- ✅ Environment variable validation
- ✅ Type conversion and defaults
- ✅ Production vs development modes
- ✅ Clear error messages for missing config

## Configuration Options

See `.env.example` for all available options. Key settings:

### Performance Tuning

```env
# Sequential (safer, default)
PARALLEL_EXECUTION=false

# Parallel (faster, uses more resources)
PARALLEL_EXECUTION=true
MAX_CONCURRENT_REQUESTS=3
```

### Reliability

```env
# API timeouts and retries
OPENAI_TIMEOUT=30000
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY=1000

# Circuit breaker
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_RESET=60000
```

### Queue vs Direct Mode

```env
# With Redis (recommended for production)
REDIS_ENABLED=true

# Without Redis (simpler for development)
REDIS_ENABLED=false
```

## API Endpoints

### Health Check
```
GET /api/health
```

Returns detailed system health including:
- Queue statistics (if Redis enabled)
- Database statistics
- Processing mode
- Environment info

### Tracking

```
POST /api/tracking/start
GET  /api/tracking/results/:sessionId
GET  /api/tracking/sessions
GET  /api/tracking/trends
```

### Prompts

```
POST /api/prompts/generate
```

## Error Handling

### Retry Logic
- **4xx errors** (client errors): No retry
- **5xx errors** (server errors): Retry with backoff
- **Network errors**: Retry with backoff
- **Timeouts**: Retry with backoff

### Circuit Breaker
- Opens after 5 consecutive failures (configurable)
- Half-open state after 60 seconds (configurable)
- Prevents cascading failures

### Error Responses
```json
{
  "error": "Descriptive error message",
  "status": "error"
}
```

## Monitoring

### Console Logging
- ✅ Request processing
- ✅ Queue job status
- ✅ Retry attempts
- ✅ Circuit breaker state changes
- ✅ Configuration summary on startup

### Health Endpoint
Monitor application health with:
```bash
curl http://localhost:5001/api/health
```

## Performance Considerations

### Sequential Mode (Default)
- **Pros**: More reliable, less resource intensive, easier to debug
- **Cons**: Slower processing (5 prompts ≈ 15-20 seconds)
- **Use when**: Rate limiting is a concern, limited API quota

### Parallel Mode
- **Pros**: Much faster (5 prompts ≈ 5-8 seconds)
- **Cons**: More resource intensive, harder to debug
- **Use when**: High throughput needed, unlimited API quota

### Rate Limiting
```env
# Delay between API calls (ms)
RATE_LIMIT_DELAY=300  # Slower but safer
RATE_LIMIT_DELAY=100  # Faster but may hit rate limits
```

## Migration from Old Code

The old `storageService.js` still works (backwards compatibility) but delegates to the new repository:

```javascript
// Old (deprecated, but still works)
const storageService = require('./services/storageService');
await storageService.saveSession(session);

// New (recommended)
const storageRepository = require('./repositories/storageRepository');
await storageRepository.createSession(session);
```

## Testing Recommendations

### Unit Testing
- Test services in isolation
- Mock repositories and external services
- Test retry logic with simulated failures

### Integration Testing
- Test with real database
- Test queue integration
- Test circuit breaker behavior

### Load Testing
- Test parallel vs sequential performance
- Test retry behavior under load
- Test circuit breaker activation

## Production Deployment

### Required Environment Variables
```env
NODE_ENV=production
OPENAI_API_KEY=<your-key>
FRONTEND_URL=<your frontend url>
```

### Optional but Recommended
```env
REDIS_ENABLED=true
PARALLEL_EXECUTION=true
MAX_CONCURRENT_REQUESTS=3
```

### Health Check Integration
Configure your deployment platform to monitor:
- `GET /api/health` should return 200
- Check `status: "ok"` in response

## Troubleshooting

### Circuit Breaker Opened
**Symptom**: Requests failing with "Circuit breaker is OPEN"

**Solution**:
1. Check OpenAI API status
2. Verify API key is valid
3. Wait for reset timeout (60s default)
4. Manually reset: Restart server

### Timeout Errors
**Symptom**: "Operation timed out after 30000ms"

**Solution**:
1. Increase timeout: `OPENAI_TIMEOUT=60000`
2. Check network connectivity
3. Verify OpenAI service status

### Queue Not Working
**Symptom**: Jobs not processing with Redis enabled

**Solution**:
1. Verify Redis is running
2. Check connection: `REDIS_HOST` and `REDIS_PORT`
3. Fallback: Set `REDIS_ENABLED=false`

## Future Improvements

- [ ] Add metrics collection (Prometheus)
- [ ] Implement request caching
- [ ] Add rate limiting middleware
- [ ] Migrate from LowDB to PostgreSQL/MongoDB
- [ ] Add API versioning
- [ ] Implement webhook notifications
- [ ] Add request validation middleware
- [ ] Implement API authentication

## Contributing

When adding new features:
1. Keep controllers thin
2. Put business logic in services
3. Use repositories for data access
4. Add retry logic for external APIs
5. Update configuration if needed
6. Add proper error handling
7. Update this documentation
