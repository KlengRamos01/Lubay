'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Source = { text?: string; page?: number; score?: number };
type Chat = { id: string; title: string; messages: any[]; createdAt: Date };

export default function Page() {
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize with a new chat
  useEffect(() => {
    if (chatHistory.length === 0) {
      const newChat: Chat = {
        id: crypto.randomUUID(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
      };
      setChatHistory([newChat]);
      setCurrentChatId(newChat.id);
    }
  }, []);

  // Get current chat's messages for initial load
  const currentChatMessages = chatHistory.find(chat => chat.id === currentChatId)?.messages || [];

  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: '/api/chat',
    id: currentChatId || undefined,
    initialMessages: currentChatMessages,
    onFinish: (message) => {
      // Save messages to current chat when response finishes
      if (currentChatId) {
        setChatHistory(prev => prev.map(chat => {
          if (chat.id === currentChatId) {
            const updatedMessages = [...chat.messages, message];
            // Update title based on first user message
            const firstUserMsg = chat.messages.find(m => m.role === 'user');
            const title = chat.title === 'New Chat' && firstUserMsg
              ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
              : chat.title;
            return { ...chat, messages: updatedMessages, title };
          }
          return chat;
        }));
      }
    },
  });

  const handleNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
    };
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  // Custom submit handler to save user messages
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
    // Save user message to chat history after a short delay
    setTimeout(() => {
      if (currentChatId && input.trim()) {
        setChatHistory(prev => prev.map(chat => {
          if (chat.id === currentChatId) {
            const userMessage = { id: crypto.randomUUID(), role: 'user', content: input };
            const updatedMessages = [...chat.messages, userMessage];
            // Update title based on first user message
            const title = chat.title === 'New Chat'
              ? input.slice(0, 30) + (input.length > 30 ? '...' : '')
              : chat.title;
            return { ...chat, messages: updatedMessages, title };
          }
          return chat;
        }));
      }
    }, 10);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white/40 backdrop-blur-sm border-r border-sky-100 transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-sky-100">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-all shadow-md shadow-sky-200/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatHistory.map(chat => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                chat.id === currentChatId
                  ? 'bg-sky-100 text-sky-800 font-medium'
                  : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="truncate">{chat.title}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 py-4 border-b border-sky-100 bg-white/30 backdrop-blur-sm flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-sky-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-sky-800">LubayLub.AI</h1>
            <p className="text-xs text-sky-600/80">
              Your Mental Health Guide
            </p>
          </div>
          <div className="w-9"></div> {/* Spacer for balance */}
        </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="text-center py-16 flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-200 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-5 breathe-glow">
              <span className="text-3xl">🌿</span>
            </div>
            <h2 className="text-xl font-semibold text-sky-900 mb-2">Welcome to LubayLub.AI</h2>
            <p className="text-sky-700/70 max-w-md mx-auto mb-6 leading-relaxed">
              I&apos;m here to help you understand stress and mental health.
              Bend like bamboo—ask me anything about:
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {['Causes of stress', 'Coping strategies', 'Anxiety management', 'Work-life balance'].map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                      window.HTMLInputElement.prototype,
                      'value'
                    )?.set;
                    const inputElement = document.querySelector('input') as HTMLInputElement;
                    if (inputElement && nativeInputValueSetter) {
                      nativeInputValueSetter.call(inputElement, topic);
                      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }}
                  className="px-4 py-1.5 bg-white/60 backdrop-blur text-sky-700 rounded-full text-sm font-medium border border-sky-200 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-sm"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="space-y-5 mb-6 min-h-[200px]">
          {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === 'user'
                ? 'flex justify-end'
                : 'flex justify-start flex-col items-start'
            }
          >
            <div
              className={
                m.role === 'user'
                  ? 'rounded-2xl bg-sky-500 text-white px-5 py-3 max-w-[85%] shadow-md shadow-sky-200/50'
                  : 'rounded-2xl bg-white/80 backdrop-blur border border-sky-100 px-5 py-3 max-w-[85%] shadow-sm'
              }
            >
              {m.role === 'assistant' ? (
                <div className="markdown-content text-slate-700 leading-relaxed">
                  <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                </div>
              ) : (
                <span className="leading-relaxed">{m.content}</span>
              )}
            </div>

            {m.role === 'assistant' &&
              m.toolInvocations?.map(
                (inv: any) =>
                  inv.state === 'result' &&
                  inv.toolName === 'getInformation' && (
                    <details
                      key={inv.toolCallId}
                      className="mt-3 text-sm text-slate-600 max-w-[85%] bg-white/50 backdrop-blur rounded-xl border border-sky-100 px-4 py-3"
                    >
                      <summary className="cursor-pointer hover:text-sky-600 transition-colors font-medium select-none">
                        📄 Sources
                      </summary>
                      <div className="mt-3 text-xs text-slate-500 italic">
                        <p>Source: How to Manage and Reduce Stress Guide by Mental Health Foundation UK</p>
                        <p className="mt-1">
                          Referenced pages: {[...new Set((inv.result as Source[]).map((src: Source) => src.page).filter((p): p is number => p !== undefined))].sort((a, b) => a - b).join(', ')}
                        </p>
                      </div>
                    </details>
                  ),
              )}
          </li>
        ))}
        {status === 'streaming' && (
          <li className="text-sm text-sky-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
            LubayLub.AI is thinking...
          </li>
        )}
        {error && (
          <li className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2">
            Error: {error.message}
          </li>
        )}
        </ul>
      </div>

      {/* Input Form */}
      <div className="px-6 py-4 border-t border-sky-100 bg-white/30 backdrop-blur-sm">
        <form onSubmit={onSubmit} className="flex gap-2.5">
          <input
            value={input}
            onChange={handleInputChange}
            className="flex-1 border border-sky-200 bg-white/70 backdrop-blur rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition-all placeholder:text-sky-400/60"
            placeholder="Ask about stress, anxiety, coping strategies…"
            disabled={status === 'streaming' || status === 'submitted'}
          />
          <button
            type="submit"
            disabled={!input || status === 'streaming' || status === 'submitted'}
            className="rounded-xl bg-sky-500 text-white px-5 py-2.5 font-medium disabled:opacity-40 hover:bg-sky-600 transition-all shadow-md shadow-sky-200/50 hover:shadow-lg"
          >
            Send
          </button>
        </form>
      </div>
      </main>
    </div>
  );
}
