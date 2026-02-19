'use client';

import Link from 'next/link';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
}

function parseAssistantContent(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  const regex = /\[([^\]]+)\]\(\/activities\/(\d+)\)|\*\*([^*]+)\*\*|_([^_]+)_/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    if (match[1] && match[2]) {
      nodes.push(
        <Link
          key={key++}
          href={`/activities/${match[2]}`}
          className="text-strava dark:text-strava-muted font-medium hover:underline"
        >
          {match[1]}
        </Link>
      );
    } else if (match[3]) {
      nodes.push(
        <strong key={key++} className="font-semibold text-slate-900 dark:text-white">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      nodes.push(
        <em key={key++} className="text-slate-500 dark:text-slate-400 italic">
          {match[4]}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return nodes.length > 0 ? nodes : [text];
}

export default function ChatMessage({ content, isUser }: ChatMessageProps) {
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-strava text-white px-4 py-3 shadow-soft">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-md glass px-4 py-3">
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {parseAssistantContent(content)}
        </div>
      </div>
    </div>
  );
}
