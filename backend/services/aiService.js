const OpenAI = require('openai');
const { withRetry, CircuitBreaker } = require('../utils/retry');
const config = require('../config');

/**
 * OpenAI Service - Clean interface for AI operations
 * Handles all OpenAI API interactions with proper error handling,
 * retries, timeouts, and circuit breaker
 */

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  timeout: config.openai.timeout
});

// Circuit breaker for OpenAI API
const openAICircuitBreaker = new CircuitBreaker({
  failureThreshold: config.circuitBreaker.failureThreshold,
  resetTimeout: config.circuitBreaker.resetTimeout
});

class OpenAIService {
  /**
   * Generate search prompts for a given category
   * @param {string} category - Product/service category
   * @param {number} count - Number of prompts to generate
   * @returns {Promise<string[]>} Array of prompts
   */
  async generatePrompts(category, count = config.processing.defaultPromptCount) {
    // Validate inputs
    if (!category || typeof category !== 'string') {
      throw new Error('Category must be a non-empty string');
    }

    if (count < 1 || count > config.processing.maxPromptCount) {
      throw new Error(`Count must be between 1 and ${config.processing.maxPromptCount}`);
    }

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
      const result = await withRetry(
        async () => {
          return await openAICircuitBreaker.execute(async () => {
            const response = await openai.chat.completions.create({
              model: config.openai.model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate ${count} prompts for category: ${category}` }
              ],
              temperature: 0.8,
              max_tokens: 800
            });

            return response;
          });
        },
        {
          ...config.retry,
          onRetry: (attempt, delay, error) => {
            console.log(`Retrying generatePrompts (attempt ${attempt}): ${error.message}`);
          },
          shouldRetry: (error) => {
            // Don't retry on client errors (4xx), only on server errors (5xx) and network issues
            if (error.status && error.status >= 400 && error.status < 500) {
              return false;
            }
            return true;
          }
        }
      );

      const content = result.choices[0].message.content;
      const prompts = JSON.parse(content);

      if (!Array.isArray(prompts)) {
        throw new Error('Generated prompts are not in array format');
      }

      return prompts;

    } catch (error) {
      console.error('Error generating prompts:', error);

      // Return fallback prompts if API fails
      return this.getFallbackPrompts(category, count);
    }
  }

  /**
   * Query AI with brand tracking
   * @param {string} prompt - User prompt
   * @param {string[]} brands - Brands to track
   * @param {string[]} competitors - Competitor brands
   * @param {string} mode - Query mode
   * @returns {Promise<Object>} Query result with mentions
   */
  async queryWithTracking(prompt, brands, competitors = [], mode = 'normal') {
    // Validate inputs
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    if (!Array.isArray(brands) || brands.length === 0) {
      throw new Error('Brands must be a non-empty array');
    }

    const allBrands = [...brands, ...competitors];

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
      const result = await withRetry(
        async () => {
          return await openAICircuitBreaker.execute(async () => {
            const response = await openai.chat.completions.create({
              model: config.openai.model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: finalPrompt }
              ],
              temperature: config.openai.temperature,
              max_tokens: config.openai.maxTokens
            });

            return response;
          });
        },
        {
          ...config.retry,
          onRetry: (attempt, delay, error) => {
            console.log(`Retrying queryWithTracking (attempt ${attempt}): ${error.message}`);
          },
          shouldRetry: (error) => {
            if (error.status && error.status >= 400 && error.status < 500) {
              return false;
            }
            return true;
          }
        }
      );

      const answer = result.choices[0].message.content;

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
  }

  /**
   * Analyze brand mentions in text
   * @param {string} text - Text to analyze
   * @param {string[]} brands - Brands to look for
   * @returns {Object[]} Array of mention objects
   */
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

  /**
   * Get fallback prompts when API fails
   * @param {string} category - Category
   * @param {number} count - Number of prompts
   * @returns {string[]} Fallback prompts
   */
  getFallbackPrompts(category, count) {
    const templates = [
      `What is the best ${category} for small businesses?`,
      `Compare top ${category} options`,
      `Which ${category} has the best features?`,
      `${category} with good customer support`,
      `Affordable ${category} for startups`,
      `${category} that integrates with popular tools`,
      `What ${category} do professionals recommend?`,
      `Best ${category} for remote teams`,
      `${category} with free trial`,
      `Easy to use ${category} for beginners`,
      `${category} for enterprise companies`,
      `Most popular ${category} in 2024`,
      `${category} vs alternatives comparison`,
      `Recommended ${category} for developers`,
      `${category} with best ROI`
    ];

    return templates.slice(0, count);
  }

  /**
   * Generate a UUID
   * @returns {string} UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Reset circuit breaker (useful for testing or manual recovery)
   */
  resetCircuitBreaker() {
    openAICircuitBreaker.reset();
    console.log('OpenAI circuit breaker reset');
  }
}

module.exports = new OpenAIService();
