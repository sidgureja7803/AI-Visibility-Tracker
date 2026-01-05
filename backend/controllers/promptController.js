const aiService = require('../services/aiService');

const promptController = {
  async generatePrompts(req, res) {
    try {
      const { category, count } = req.body;

      if (!category) {
        return res.status(400).json({ error: 'Category is required' });
      }

      const prompts = await aiService.generatePrompts(category, count || 10);

      res.json({
        category,
        prompts,
        count: prompts.length
      });

    } catch (error) {
      console.error('Generate prompts error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async queryAI(req, res) {
    try {
      const { prompt, brands, competitors, mode } = req.body;

      if (!prompt || !brands) {
        return res.status(400).json({ 
          error: 'Prompt and brands are required' 
        });
      }

      const result = await aiService.queryWithTracking(
        prompt,
        brands,
        competitors || [],
        mode || 'normal'
      );

      res.json(result);

    } catch (error) {
      console.error('Query AI error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = promptController;

