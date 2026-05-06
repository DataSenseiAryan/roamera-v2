'use client';

import { Sparkles, User } from 'lucide-react';
import type { ChatMessage } from '@roamera/types';

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatMessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-teal-600 text-white'
            : 'bg-gradient-to-br from-teal-500 to-coral-500 text-white'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-teal-600 text-white rounded-tr-md'
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm rounded-tl-md'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current opacity-70 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
