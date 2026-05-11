'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Brain, Loader2, Trophy } from 'lucide-react';
import { api } from '@/lib/api';

interface Question {
  question: string;
  type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface QuizViewerProps {
  lessonId: string;
  lessonTitle?: string;
}

export default function QuizViewer({ lessonId, lessonTitle }: QuizViewerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const data = await api.generateQuiz(lessonId, { questionCount: 5, type: 'mixed' });
      setQuestions(data.questions || []);
      setStarted(true);
    } catch (err: any) {
      console.error('Quiz generation failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);

    const isCorrect = option === questions[currentQ].correct_answer;
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => [...prev, isCorrect]);
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  // Not started yet
  if (!started) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <Brain className="w-12 h-12 text-secondary mx-auto opacity-60" />
        <h3 className="text-xl font-bold">AI Quiz</h3>
        <p className="text-sm text-foreground/40">Test your knowledge of {lessonTitle || 'this lesson'}</p>
        <button
          onClick={startQuiz}
          disabled={loading}
          className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-white rounded-xl font-bold transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 flex items-center space-x-2 mx-auto"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          <span>{loading ? 'Generating...' : 'Start Quiz'}</span>
        </button>
      </div>
    );
  }

  // Finished
  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center space-y-6">
        <Trophy className={`w-16 h-16 mx-auto ${percentage >= 80 ? 'text-warning' : percentage >= 50 ? 'text-secondary' : 'text-danger'}`} />
        <h3 className="text-3xl font-black">{percentage}%</h3>
        <p className="text-foreground/50">{score} out of {questions.length} correct</p>
        <p className="text-sm font-bold">
          {percentage >= 80 ? '🔥 Excellent! You mastered this!' : percentage >= 50 ? '👍 Good job, keep practicing!' : '📚 Review the lesson and try again!'}
        </p>

        {/* Answer summary */}
        <div className="flex justify-center space-x-2 pt-4">
          {answers.map((correct, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-danger/20 text-danger'}`}>
              {i + 1}
            </div>
          ))}
        </div>

        <button
          onClick={() => { setStarted(false); setFinished(false); setScore(0); setCurrentQ(0); setAnswers([]); setSelected(null); setShowResult(false); }}
          className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all mt-4"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  const q = questions[currentQ];

  if (!q) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <p className="text-danger font-bold">Error loading question data.</p>
        <button onClick={() => { setStarted(false); setFinished(false); }} className="px-6 py-2 bg-primary rounded-xl text-white text-sm font-bold">Back to Quiz Menu</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/40 font-bold">Question {currentQ + 1} of {questions.length}</span>
        <span className="text-primary font-bold">Score: {score}</span>
      </div>

      <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full" animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="glass-card p-6 space-y-4">
        <p className="text-lg font-bold leading-relaxed">{q.question}</p>

        <div className="space-y-2">
          {(!q.options || q.options.length === 0) ? (
             <div className="p-4 bg-danger/10 text-danger text-sm rounded-xl border border-danger/20 text-center">
                This question was generated without options. Please skip.
             </div>
          ) : (
            q.options.map((option, i) => {
              const isSelected = selected === option;
              const isCorrect = option === q.correct_answer;
              let bg = 'bg-surface/30 border-white/5 hover:bg-white/5';
              if (showResult && isCorrect) bg = 'bg-emerald-500/20 border-emerald-500/30';
              if (showResult && isSelected && !isCorrect) bg = 'bg-danger/20 border-danger/30';

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center space-x-3 ${bg}`}
                >
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-sm">{option}</span>
                  {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-danger flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Fallback Skip Button if no options */}
        {(!q.options || q.options.length === 0) && !showResult && (
           <button onClick={() => { setShowResult(true); nextQuestion(); }} className="w-full py-3 bg-surface hover:bg-surface-hover text-white rounded-xl font-bold transition-all border border-white/10">
             Skip Invalid Question
           </button>
        )}

        {/* Explanation */}
        {showResult && q.explanation && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-primary/10 border border-primary/10 rounded-xl text-sm text-foreground/70">
            <span className="font-bold text-primary">Explanation: </span>{q.explanation}
          </motion.div>
        )}

        {showResult && (
          <button onClick={nextQuestion} className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all">
            {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}
