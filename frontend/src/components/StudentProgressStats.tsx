'use client';

import React, { useEffect, useState } from 'react';
import { 
  Trophy, Clock, Flame, 
  CheckCircle2, TrendingUp, 
  BarChart3, Loader2 
} from 'lucide-react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

export default function StudentProgressStats() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const progress = await api.getMyProgress();
        setData(progress);
      } catch (err) {
        console.error('Failed to fetch progress');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs text-foreground/40 font-medium">Analyzing your progress...</p>
      </div>
    );
  }

  if (!data) return null;

  const { stats, courses } = data;
  
  // Calculate total progress
  const totalLessons = courses.reduce((acc: number, c: any) => acc + (c.total_lessons || 0), 0);
  const completedLessons = courses.reduce((acc: number, c: any) => acc + (c.completed_lessons || 0), 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Format session time (seconds to hours/minutes)
  const hours = Math.floor((stats?.total_session_time_seconds || 0) / 3600);
  const minutes = Math.floor(((stats?.total_session_time_seconds || 0) % 3600) / 60);

  return (
    <div className="space-y-4">
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-4 bg-primary/5 border-primary/20 flex flex-col items-center text-center"
        >
          <Flame className="w-5 h-5 text-orange-500 mb-2" />
          <span className="text-xl font-black text-foreground">{stats?.current_streak || 0}</span>
          <span className="text-[10px] uppercase font-bold text-foreground/30">Day Streak</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 bg-secondary/5 border-secondary/20 flex flex-col items-center text-center"
        >
          <Clock className="w-5 h-5 text-secondary mb-2" />
          <span className="text-xl font-black text-foreground">{hours}h {minutes}m</span>
          <span className="text-[10px] uppercase font-bold text-foreground/30">Study Time</span>
        </motion.div>
      </div>

      {/* Level & XP */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold">Level {stats?.level || 1}</span>
          </div>
          <span className="text-[10px] font-bold text-foreground/30">{stats?.xp || 0} XP Total</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000" 
            style={{ width: `${Math.min(100, ((stats?.xp || 0) % 50) * 2)}%` }} 
          />
        </div>
        <p className="text-[9px] text-foreground/20 text-center uppercase tracking-widest font-bold">
          Next level in {50 - ((stats?.xp || 0) % 50)} XP
        </p>
      </div>

      {/* Course Completion Progress */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/30 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Course Completion
        </h3>
        
        <div className="space-y-4">
          {courses.length === 0 ? (
            <p className="text-[10px] text-foreground/20 italic">No courses started yet.</p>
          ) : (
            courses.map((course: any, i: number) => (
              <div key={course.course_id} className="space-y-2">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="truncate flex-1 pr-2">{course.title}</span>
                  <span className="text-primary">{Math.round((course.completed_lessons / course.total_lessons) * 100)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-700" 
                    style={{ width: `${(course.completed_lessons / course.total_lessons) * 100}%` }} 
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] text-foreground/20 font-medium pb-2">
        <TrendingUp className="w-3 h-3" />
        <span>Keep it up! You're in the top 10% this week.</span>
      </div>
    </div>
  );
}
