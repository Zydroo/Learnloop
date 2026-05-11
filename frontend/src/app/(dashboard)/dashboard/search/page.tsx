'use client';

import React, { useState } from 'react';
import { Search as SearchIcon, BookOpen, Video, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchType, setSearchType] = useState<'lessons' | 'video'>('lessons');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const data = searchType === 'video' 
        ? await api.searchVideo(query)
        : await api.searchLessons(query);
      setResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-black">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI Search</span>
        </h1>
        <p className="text-foreground/50">Ask anything — I'll find exactly where it was taught</p>
      </header>

      {/* Search Bar */}
      <div className="glass-card p-2 flex items-center space-x-2">
        <div className="flex space-x-1 flex-shrink-0">
          <button
            onClick={() => setSearchType('lessons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              searchType === 'lessons' ? 'bg-primary/20 text-primary' : 'text-foreground/40 hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1" /> Lessons
          </button>
          <button
            onClick={() => setSearchType('video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              searchType === 'video' ? 'bg-secondary/20 text-secondary' : 'text-foreground/40 hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4 inline mr-1" /> Videos
          </button>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchType === 'video' ? 'Where was interrupts explained?' : 'Search across all lessons...'}
          className="flex-1 bg-transparent text-lg outline-none placeholder-foreground/20 px-4 py-3"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="p-3 bg-primary hover:bg-primary-hover rounded-xl transition-all disabled:opacity-30 shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {searched && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-foreground/40 mt-4">Searching with AI...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="glass-card p-8 text-center text-foreground/40">
                No results found for "{query}"
              </div>
            ) : (
              <>
                <p className="text-sm text-foreground/30 font-bold">{results.length} result(s) found</p>
                {results.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-5 hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <h3 className="font-bold text-sm">{r.lesson_title}</h3>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                            {r.relevance}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/50 leading-relaxed line-clamp-3">{r.snippet}</p>
                        {r.video_url && (
                          <p className="text-xs text-secondary mt-2 font-bold">📹 Has video</p>
                        )}
                      </div>
                      <Link href={`/dashboard/courses/${r.course_id}?lesson=${r.lesson_id}`} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
