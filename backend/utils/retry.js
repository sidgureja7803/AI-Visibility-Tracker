/**
 * Retry utility for handling transient failures in external API calls
 * Implements exponential backoff with jitter
 */

class RetryError extends Error {
  constructor(message, attempts, lastError) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

/**
 * Execute a function with retry logic
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry options
 * @returns {Promise} Result of the function
 */
async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeout = 30000,
    onRetry = null,
    shouldRetry = (error) => true
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Execute with timeout
      const result = await executeWithTimeout(fn, timeout);
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw new RetryError(
          `Failed after ${attempt} attempts: ${error.message}`,
          attempt,
          lastError
        );
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
      const delay = exponentialDelay + jitter;
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, delay, error);
      }
      
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${Math.round(delay)}ms. Error: ${error.message}`);
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Execute a function with timeout
 * @param {Function} fn - Async function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} Result of the function
 */
function executeWithTimeout(fn, timeoutMs) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Circuit breaker to prevent cascading failures
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker: Transitioning to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.log('Circuit breaker: Transitioning to CLOSED');
      }
      
      return result;
      
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        console.log('Circuit breaker: Transitioning to OPEN');
      }
      
      throw error;
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

module.exports = {
  withRetry,
  executeWithTimeout,
  sleep,
  CircuitBreaker,
  RetryError
};
