/**
 * Gemini Client - Handles communication with Google Generative AI (Gemini Flash)
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Initialize Gemini client with API key
 */
export function initializeGemini(apiKey: string): GoogleGenerativeAI {
  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    console.info('[GEMINI_CLIENT] Initializing Gemini client');
    const genAI = new GoogleGenerativeAI(apiKey);

    return genAI;

  } catch (error) {
    console.error('[GEMINI_CLIENT] Error initializing Gemini:', error);
    throw new Error(`Failed to initialize Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Gemini Flash model with configuration
 */
export function getGeminiModel(
  genAI: GoogleGenerativeAI,
  modelName: string = 'gemini-1.5-flash'
): GenerativeModel {
  try {
    console.info(`[GEMINI_CLIENT] Getting model: ${modelName}`);

    const model = genAI.getGenerativeModel({
      model: modelName
    });

    return model;

  } catch (error) {
    console.error('[GEMINI_CLIENT] Error getting model:', error);
    throw new Error(`Failed to get model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate content with retry logic
 */
export async function generateWithRetry(
  model: GenerativeModel,
  prompt: string,
  config?: GenerationConfig
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.info(`[GEMINI_CLIENT] Generating content (attempt ${attempt}/${MAX_RETRIES})`);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: config
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      console.info('[GEMINI_CLIENT] Content generated successfully');
      return text;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`[GEMINI_CLIENT] Attempt ${attempt} failed:`, error);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * attempt;
        console.info(`[GEMINI_CLIENT] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[GEMINI_CLIENT] All ${MAX_RETRIES} attempts failed`);
  throw new Error(`Failed to generate content after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Generate content with function calling support
 */
export async function generateWithTools(
  model: GenerativeModel,
  prompt: string,
  tools: any[],
  config?: GenerationConfig
): Promise<{ text?: string; functionCalls?: any[] }> {
  try {
    console.info('[GEMINI_CLIENT] Generating content with tools');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools,
      generationConfig: config
    });

    const response = result.response;

    // Check for function calls
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.info(`[GEMINI_CLIENT] Received ${functionCalls.length} function calls`);
      return { functionCalls };
    }

    // Otherwise return text response
    const text = response.text();
    console.info('[GEMINI_CLIENT] Received text response');

    return { text };

  } catch (error) {
    console.error('[GEMINI_CLIENT] Error generating with tools:', error);
    throw new Error(`Failed to generate with tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Chat with conversation history
 */
export async function chatWithHistory(
  model: GenerativeModel,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  newMessage: string,
  tools?: any[],
  config?: GenerationConfig
): Promise<{ text?: string; functionCalls?: any[] }> {
  try {
    console.info('[GEMINI_CLIENT] Starting chat with history');

    const chat = model.startChat({
      history,
      generationConfig: config,
      tools
    });

    const result = await chat.sendMessage(newMessage);
    const response = result.response;

    // Check for function calls
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.info(`[GEMINI_CLIENT] Received ${functionCalls.length} function calls`);
      return { functionCalls };
    }

    // Otherwise return text response
    const text = response.text();
    console.info('[GEMINI_CLIENT] Received text response');

    return { text };

  } catch (error) {
    console.error('[GEMINI_CLIENT] Error in chat:', error);
    throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate API key by making a test request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    console.info('[GEMINI_CLIENT] Validating API key');

    const genAI = initializeGemini(apiKey);
    const model = getGeminiModel(genAI);

    await generateWithRetry(model, 'Hello', { maxOutputTokens: 10 });

    console.info('[GEMINI_CLIENT] API key is valid');
    return true;

  } catch (error) {
    console.error('[GEMINI_CLIENT] API key validation failed:', error);
    return false;
  }
}
