/**
 * Chat Storage - LocalStorage wrapper for persisting chat history
 */

import { Chat, Message, Document } from '../parsers/types';
import { randomUUID } from 'crypto';

const STORAGE_KEY = 'clausecraft-chats';
const DOCUMENT_STORAGE_KEY = 'clausecraft-documents';

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.error('[STORAGE] localStorage not available:', error);
    return false;
  }
}

/**
 * Load all chats from localStorage
 */
export function loadChats(): Chat[] {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('[STORAGE] localStorage not available');
      return [];
    }

    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      console.info('[STORAGE] No chats found in storage');
      return [];
    }

    const chats: Chat[] = JSON.parse(stored);

    // Convert date strings back to Date objects
    chats.forEach(chat => {
      chat.createdAt = new Date(chat.createdAt);
      if (chat.updatedAt) {
        chat.updatedAt = new Date(chat.updatedAt);
      }

      chat.messages.forEach(msg => {
        msg.timestamp = new Date(msg.timestamp);
      });
    });

    console.info(`[STORAGE] Loaded ${chats.length} chats from storage`);

    return chats;

  } catch (error) {
    console.error('[STORAGE] Error loading chats:', error);
    return [];
  }
}

/**
 * Save all chats to localStorage
 */
export function saveChats(chats: Chat[]): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('[STORAGE] localStorage not available');
      return false;
    }

    const serialized = JSON.stringify(chats);
    localStorage.setItem(STORAGE_KEY, serialized);

    console.info(`[STORAGE] Saved ${chats.length} chats to storage`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error saving chats:', error);
    return false;
  }
}

/**
 * Create a new chat
 */
export function createChat(title: string, documentId?: string): Chat {
  const chat: Chat = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    messages: [],
    documentId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.info(`[STORAGE] Created new chat: ${chat.id}`);

  return chat;
}

/**
 * Add a message to a chat
 */
export function addMessage(chatId: string, message: Message): boolean {
  try {
    const chats = loadChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) {
      console.error(`[STORAGE] Chat not found: ${chatId}`);
      return false;
    }

    chats[chatIndex].messages.push(message);
    chats[chatIndex].updatedAt = new Date();

    saveChats(chats);

    console.info(`[STORAGE] Added message to chat ${chatId}`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error adding message:', error);
    return false;
  }
}

/**
 * Update a chat
 */
export function updateChat(chatId: string, updates: Partial<Chat>): boolean {
  try {
    const chats = loadChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);

    if (chatIndex === -1) {
      console.error(`[STORAGE] Chat not found: ${chatId}`);
      return false;
    }

    chats[chatIndex] = {
      ...chats[chatIndex],
      ...updates,
      updatedAt: new Date()
    };

    saveChats(chats);

    console.info(`[STORAGE] Updated chat ${chatId}`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error updating chat:', error);
    return false;
  }
}

/**
 * Delete a chat
 */
export function deleteChat(chatId: string): boolean {
  try {
    const chats = loadChats();
    const filtered = chats.filter(c => c.id !== chatId);

    if (filtered.length === chats.length) {
      console.warn(`[STORAGE] Chat not found: ${chatId}`);
      return false;
    }

    saveChats(filtered);

    console.info(`[STORAGE] Deleted chat ${chatId}`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error deleting chat:', error);
    return false;
  }
}

/**
 * Get a specific chat by ID
 */
export function getChat(chatId: string): Chat | null {
  try {
    const chats = loadChats();
    const chat = chats.find(c => c.id === chatId);

    if (!chat) {
      console.warn(`[STORAGE] Chat not found: ${chatId}`);
      return null;
    }

    return chat;

  } catch (error) {
    console.error('[STORAGE] Error getting chat:', error);
    return null;
  }
}

/**
 * Save current document to localStorage
 */
export function saveDocument(document: Document): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('[STORAGE] localStorage not available');
      return false;
    }

    const stored = localStorage.getItem(DOCUMENT_STORAGE_KEY);
    const documents: Record<string, Document> = stored ? JSON.parse(stored) : {};

    documents[document.id] = document;

    localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(documents));

    console.info(`[STORAGE] Saved document ${document.id}`);

    return true;

  } catch (error) {
    console.error('[STORAGE] Error saving document:', error);
    return false;
  }
}

/**
 * Load a document by ID
 */
export function loadDocument(documentId: string): Document | null {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('[STORAGE] localStorage not available');
      return null;
    }

    const stored = localStorage.getItem(DOCUMENT_STORAGE_KEY);

    if (!stored) {
      console.info('[STORAGE] No documents found in storage');
      return null;
    }

    const documents: Record<string, Document> = JSON.parse(stored);
    const document = documents[documentId];

    if (!document) {
      console.warn(`[STORAGE] Document not found: ${documentId}`);
      return null;
    }

    console.info(`[STORAGE] Loaded document ${documentId}`);

    return document;

  } catch (error) {
    console.error('[STORAGE] Error loading document:', error);
    return null;
  }
}

/**
 * Clear all storage (for debugging)
 */
export function clearAllStorage(): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DOCUMENT_STORAGE_KEY);

    console.info('[STORAGE] Cleared all storage');

    return true;

  } catch (error) {
    console.error('[STORAGE] Error clearing storage:', error);
    return false;
  }
}
