/**
 * Chat API Route - Handles chat with Gemini and tool execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeGemini, getGeminiModel, chatWithHistory } from '@/lib/gemini/client';
import { toolDefinitions, executeDocSearch, executeDocRead, executeDocEdit } from '@/lib/gemini/tools';
import { buildSystemPrompt, buildPromptWithContext, formatToolResult } from '@/lib/gemini/prompt';
import { parseCitations } from '@/lib/citations/parser';
import { resolveCitations, formatCitationsAsContext } from '@/lib/citations/resolver';
import { Document, Message, Action } from '@/lib/parsers/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat - Send a message and get response from Gemini
 */
export async function POST(request: NextRequest) {
  try {
    console.info('[CHAT_API] Received chat request');

    // Get request body
    const body = await request.json();
    const { message, document, chatHistory = [] } = body;

    // Validate inputs
    if (!message || message.trim().length === 0) {
      console.error('[CHAT_API] Empty message');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!document) {
      console.error('[CHAT_API] No document provided');
      return NextResponse.json(
        { error: 'Document is required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('[CHAT_API] GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    console.info('[CHAT_API] Processing message with citations');

    // Parse citations from message
    const citations = parseCitations(message);
    console.info(`[CHAT_API] Found ${citations.length} citations`);

    // Resolve citations to actual content
    const resolvedCitations = resolveCitations(citations, document);
    const citationContext = formatCitationsAsContext(resolvedCitations);

    // Build prompt with context
    const prompt = buildPromptWithContext(message, citationContext, document);

    // Initialize Gemini
    const genAI = initializeGemini(apiKey);
    const model = getGeminiModel(genAI, 'gemini-1.5-flash');

    // Build conversation history
    const history = chatHistory.map((msg: Message) => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }]
    }));

    // Add system prompt to history if empty
    if (history.length === 0) {
      history.push({
        role: 'model' as const,
        parts: [{ text: buildSystemPrompt(document) }]
      });
    }

    // Execute chat with tools
    const actions: Action[] = [];
    let responseText = '';

    try {
      const response = await chatWithHistory(
        model,
        history,
        prompt,
        [toolDefinitions],
        { temperature: 0.7, maxOutputTokens: 2048 }
      );

      // Handle function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        console.info(`[CHAT_API] Processing ${response.functionCalls.length} function calls`);

        const toolResults: string[] = [];

        for (const functionCall of response.functionCalls) {
          const { name, args } = functionCall;

          console.info(`[CHAT_API] Executing tool: ${name}`);

          try {
            let result: any;

            switch (name) {
              case 'doc_search':
                result = executeDocSearch(args.query, document, args.limit);
                actions.push({
                  type: 'search',
                  success: true,
                  details: { query: args.query, results: result.length },
                  timestamp: new Date()
                });
                break;

              case 'doc_read':
                result = executeDocRead(args.lines, document);
                actions.push({
                  type: 'read',
                  success: result.success,
                  details: { lines: args.lines, found: result.lines?.length || 0 },
                  timestamp: new Date()
                });
                break;

              case 'doc_edit':
                result = executeDocEdit(args, document);
                actions.push({
                  type: 'edit',
                  success: result.success,
                  details: {
                    operation: args.operation,
                    lines: args.lines,
                    modified: result.modifiedLines?.length || 0
                  },
                  timestamp: new Date()
                });
                break;

              default:
                console.warn(`[CHAT_API] Unknown tool: ${name}`);
                result = { error: `Unknown tool: ${name}` };
            }

            toolResults.push(formatToolResult(name, result));

          } catch (error) {
            console.error(`[CHAT_API] Error executing tool ${name}:`, error);
            actions.push({
              type: name.replace('doc_', '') as any,
              success: false,
              details: { error: error instanceof Error ? error.message : 'Unknown error' },
              timestamp: new Date()
            });
            toolResults.push(`Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Generate final response with tool results
        const toolResultPrompt = `Tool execution results:\n\n${toolResults.join('\n\n')}\n\nPlease provide a natural response to the user based on these results.`;

        const finalResponse = await chatWithHistory(
          model,
          [
            ...history,
            { role: 'user' as const, parts: [{ text: prompt }] },
            { role: 'model' as const, parts: [{ text: 'Executing tools...' }] },
            { role: 'user' as const, parts: [{ text: toolResultPrompt }] }
          ],
          '',
          undefined,
          { temperature: 0.7, maxOutputTokens: 1024 }
        );

        responseText = finalResponse.text || 'I executed the requested operations.';

      } else if (response.text) {
        responseText = response.text;
      } else {
        responseText = 'I received your message but could not generate a response.';
      }

    } catch (error) {
      console.error('[CHAT_API] Error in Gemini chat:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate response',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    console.info('[CHAT_API] Successfully generated response');

    return NextResponse.json({
      success: true,
      message: responseText,
      citations: resolvedCitations.length > 0 ? resolvedCitations : undefined,
      actions: actions.length > 0 ? actions : undefined,
      document: actions.some(a => a.type === 'edit' && a.success) ? document : undefined
    });

  } catch (error) {
    console.error('[CHAT_API] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat - Health check
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  return NextResponse.json({
    status: 'ok',
    service: 'chat',
    gemini_configured: !!apiKey
  });
}
