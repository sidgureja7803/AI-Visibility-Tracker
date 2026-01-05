const aiService = require('../services/aiService');

// In-memory storage (replace with database in production)
const sessions = new Map();

const trackingController = {
  async startTracking(req, res) {
    try {
      const { category, brands, competitors, mode } = req.body;

      if (!category || !brands || brands.length === 0) {
        return res.status(400).json({ 
          error: 'Category and at least one brand are required' 
        });
      }

      const sessionId = aiService.generateUUID();
      const session = {
        id: sessionId,
        category,
        brands,
        competitors: competitors || [],
        mode: mode || 'normal',
        createdAt: new Date().toISOString(),
        status: 'processing',
        results: null
      };

      sessions.set(sessionId, session);

      // Start processing in background
      processTracking(sessionId, category, brands, competitors, mode)
        .catch(err => {
          console.error('Tracking error:', err);
          session.status = 'error';
          session.error = err.message;
        });

      res.json({
        sessionId,
        message: 'Tracking started',
        status: 'processing'
      });

    } catch (error) {
      console.error('Start tracking error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getResults(req, res) {
    try {
      const { sessionId } = req.params;
      const session = sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(session);

    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getSessions(req, res) {
    try {
      const allSessions = Array.from(sessions.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json(allSessions);

    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

async function processTracking(sessionId, category, brands, competitors, mode) {
  const session = sessions.get(sessionId);
  
  try {
    // Generate relevant prompts for the category
    const prompts = await aiService.generatePrompts(category);
    
    // Query AI for each prompt and track brand mentions
    const promptResults = [];
    
    for (const prompt of prompts) {
      const result = await aiService.queryWithTracking(
        prompt, 
        brands, 
        competitors,
        mode
      );
      promptResults.push(result);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate metrics
    const results = calculateMetrics(promptResults, brands, competitors);
    
    session.status = 'completed';
    session.results = results;
    session.completedAt = new Date().toISOString();

  } catch (error) {
    session.status = 'error';
    session.error = error.message;
    throw error;
  }
}

function calculateMetrics(promptResults, brands, competitors) {
  const allBrands = [...brands, ...(competitors || [])];
  const brandStats = {};

  // Initialize stats for all brands
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

  // Process each prompt result
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

    // Get unique cited pages
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

module.exports = trackingController;

