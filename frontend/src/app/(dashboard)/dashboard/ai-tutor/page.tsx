'use client';

import React, { useEffect, useState } from 'react';
import { Bot, BookOpen, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import ChatInterface from '@/components/ChatInterface';

export default function AITutorPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await api.getConversations();
        setConversations(data);
      } catch (err) {
        // Conversations may not exist yet
      }
    };
    fetchConversations();
  }, []);



  return (
    <div className="space-y-6 h-[calc(100vh-6rem)]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Bot className="w-8 h-8 text-primary" />
            <span>Global AI Guide</span>
          </h1>
          <p className="text-foreground/50 mt-1">Your intelligent platform assistant — ask anything or create courses from YouTube playlists!</p>
        </div>
      </header>

      <div className="flex gap-6 h-[calc(100%-5rem)]">
        {/* Sidebar: Course selector + conversation history */}
        <div className="w-72 flex-shrink-0 space-y-4 overflow-y-auto">
          {/* Quick Actions */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/30">Capabilities</h3>
            <div className="space-y-2">
              <div className="p-3 bg-surface/30 rounded-xl text-sm border border-white/5 flex items-start space-x-3">
                <BookOpen className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-foreground/70">I can suggest the best courses for you.</span>
              </div>
              <div className="p-3 bg-surface/30 rounded-xl text-sm border border-white/5 flex items-start space-x-3">
                <Bot className="w-4 h-4 text-secondary mt-0.5" />
                <span className="text-foreground/70">Paste a YouTube Playlist URL and I'll generate a full course from it!</span>
              </div>
            </div>
          </div>

          {/* Recent Conversations */}
          {conversations.length > 0 && (
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/30">Recent Chats</h3>
              <div className="space-y-1">
                {conversations.slice(0, 5).map((conv: any) => (
                  <div key={conv.id} className="p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all">
                    <div className="flex items-center space-x-2 text-sm">
                      <MessageSquare className="w-3 h-3 text-foreground/30 flex-shrink-0" />
                      <span className="line-clamp-1 text-foreground/50">{conv.title}</span>
                    </div>
                    <p className="text-[10px] text-foreground/20 mt-1">{conv.message_count} messages</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-h-0">
          <ChatInterface isGlobal={true} />
        </div>
      </div>
    </div>
  );
}
