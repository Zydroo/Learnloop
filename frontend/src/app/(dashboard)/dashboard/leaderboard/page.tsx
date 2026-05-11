'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Zap, Star, Loader2, ArrowUp, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

export default function LeaderboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(api.getCurrentUser());
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        setStudents(data);
      } catch (err) {
        console.error('Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const topThree = students.slice(0, 3);
  const others = students.slice(3);

  return (
    <div className="space-y-12 pb-20">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
          <Trophy className="w-8 h-8 text-primary animate-bounce" />
        </div>
        <h1 className="text-4xl font-bold">Hall of Fame</h1>
        <p className="text-foreground/40 max-w-lg mx-auto">
          The top performers who are mastering their crafts and leading the way on LearnLoop.
        </p>
      </header>

      {/* Top 3 Podium */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-6 max-w-4xl mx-auto px-4">
        {/* Silver (2nd) */}
        {topThree[1] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 w-full order-2 md:order-1"
          >
            <div className="text-center mb-4">
              <Medal className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-bold truncate mt-2">{topThree[1].name}</div>
              <div className="text-xs text-primary font-bold">{topThree[1].xp} XP</div>
            </div>
            <div className="h-32 bg-white/5 border border-white/5 rounded-t-3xl flex items-center justify-center text-2xl font-bold text-foreground/20">
              2nd
            </div>
          </motion.div>
        )}

        {/* Gold (1st) */}
        {topThree[0] && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 w-full z-10 order-1 md:order-2"
          >
            <div className="text-center mb-4">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              <div className="text-xl font-bold truncate mt-2">{topThree[0].name}</div>
              <div className="text-sm text-primary font-bold">{topThree[0].xp} XP</div>
            </div>
            <div className="h-48 bg-gradient-to-t from-primary/20 to-primary/40 border-x border-t border-primary/30 rounded-t-3xl flex items-center justify-center text-4xl font-black text-white shadow-[0_-20px_50px_-10px_rgba(139,92,246,0.3)]">
              1st
            </div>
          </motion.div>
        )}

        {/* Bronze (3rd) */}
        {topThree[2] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 w-full order-3"
          >
            <div className="text-center mb-4">
              <Medal className="w-8 h-8 text-orange-600 mx-auto" />
              <div className="font-bold truncate mt-2">{topThree[2].name}</div>
              <div className="text-xs text-primary font-bold">{topThree[2].xp} XP</div>
            </div>
            <div className="h-24 bg-white/5 border border-white/5 rounded-t-3xl flex items-center justify-center text-2xl font-bold text-foreground/20">
              3rd
            </div>
          </motion.div>
        )}
      </div>

      {/* Leaderboard Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card max-w-4xl mx-auto overflow-hidden"
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-foreground/40">Rank</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-foreground/40">Student</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-foreground/40 text-center">Streak</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-foreground/40 text-right">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {others.map((student) => (
              <tr 
                key={student.id} 
                className={`hover:bg-white/5 transition-colors ${student.id === user?.id ? 'bg-primary/5' : ''}`}
              >
                <td className="p-6">
                  <span className="font-mono text-foreground/30">#{student.rank}</span>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-xs font-bold text-primary">
                      {student.name[0]}
                    </div>
                    <div>
                      <span className="font-bold">{student.name}</span>
                      {student.id === user?.id && <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded uppercase font-black">You</span>}
                    </div>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <span className="flex items-center justify-center gap-1 font-bold text-secondary">
                    <Zap className="w-3.5 h-3.5" />
                    {student.streak}
                  </span>
                </td>
                <td className="p-6 text-right font-black text-primary">
                  {student.xp.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
