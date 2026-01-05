const Queue = require('bull');
const aiService = require('../services/aiService');

// Create tracking queue with Redis connection error handling
let trackingQueue = null;
let useQueue = false;

// Simple check if Redis is available before creating queue
const checkRedisAvailability = () => {
  return new Promise((resolve) => {
    const net = require('net');
    const client = net.createConnection({
      port: process.env.REDIS_PORT || 6379,
      host: process.env.REDIS_HOST || '127.0.0.1'
    });

    client.on('connect', () => {
      client.end();
      resolve(true);
    });

    client.on('error', () => {
      client.destroy();
      resolve(false);
    });

    // Timeout after 1 second
    setTimeout(() => {
      client.destroy();
      resolve(false);
    }, 1000);
  });
};

// Initialize queue only if Redis is available
const initQueue = async () => {
  const redisAvailable = await checkRedisAvailability();
  
  if (redisAvailable) {
    try {
      trackingQueue = new Queue('ai-visibility-tracking', {
        redis: {
          port: process.env.REDIS_PORT || 6379,
          host: process.env.REDIS_HOST || '127.0.0.1'
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: false,
          removeOnFail: false
        }
      });

      useQueue = true;
      console.log('✅ Redis connected - Queue mode enabled');
      
      // Set up event handlers
      if (trackingQueue) {
        trackingQueue.on('completed', (job, result) => {
          console.log(`✅ Job ${job.id} completed for session ${result.sessionId}`);
        });

        trackingQueue.on('failed', (job, err) => {
          console.error(`❌ Job ${job.id} failed:`, err.message);
        });

        trackingQueue.on('progress', (job, progress) => {
          console.log(`📊 Job ${job.id} progress: ${progress}%`);
        });
        
        // Process jobs
        trackingQueue.process(async (job) => {
          return processTracking(job.data, (progress) => job.progress(progress));
        });
      }
      
    } catch (error) {
      console.log('⚠️  Redis initialization failed - Using direct execution mode');
      trackingQueue = null;
      useQueue = false;
    }
  } else {
    console.log('⚠️  Redis not available - Using direct execution mode');
    trackingQueue = null;
    useQueue = false;
  }
};

// Initialize asynchronously
initQueue();

// Core processing function (used by both queue and direct execution)
async function processTracking(data, progressCallback) {
  const { sessionId, category, brands, competitors, mode } = data;
  
  try {
    // Update progress
    if (progressCallback) await progressCallback(10);
    
    // Generate prompts
    const prompts = await aiService.generatePrompts(category, 10);
    if (progressCallback) await progressCallback(30);
    
    // Query AI for each prompt
    const promptResults = [];
    const totalPrompts = prompts.length;
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const result = await aiService.queryWithTracking(
        prompt,
        brands,
        competitors || [],
        mode || 'normal'
      );
      promptResults.push(result);
      
      // Update progress
      const progress = 30 + Math.floor((i + 1) / totalPrompts * 50);
      if (progressCallback) await progressCallback(progress);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (progressCallback) await progressCallback(90);
    
    // Calculate metrics
    const results = calculateMetrics(promptResults, brands, competitors);
    
    if (progressCallback) await progressCallback(100);
    
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
    console.error('Processing error:', error);
    throw error;
  }
}

function calculateMetrics(promptResults, brands, competitors) {
  const allBrands = [...brands, ...(competitors || [])];
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
      competitorsTracked: (competitors || []).length
    }
  };
}

module.exports = {
  queue: trackingQueue,
  processTracking,
  isUsingQueue: () => useQueue && trackingQueue !== null
};

