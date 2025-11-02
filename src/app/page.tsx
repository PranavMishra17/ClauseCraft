'use client';

/**
 * Main Page - ClauseCraft Agentic Document Editor
 */

import { useState, useEffect } from 'react';
import { Document, Line, Message, Chat } from '@/lib/parsers/types';
import { loadChats, saveChats, createChat, saveDocument, loadDocument } from '@/lib/storage/chats';
import { exportDocument } from '@/lib/export';
import DocumentViewer from '@/components/document/DocumentViewer';
import ChatInterface from '@/components/chat/ChatInterface';
import ChatHistory from '@/components/sidebar/ChatHistory';
import { Upload, AlertCircle } from 'lucide-react';

export default function Home() {
  const [document, setDocument] = useState<Document | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load chats from localStorage on mount
  useEffect(() => {
    const storedChats = loadChats();
    setChats(storedChats);
  }, []);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      console.log('Uploading file:', file.name);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to parse document');
      }

      console.log('Document parsed successfully');
      setDocument(data.document);

      // Save document to localStorage
      saveDocument(data.document);

      // Create a new chat for this document
      const newChat = createChat(file.name, data.document.id);
      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setCurrentChat(newChat);
      saveChats(updatedChats);

    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle send message
  const handleSendMessage = async (messageText: string) => {
    if (!document || !currentChat) {
      setError('No document or chat selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: messageText,
        timestamp: new Date()
      };

      // Add user message to chat
      const updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage],
        updatedAt: new Date()
      };

      setCurrentChat(updatedChat);

      // Update chats array
      const updatedChats = chats.map(c =>
        c.id === currentChat.id ? updatedChat : c
      );
      setChats(updatedChats);
      saveChats(updatedChats);

      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          document,
          chatHistory: currentChat.messages
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        citations: data.citations,
        actions: data.actions
      };

      // Update chat with assistant message
      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        updatedAt: new Date()
      };

      setCurrentChat(finalChat);

      // Update chats array again
      const finalChats = chats.map(c =>
        c.id === currentChat.id ? finalChat : c
      );
      setChats(finalChats);
      saveChats(finalChats);

      // Update document if it was modified
      if (data.document) {
        setDocument(data.document);
        saveDocument(data.document);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle line lock toggle
  const handleLineToggleLock = (line: Line) => {
    if (!document) return;

    const updatedLines = document.lines.map(l =>
      l.lineNumber === line.lineNumber
        ? { ...l, isLocked: !l.isLocked }
        : l
    );

    const updatedDocument = {
      ...document,
      lines: updatedLines
    };

    setDocument(updatedDocument);
    saveDocument(updatedDocument);
  };

  // Handle new chat
  const handleNewChat = () => {
    if (!document) {
      alert('Please upload a document first');
      return;
    }

    const newChat = createChat('New Chat', document.id);
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setCurrentChat(newChat);
    saveChats(updatedChats);
  };

  // Handle select chat
  const handleSelectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);

      // Load associated document if different
      if (chat.documentId && chat.documentId !== document?.id) {
        const doc = loadDocument(chat.documentId);
        if (doc) {
          setDocument(doc);
        }
      }
    }
  };

  // Handle delete chat
  const handleDeleteChat = (chatId: string) => {
    const updatedChats = chats.filter(c => c.id !== chatId);
    setChats(updatedChats);
    saveChats(updatedChats);

    // If current chat was deleted, clear it
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  };

  // Handle export
  const handleExport = async (format: 'docx' | 'pdf' | 'markdown') => {
    if (!document) {
      setError('No document to export');
      return;
    }

    try {
      setError(null);
      await exportDocument(document, format);
    } catch (error) {
      console.error('Error exporting document:', error);
      setError(error instanceof Error ? error.message : 'Failed to export document');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ClauseCraft</h1>
            <p className="text-sm text-gray-600">Agentic Document Editor</p>
          </div>

          {/* Upload Button */}
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            <span className="font-medium">
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </span>
            <input
              type="file"
              accept=".docx,.pdf,.md,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat History */}
        <div className="w-64 flex-shrink-0">
          <ChatHistory
            chats={chats}
            currentChatId={currentChat?.id}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>

        {/* Middle - Document Viewer */}
        <div className="flex-1">
          <DocumentViewer
            document={document}
            onLineToggleLock={handleLineToggleLock}
            onExport={handleExport}
          />
        </div>

        {/* Right - Chat Interface */}
        <div className="w-[500px] flex-shrink-0">
          <ChatInterface
            messages={currentChat?.messages || []}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
