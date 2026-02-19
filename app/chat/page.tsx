'use client';

import { useState, useRef, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import ChatMessage from '@/components/ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [athlete, setAthlete] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const res = await fetch('/api/athlete');
        if (res.ok) {
          const data = await res.json();
          setAthlete(data.athlete);
        }
      } catch {
        // ignore
      }
    };
    fetchAthlete();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'No response.',
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, something went wrong: ${err.message}`,
      };
      setMessages((m) => [...m, errMsg]);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <AppHeader athlete={athlete} />

      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Activity Assistant
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search and explore your Strava activities. Ask about runs, rides, stats, and more.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pb-4 min-h-[200px]">
          {messages.length === 0 && !loading && (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Try asking:
              </p>
              <div className="space-y-2 text-left max-w-sm mx-auto">
                {[
                  'Give me a summary',
                  'Compare runs vs rides this month',
                  'Am I improving?',
                  'Top 5 longest runs',
                  'Breakdown by activity type',
                  'What\'s my streak?',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setInput(s);
                      inputRef.current?.focus();
                    }}
                    className="block w-full text-left px-4 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <ChatMessage key={m.id} content={m.content} isUser={m.role === 'user'} />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-strava animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-strava animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-strava animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="glass rounded-2xl p-3 mt-4">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your activities..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-sm py-2 px-3"
              disabled={loading}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-4 py-2 rounded-xl bg-strava text-white font-medium text-sm hover:bg-strava-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
