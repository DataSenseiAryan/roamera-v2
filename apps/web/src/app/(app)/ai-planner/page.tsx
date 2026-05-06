'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, Download, DollarSign, Loader2, Map } from 'lucide-react';
import { useAIPlan, useOptimizeBudget, streamRefinePlan } from '@roamera/sdk';
import type { AIItinerary, ChatMessage } from '@roamera/types';
import { ChatMessageBubble } from '@/components/ai/chat-message';
import { ItineraryCard } from '@/components/ai/itinerary-card';

const QUICK_PROMPTS = [
  '5 days in Goa, beach budget trip',
  '3 days in Rajasthan, heritage luxury',
  '7 days in Himachal, trekking adventure',
  'Weekend in Coorg, nature moderate budget',
];

export default function AIPlannerPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm your Roamera AI travel planner. Tell me where you want to go, for how many days, and your budget — I'll craft a personalized itinerary for you.\n\nExample: \"Plan 5 days in Goa with a budget of ₹20,000\"",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [currentItinerary, setCurrentItinerary] = useState<AIItinerary | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const planMutation = useAIPlan();
  const optimizeMutation = useOptimizeBudget();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const parseDestinationFromInput = (text: string) => {
    const nightsMatch = text.match(/(\d+)\s*(?:days?|nights?)/i);
    const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : 3;

    const budgetMatch = text.match(/(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:k|thousand)?/i);
    let budget: string | undefined;
    if (budgetMatch) {
      const val = parseInt(budgetMatch[1].replace(',', ''), 10);
      if (val < 5000) budget = 'budget';
      else if (val < 20000) budget = 'moderate';
      else budget = 'luxury';
    }

    const destMatch = text.match(/(?:in|to|at|visit)\s+([A-Za-z\s,]+?)(?:\s*,|\s+for|\s+with|\s+on|\s*$)/i);
    const destination = destMatch ? destMatch[1].trim() : undefined;

    return { destination, nights: Math.min(nights, 14), budgetBand: budget };
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || planMutation.isPending || isStreaming) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // If there's an existing itinerary, treat this as a refinement
    if (currentItinerary) {
      const thinkingMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Refining your itinerary...',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, thinkingMsg]);
      setIsStreaming(true);
      setStreamingContent('');

      let chunks = '';
      await streamRefinePlan(currentItinerary, text, {
        onChunk: (chunk) => {
          chunks += chunk;
          setStreamingContent(chunks);
        },
        onDone: (itinerary) => {
          setIsStreaming(false);
          setStreamingContent('');
          if (itinerary) {
            setCurrentItinerary(itinerary);
            setMessages((prev) => [
              ...prev.slice(0, -1),
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `I've updated the itinerary based on your request: "${text}". The changes are reflected in the plan below.`,
                itinerary,
                createdAt: new Date().toISOString(),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev.slice(0, -1),
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'I had trouble refining the plan. Please try again with a different request.',
                createdAt: new Date().toISOString(),
              },
            ]);
          }
        },
        onError: (err) => {
          setIsStreaming(false);
          setStreamingContent('');
          setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `Sorry, I couldn't refine the plan: ${err.message}`,
              createdAt: new Date().toISOString(),
            },
          ]);
        },
      });
    } else {
      // Generate new plan
      const { destination, nights, budgetBand } = parseDestinationFromInput(text);

      try {
        const result = await planMutation.mutateAsync({
          prompt: text,
          destination,
          nights,
          budgetBand: (budgetBand ?? 'moderate') as 'budget' | 'moderate' | 'luxury',
          currency: 'INR',
          preferences: [],
        });

        setCurrentItinerary(result.itinerary);

        const totalCost = result.itinerary.totalEstimatedCost;
        const summary = [
          `Here's your ${result.itinerary.nights}-night itinerary for **${result.itinerary.destination}**!`,
          totalCost ? `Estimated total: ₹${totalCost.toLocaleString('en-IN')}` : null,
          result.itinerary.bestTimeToVisit ? `Best time to visit: ${result.itinerary.bestTimeToVisit}` : null,
          result.itinerary.tips?.length
            ? `\nPro tips:\n${result.itinerary.tips.map((t) => `• ${t}`).join('\n')}`
            : null,
          '\nYou can ask me to refine it — e.g., "make it cheaper", "add adventure activities", or "extend by 2 days".',
        ]
          .filter(Boolean)
          .join('\n');

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: summary,
            itinerary: result.itinerary,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              "Sorry, I couldn't generate a plan right now. Please try again in a moment — the AI service might be starting up.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    }
  }, [input, planMutation, isStreaming, currentItinerary]);

  const handleOptimize = async () => {
    if (!currentItinerary) return;
    try {
      const result = await optimizeMutation.mutateAsync({
        itinerary: currentItinerary,
        newBudget: 10000,
        currency: 'INR',
      });
      setCurrentItinerary(result.itinerary);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I've optimized your budget! Switched to budget-friendly accommodation and local food options.",
          itinerary: result.itinerary,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {}
  };

  const handleExport = () => {
    if (!currentItinerary) return;
    const content = JSON.stringify(currentItinerary, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roamera-trip-${currentItinerary.destination.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = planMutation.isPending || isStreaming;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5rem)]">
      {/* Chat Panel */}
      <div className="flex flex-col flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white">AI Trip Planner</h1>
            <p className="text-xs text-slate-500">Powered by Gemini 2.0 Flash</p>
          </div>
          {currentItinerary && (
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleOptimize}
                disabled={optimizeMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 rounded-lg hover:bg-orange-100 transition disabled:opacity-50"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Optimize Budget
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem('aiItinerary', JSON.stringify(currentItinerary));
                  router.push('/trips?importPlan=true');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400 rounded-lg hover:bg-teal-100 transition"
              >
                <Map className="h-3.5 w-3.5" />
                Save as Trip
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && streamingContent && (
            <ChatMessageBubble
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
                createdAt: new Date().toISOString(),
              }}
              isStreaming
            />
          )}
          {planMutation.isPending && !isStreaming && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Crafting your itinerary...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="px-3 py-1.5 text-xs rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={
                currentItinerary
                  ? 'Refine the plan — "make it cheaper", "add adventure"...'
                  : 'Where do you want to go? "5 days in Tokyo, ₹30k budget"'
              }
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 flex-shrink-0 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Itinerary Panel */}
      {currentItinerary && (
        <div className="w-full lg:w-96 overflow-y-auto space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">
              {currentItinerary.destination} · {currentItinerary.nights} nights
            </h2>
            {currentItinerary.totalEstimatedCost && (
              <span className="text-sm text-slate-500">
                ₹{currentItinerary.totalEstimatedCost.toLocaleString('en-IN')} total
              </span>
            )}
          </div>
          {currentItinerary.days.map((day) => (
            <ItineraryCard key={day.dayNumber} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}
