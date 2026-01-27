/**
 * Gemini AI Initialization Module
 * 
 * Sets up and initializes the Gemini API client and AI service
 * Should be called once at application startup before starting the HTTP server
 * 
 * USAGE in main index.ts:
 * ```typescript
 * import { initializeGeminiAI } from './ai/init';
 * 
 * async function startApp() {
 *   // Initialize AI before starting server
 *   await initializeGeminiAI();
 *   
 *   // Now start Express server
 *   app.listen(PORT);
 * }
 * ```
 */

import { GeminiClient } from './gemini.client';
import { AIService, getAIService } from './ai.service';
import { validateMasterPrompt, getPromptStats } from '../lib/master-prompt';

/**
 * Initialize Gemini API and AI Service
 * MUST be called before routes are accessed
 */
export async function initializeGeminiAI(): Promise<void> {
  console.log('\n=== Initializing Gemini AI ===\n');

  try {
    // Step 1: Validate environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set. Check .env file.');
    }

    console.log(`✓ API Key found`);
    console.log(`✓ Model: ${model}`);

    // Step 2: Validate master system prompt
    if (!validateMasterPrompt()) {
      throw new Error('Master system prompt validation failed');
    }

    const promptStats = getPromptStats();
    console.log(`✓ Master prompt loaded (${promptStats.length} chars, ${promptStats.sections} sections)`);

    // Step 3: Create Gemini client
    const geminiClient = new GeminiClient({
      apiKey,
      model,
      timeout: parseInt(process.env.GEMINI_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '3'),
    });

    console.log(`✓ Gemini client initialized`);

    // Step 4: Initialize AI Service with Gemini client
    const aiService = getAIService();
    aiService.initialize(geminiClient);

    // Step 5: Health check
    const isHealthy = await aiService.healthCheck();
    if (!isHealthy) {
      console.warn('⚠️  AI service health check failed - may be network issue');
      console.log('   Continuing anyway - will retry on first request\n');
    } else {
      console.log(`✓ AI service health check passed`);
    }

    console.log('\n✅ Gemini AI initialized successfully!\n');
  } catch (error) {
    console.error('\n❌ Failed to initialize Gemini AI:');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\nFix steps:');
    console.error('1. Copy .env.example to .env');
    console.error('2. Add your GEMINI_API_KEY to .env');
    console.error('3. Add master system prompt to .env');
    console.error('4. Restart the application\n');

    // Don't throw - allow app to start but AI routes will fail gracefully
    console.warn('⚠️  Starting application without AI service\n');
  }
}

/**
 * Get initialized AI Service singleton
 * Should be called after initializeGeminiAI()
 */
export function getAI(): AIService {
  return getAIService();
}

/**
 * Check if AI service is ready
 */
export async function isAIReady(): Promise<boolean> {
  try {
    const aiService = getAIService();
    return await aiService.healthCheck();
  } catch {
    return false;
  }
}

/**
 * Example usage in Express app:
 * 
 * import express from 'express';
 * import { initializeGeminiAI } from './ai/init';
 * import aiRoutes from './routes/ai';
 * 
 * const app = express();
 * 
 * // Middleware
 * app.use(express.json());
 * 
 * // Initialize AI (must be before routes)
 * await initializeGeminiAI();
 * 
 * // Routes
 * app.use('/api/ai', aiRoutes);
 * 
 * // Start server
 * const PORT = process.env.PORT || 3000;
 * app.listen(PORT, () => {
 *   console.log(`Server running on port ${PORT}`);
 * });
 */
