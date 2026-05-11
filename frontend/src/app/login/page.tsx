'use client';

import React, { useState } from 'react';
import { Mail, Lock, LogIn, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-card p-8 space-y-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            LearnLoop
          </h1>
          <p className="mt-2 text-foreground/60">Welcome back! Please login to your account.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-surface/30 border border-white/5 rounded-xl text-foreground placeholder-foreground/30 glow-focus transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-surface/30 border border-white/5 rounded-xl text-foreground placeholder-foreground/30 glow-focus transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-foreground/40">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button className="flex items-center justify-center py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-foreground/80 font-medium">
            <Globe className="mr-2 h-5 w-5" /> GitHub
          </button>
        </div>

        <p className="text-center text-sm text-foreground/60">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:text-primary-hover font-semibold transition-colors">
            Register now
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
