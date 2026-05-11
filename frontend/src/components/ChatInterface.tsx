'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { lesson_title: string; relevance: string }[];
  youtube_suggestions?: { id: string; title: string; description: string; url: string; thumbnail: string }[];
}

interface ChatInterfaceProps {
  courseId?: string;
  courseName?: string;
  isGlobal?: boolean;
}

export default function ChatInterface({ courseId, courseName, isGlobal = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseGenerating, setCourseGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const triggerCourseGeneration = async (playlistUrl: string, title: string, description: string, thumbnail: string) => {
    setCourseGenerating(true);
    try {
      const playlistData = await api.parsePlaylist(playlistUrl);
      await api.createCourse({
        title: title || `AI Generated Course`,
        description: description || `This course was automatically generated.`,
        category: 'General',
        price: '0',
        thumbnail_url: playlistData.thumbnail || thumbnail,
        lessons: playlistData.lessons,
        is_private: true
      });
      
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_success',
        role: 'assistant',
        content: `✅ **Course Successfully Created!**\nI have finished generating **${title}**. You can view and enroll in it directly from your dashboard.`
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_fail',
        role: 'assistant',
        content: `⚠️ I tried to generate the course, but I encountered an error: ${err.message}`
      }]);
    } finally {
      setCourseGenerating(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = isGlobal 
        ? await api.askGlobalAI(input, conversationId || undefined)
        : await api.askAI(courseId!, input, conversationId || undefined);
      
      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const aiMsg: Message = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        youtube_suggestions: res.youtube_suggestions
      };

      setMessages(prev => [...prev, aiMsg]);

      // If the AI detected a YouTube playlist URL, let's create a course!
      if (isGlobal && res.create_course_url) {
        triggerCourseGeneration(res.create_course_url, "AI Generated Course from YouTube", "Automatically generated from playlist.", "");
      }

    } catch (err: any) {
      const errorMsg: Message = {
        id: Date.now().toString() + '_err',
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center space-x-3">
        <div className="p-2 bg-primary/20 rounded-xl">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">{isGlobal ? 'Global Platform Guide' : 'LearnLoop AI Tutor'}</h3>
          <p className="text-xs text-foreground/40">{isGlobal ? 'Ask anything or paste a YouTube Playlist URL' : courseName || 'Ask me anything about this course'}</p>
        </div>
        <div className="ml-auto flex items-center space-x-1 text-xs text-emerald-400">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
            <Sparkles className="w-12 h-12 text-primary/40" />
            <div>
              <p className="font-bold text-lg">Ask me anything!</p>
              <p className="text-sm text-foreground/40 mt-1">
                {isGlobal 
                  ? "I can guide you through the platform, suggest courses, or even create a brand new course if you paste a YouTube Playlist URL!"
                  : "I know the course material inside out."}
              </p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                <div className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${msg.role === 'user' ? 'bg-primary/20' : 'bg-secondary/20'}`}>
                    {msg.role === 'user' 
                      ? <User className="w-4 h-4 text-primary" />
                      : <Bot className="w-4 h-4 text-secondary" />
                    }
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary/20 border border-primary/10' 
                      : 'bg-surface/50 border border-white/5'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    
                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-foreground/30 font-bold">Sources</p>
                        {msg.sources.map((s, i) => (
                          <div key={i} className="flex items-center space-x-1.5 text-xs text-foreground/40">
                            <BookOpen className="w-3 h-3" />
                            <span>{s.lesson_title}</span>
                            <span className="text-primary font-bold">{s.relevance}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* YouTube Suggestions */}
                    {msg.youtube_suggestions && msg.youtube_suggestions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                        <p className="text-xs uppercase tracking-wider text-primary font-bold">Found on YouTube</p>
                        <div className="grid grid-cols-1 gap-3">
                          {msg.youtube_suggestions.map((yt, i) => (
                            <div key={i} className="bg-surface/50 border border-white/10 rounded-xl overflow-hidden flex flex-col group hover:border-primary/50 transition-colors">
                              {yt.thumbnail && (
                                <div className="h-32 w-full overflow-hidden bg-surface-hover">
                                  <img src={yt.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                              )}
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-sm line-clamp-2">{yt.title}</h4>
                                </div>
                                <button 
                                  onClick={() => triggerCourseGeneration(yt.url, yt.title, yt.description, yt.thumbnail)}
                                  disabled={courseGenerating}
                                  className="mt-4 w-full py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  <span>Generate Course</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2 text-foreground/40">
            <div className="p-1.5 bg-secondary/20 rounded-lg">
              <Bot className="w-4 h-4 text-secondary" />
            </div>
            <div className="flex space-x-1">
              <span className="w-2 h-2 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}

        {courseGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-3 text-emerald-400 p-4 border border-emerald-400/20 bg-emerald-400/10 rounded-2xl">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold">Parsing YouTube Playlist and generating full course curriculum... This may take a moment.</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGlobal ? "Ask anything or paste a YouTube Playlist URL..." : "Ask a question about this course..."}
            rows={1}
            className="flex-1 bg-surface/30 border border-white/5 rounded-xl px-4 py-3 text-sm glow-focus resize-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || courseGenerating}
            className="p-3 bg-primary hover:bg-primary-hover rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-primary/20"
          >
            {loading || courseGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
