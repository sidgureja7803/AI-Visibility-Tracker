const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const aiService = {
  async generatePrompts(category, count = 10) {
    const systemPrompt = `You are an expert at generating realistic search prompts that users would ask AI assistants when looking for products or services in a specific category.

Generate ${count} diverse, natural prompts that someone might ask when researching "${category}".

Requirements:
- Mix different intent types: comparison, recommendation, problem-solving, feature-specific
- Vary prompt length (15-30 words)
- Include context (team size, use case, constraints)
- Make them conversational and realistic
- Cover different angles: pricing, features, integrations, ease of use, etc.

Return ONLY a JSON array of strings (the prompts), nothing else.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${count} prompts for category: ${category}` }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      const content = response.choices[0].message.content;
      const prompts = JSON.parse(content);

      return prompts;

    } catch (error) {
      console.error('Error generating prompts:', error);
      
      // Fallback prompts if API fails
      return [
        `What is the best ${category} for small businesses?`,
        `Compare top ${category} options`,
        `Which ${category} has the best features?`,
        `${category} with good customer support`,
        `Affordable ${category} for startups`,
        `${category} that integrates with popular tools`,
        `What ${category} do professionals recommend?`,
        `Best ${category} for remote teams`,
        `${category} with free trial`,
        `Easy to use ${category} for beginners`
      ].slice(0, count);
    }
  },

  async queryWithTracking(prompt, brands, competitors, mode = 'normal') {
    const allBrands = [...brands, ...(competitors || [])];
    
    // Adjust prompt based on mode
    let finalPrompt = prompt;
    if (mode === 'competitor' && competitors.length > 0) {
      finalPrompt = `From the perspective of someone who works at ${competitors[0]}, ${prompt}`;
    }

    const systemPrompt = `You are a helpful AI assistant that provides comprehensive, unbiased recommendations. 
When discussing products or services, naturally mention specific brand names when relevant. 
Provide detailed comparisons and explain why you recommend certain options.
Include specific URLs or documentation links when mentioning brands (you can use placeholder URLs).`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const answer = response.choices[0].message.content;
      
      // Analyze brand mentions
      const mentions = this.analyzeMentions(answer, allBrands);

      return {
        prompt: finalPrompt,
        answer,
        mentions,
        timestamp: new Date().toISOString(),
        mode
      };

    } catch (error) {
      console.error('Error querying AI:', error);
      throw new Error(`AI Query failed: ${error.message}`);
    }
  },

  analyzeMentions(text, brands) {
    const mentions = [];
    const lowerText = text.toLowerCase();

    brands.forEach(brand => {
      const brandLower = brand.toLowerCase();
      const regex = new RegExp(`\\b${brandLower}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches && matches.length > 0) {
        // Extract contexts (sentences containing the brand)
        const sentences = text.split(/[.!?]+/);
        const contexts = sentences
          .filter(sentence => sentence.toLowerCase().includes(brandLower))
          .map(s => s.trim())
          .filter(s => s.length > 0);

        // Extract potential citations (URLs)
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const citations = [];
        contexts.forEach(context => {
          const urls = context.match(urlRegex);
          if (urls) citations.push(...urls);
        });

        mentions.push({
          brand,
          count: matches.length,
          contexts: contexts.slice(0, 3), // Top 3 contexts
          citations: citations.length > 0 ? citations : ['Documentation', 'Official Website'],
          position: lowerText.indexOf(brandLower)
        });
      }
    });

    // Sort by position (earlier mentions first)
    return mentions.sort((a, b) => a.position - b.position);
  }
};

// Add UUID generation helper
aiService.generateUUID = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

module.exports = aiService;

