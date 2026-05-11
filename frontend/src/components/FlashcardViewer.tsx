'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronLeft, ChevronRight, Lightbulb, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Flashcard {
  id: string;
  front_text: string;
  back_text: string;
  difficulty: number;
}

interface FlashcardViewerProps {
  lessonId: string;
  lessonTitle?: string;
}

export default function FlashcardViewer({ lessonId, lessonTitle }: FlashcardViewerProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateCards = async () => {
    setLoading(true);
    try {
      const data = await api.generateFlashcards(lessonId);
      setCards(Array.isArray(data) ? data : data.flashcards || []);
      setGenerated(true);
    } catch (err: any) {
      console.error('Failed to generate flashcards:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.min(i + 1, cards.length - 1)), 200);
  };

  const prev = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.max(i - 1, 0)), 200);
  };

  if (!generated) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <Lightbulb className="w-12 h-12 text-warning mx-auto opacity-60" />
        <h3 className="text-xl font-bold">AI Flashcards</h3>
        <p className="text-sm text-foreground/40">Generate flashcards from {lessonTitle || 'this lesson'}</p>
        <button
          onClick={generateCards}
          disabled={loading}
          className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center space-x-2 mx-auto"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
          <span>{loading ? 'Generating...' : 'Generate Flashcards'}</span>
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return <div className="glass-card p-8 text-center text-foreground/40">No flashcards generated.</div>;
  }

  const card = cards[currentIndex];
  const difficultyColors = ['text-emerald-400', 'text-warning', 'text-danger'];

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/40 font-bold">Card {currentIndex + 1} of {cards.length}</span>
        <span className={`text-xs font-bold uppercase ${difficultyColors[(card.difficulty || 1) - 1]}`}>
          {['Easy', 'Medium', 'Hard'][(card.difficulty || 1) - 1]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="perspective-1000" onClick={() => setFlipped(!flipped)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${flipped}`}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8 min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/20 transition-colors"
          >
            <p className="text-xs uppercase tracking-wider text-foreground/30 font-bold mb-4">
              {flipped ? '💡 Answer' : '❓ Question'} — Tap to flip
            </p>
            <p className="text-lg font-medium leading-relaxed">
              {flipped ? card.back_text : card.front_text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button onClick={prev} disabled={currentIndex === 0} className="p-3 glass rounded-xl hover:bg-white/5 transition-all disabled:opacity-20">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => { setFlipped(false); setCurrentIndex(0); }} className="p-3 glass rounded-xl hover:bg-white/5 transition-all">
          <RotateCcw className="w-5 h-5" />
        </button>
        <button onClick={next} disabled={currentIndex === cards.length - 1} className="p-3 glass rounded-xl hover:bg-white/5 transition-all disabled:opacity-20">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
