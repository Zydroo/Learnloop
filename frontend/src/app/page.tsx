'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Bot, Brain, Zap, Award, 
  ChevronRight, Play, Users, 
  ShieldCheck, Sparkles, MessageSquare,
  User
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LandingPage() {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const currentUser = api.getCurrentUser();
    setUser(currentUser);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 px-6 md:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          LearnLoop
        </Link>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-foreground/60">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#ai" className="hover:text-primary transition-colors">AI Tutor</a>
          <a href="#community" className="hover:text-primary transition-colors">Community</a>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              <User className="w-4 h-4" />
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold hover:text-primary transition-colors">Login</Link>
              <Link href="/register" className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20">
                Join Now
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block">
              Next-Gen AI Learning Platform
            </span>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
              Learn <span className="text-primary italic">Smarter</span>,<br /> 
              Not Harder.
            </h1>
            <p className="text-xl text-foreground/50 max-w-2xl mx-auto leading-relaxed">
              Experience the world's first truly adaptive AI learning engine. From instant course generation to real-time tutoring, LearnLoop evolves with you.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Link href="/register" className="w-full md:w-auto px-10 py-5 bg-primary hover:bg-primary-hover text-white rounded-2xl text-lg font-black transition-all shadow-[0_20px_50px_-10px_rgba(139,92,246,0.5)] flex items-center justify-center gap-2 group">
              Start Learning Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full md:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-foreground border border-white/10 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              Watch Demo
            </button>
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-12 flex flex-wrap justify-center items-center gap-8 text-foreground/30 font-bold uppercase tracking-widest text-[10px]"
          >
            <div className="flex items-center gap-2"><Users className="w-4 h-4" /> 50k+ Active Students</div>
            <div className="flex items-center gap-2"><Award className="w-4 h-4" /> Accredited Certificates</div>
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> AI Verified Skills</div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-black">Built for the Modern Learner</h2>
            <p className="text-foreground/50 max-w-xl mx-auto">Our ecosystem is designed to maximize retention through interactive AI and social engagement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Bot, 
                title: 'Personalized AI Tutor', 
                desc: '24/7 AI tutor that knows your progress and answers questions based on your current course content.',
                color: 'from-blue-500/20 to-blue-600/20'
              },
              { 
                icon: Brain, 
                title: 'Adaptive Learning Path', 
                desc: 'Our engine analyzes your quiz scores and study habits to recommend exactly what to study next.',
                color: 'from-primary/20 to-secondary/20'
              },
              { 
                icon: Zap, 
                title: 'Instant Course Engine', 
                desc: 'Enter any topic or YouTube playlist, and LearnLoop instantly generates a structured course with quizzes.',
                color: 'from-orange-500/20 to-orange-600/20'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className={`p-10 rounded-[32px] glass border border-white/5 bg-gradient-to-br ${feature.color} space-y-6 group transition-all`}
              >
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-foreground/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tutor Callout */}
      <section id="ai" className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-black text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              AI-Powered Mastery
            </div>
            <h2 className="text-5xl font-black tracking-tight leading-[1.1]">
              Meet your new <br /> 
              <span className="text-primary italic">Personal Professor.</span>
            </h2>
            <p className="text-lg text-foreground/50 leading-relaxed">
              Don't just watch videos. Engage with them. Our AI-Tutor extracts knowledge from every lesson, allowing you to have deep conversations about the topic, clarify doubts, and generate summaries on the fly.
            </p>
            <ul className="space-y-4">
              {[
                'Context-aware chat',
                'Auto-generated Flashcards',
                'Deep Summary extraction',
                'AI-signed Certificates'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-foreground/70">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative glass-card p-8 border border-primary/30 shadow-2xl shadow-primary/20 rounded-[40px]"
            >
              <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold">LearnLoop AI</div>
                  <div className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Always active
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                  "I noticed you're struggling with the Recursion quiz. Would you like me to explain it using a visual analogy?"
                </div>
                <div className="bg-primary/20 p-4 rounded-2xl rounded-tr-none ml-auto max-w-[80%] text-sm text-primary font-bold">
                  "Yes please! That would be great."
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social proof Section */}
      <section id="community" className="py-24 px-6 bg-gradient-to-b from-transparent to-surface/20">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <h2 className="text-4xl font-black">Community & Recognition</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-8 space-y-4">
              <Trophy className="w-10 h-10 text-yellow-500 mx-auto" />
              <h4 className="font-bold text-xl">Leaderboards</h4>
              <p className="text-xs text-foreground/40">Compete with the world's best.</p>
            </div>
            <div className="glass-card p-8 space-y-4">
              <MessageSquare className="w-10 h-10 text-blue-500 mx-auto" />
              <h4 className="font-bold text-xl">Discussions</h4>
              <p className="text-xs text-foreground/40">Ask and answer at every lesson.</p>
            </div>
            <div className="glass-card p-8 space-y-4">
              <Award className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-xl">Certificates</h4>
              <p className="text-xs text-foreground/40">Professional, AI-verified credentials.</p>
            </div>
            <div className="glass-card p-8 space-y-4">
              <Zap className="w-10 h-10 text-orange-500 mx-auto" />
              <h4 className="font-bold text-xl">Streaks</h4>
              <p className="text-xs text-foreground/40">Build the daily learning habit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer className="py-24 px-6 text-center border-t border-white/5 space-y-12">
        <div className="space-y-6">
          <h2 className="text-5xl font-black tracking-tight">Ready to evolve?</h2>
          <p className="text-foreground/50 max-w-lg mx-auto">Join thousands of students building the future of their careers on LearnLoop.</p>
          <Link href="/register" className="inline-block px-12 py-6 bg-primary hover:bg-primary-hover text-white rounded-2xl text-xl font-black transition-all shadow-[0_20px_50px_-10px_rgba(139,92,246,0.5)]">
            Create Free Account
          </Link>
        </div>
        
        <div className="pt-12 text-foreground/20 text-xs font-bold uppercase tracking-widest">
          &copy; 2026 LearnLoop Platform. Powered by Google Gemini AI.
        </div>
      </footer>
    </div>
  );
}

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
