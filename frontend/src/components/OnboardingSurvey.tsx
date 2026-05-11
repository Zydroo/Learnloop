'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Sparkles, Brain, 
  Rocket, ChevronRight, Loader2,
  CheckCircle2, Stars
} from 'lucide-react';
import { api } from '@/lib/api';

interface OnboardingSurveyProps {
  onComplete: () => void;
}

export default function OnboardingSurvey({ onComplete }: OnboardingSurveyProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({

    goals: '',
    interests: [] as string[],
    level: 'Beginner'
  });

  const goals = [
    { id: 'career', label: 'Career Change', icon: Rocket },
    { id: 'hobby', label: 'Personal Hobby', icon: Sparkles },
    { id: 'skill', label: 'Skill Upgrade', icon: Target },
    { id: 'academic', label: 'Academic Support', icon: Brain },
  ];

  const topics = [
    'Coding', 'Design', 'Trading', 'Marketing', 
    'Photography', 'Business', 'Music', 'AI/ML'
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  const toggleInterest = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(topic)
        ? prev.interests.filter(t => t !== topic)
        : [...prev.interests, topic]
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.submitOnboarding(formData);
      onComplete();
    } catch (err: any) {
      console.error('Failed to submit onboarding');
      setError(err.message || 'AI calculation failed. Please ensure you have published courses and try again.');
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl glass-card overflow-hidden border border-primary/20 shadow-[0_0_100px_rgba(var(--primary-rgb),0.1)]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-primary/5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Stars className="w-6 h-6 text-primary" />
              Tailor Your Journey
            </h2>
            <p className="text-foreground/40 text-sm mt-1 font-medium">Let AI craft your perfect curriculum.</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-8 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'bg-white/10'}`} 
              />
            ))}
          </div>
        </div>

        <div className="p-10 min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">What's your primary goal?</h3>
                  <p className="text-foreground/40 text-sm">This helps us prioritize the right content for you.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setFormData({ ...formData, goals: goal.label })}
                      className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                        formData.goals === goal.label 
                        ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' 
                        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <goal.icon className={`w-8 h-8 ${formData.goals === goal.label ? 'text-primary' : 'text-foreground/20 group-hover:text-foreground/40'} transition-colors`} />
                      <span className="text-sm font-bold uppercase tracking-widest">{goal.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">Pick your interests</h3>
                  <p className="text-foreground/40 text-sm">Select at least 2 topics that excite you.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => toggleInterest(topic)}
                      className={`px-6 py-3 rounded-xl border font-bold transition-all ${
                        formData.interests.includes(topic)
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : 'bg-white/5 border-white/10 text-foreground/40 hover:border-white/30'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">What's your experience?</h3>
                  <p className="text-foreground/40 text-sm">We'll adjust the difficulty of our recommendations.</p>
                </div>
                <div className="space-y-3">
                  {levels.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setFormData({ ...formData, level: lvl })}
                      className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                        formData.level === lvl
                        ? 'bg-primary/10 border-primary'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="font-bold">{lvl}</span>
                      {formData.level === lvl && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}
        </div>


        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all text-foreground/40"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={loading || (step === 1 && !formData.goals) || (step === 2 && formData.interests.length === 0)}
            className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI is calculating...</span>
              </>
            ) : (
              <>
                <span>{step === 3 ? 'Get Recommendations' : 'Continue'}</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
