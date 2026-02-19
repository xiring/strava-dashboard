'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ChatMessage from '@/components/ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Give me a summary',
  'Compare runs vs rides this month',
  'Am I improving?',
  'Top 5 longest runs',
  "What's my streak?",
];

export default function ChatAgentWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('strava-open-chat', handler);
    return () => window.removeEventListener('strava-open-chat', handler);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'No response.',
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { id: `e-${Date.now()}`, role: 'assistant', content: `Sorry: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (s: string) => {
    sendMessage(s);
  };

  // Hide on full chat page to avoid duplicate
  if (pathname === '/chat') return null;

  return (
    <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          className="w-[380px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[70vh] flex flex-col glass rounded-2xl shadow-soft-lg border border-white/20 dark:border-white/5 overflow-hidden animate-slide-up"
          style={{ boxShadow: '0 12px 48px -12px rgba(0,0,0,0.15)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-white/5 shrink-0">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Activity Assistant
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 && !loading && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">Try asking:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className="block w-full text-left px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m) => (
              <ChatMessage key={m.id} content={m.content} isUser={m.role === 'user'} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass rounded-2xl rounded-bl-md px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-strava animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-strava animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-strava animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/20 dark:border-white/5 shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about activities..."
                rows={1}
                className="flex-1 resize-none bg-white/50 dark:bg-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-strava/30 text-sm py-2 px-3"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="px-3 py-2 rounded-xl bg-strava text-white text-sm font-medium hover:bg-strava-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-14 h-14 rounded-2xl bg-strava text-white shadow-soft-lg hover:bg-strava-hover transition-all hover:scale-105"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        title="Activity Assistant"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
