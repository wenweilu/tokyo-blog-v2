'use client';
import { useState, useRef, useEffect } from 'react';
import { Place } from '../../types';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const SUGGESTIONS = [
  'Where should I go for coffee in Shibuya?',
  'Recommend a quiet bar for tonight',
  'Best place for a rainy afternoon?',
  'Where can I find good jazz?',
];

interface Props {
  places: Place[];
  onClose: () => void;
}

export default function TripPlanner({ places, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `I know all ${places.length} places in your Tokyo list. Ask me anything — recommendations, what's nearby, what to do tonight.` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'plan', question, places }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.text || data.error || 'Sorry, something went wrong.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Could not reach Gemini. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/25 backdrop-blur-[2px]"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-[480px] flex flex-col overflow-hidden shadow-2xl shadow-black/10" style={{ height: '80vh', maxHeight: 600 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[15px] text-gray-900 leading-none">Tokyo Planner</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-700 p-1.5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="text-[11px] px-3 py-1.5 border border-gray-200 rounded-full text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-all active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-purple-300 transition-colors">
            <input
              type="text"
              placeholder="Ask about your Tokyo places…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask(input)}
              className="flex-1 bg-transparent text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none"
            />
            <button
              onClick={() => ask(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center disabled:opacity-30 transition-all active:scale-95 hover:bg-purple-700"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}