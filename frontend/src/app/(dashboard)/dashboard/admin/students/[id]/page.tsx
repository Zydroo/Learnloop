'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Mail, Clock, Calendar, 
  Award, Zap, BookOpen, Activity, 
  CheckCircle, Loader2, ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

export default function StudentInsightsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const details = await api.getStudentDetails(id);
        setData(details);
      } catch (err) {
        console.error('Failed to load student details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Student not found</h2>
        <button onClick={() => router.back()} className="mt-4 text-primary hover:underline flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const { profile, courses, activity, quizzes } = data;

  const formatSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-foreground/40 hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Students</span>
        </button>
        <div className="text-xs text-foreground/30 font-mono">ID: {profile.id}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary mx-auto mb-4 border-4 border-white/5 shadow-2xl shadow-primary/20">
              {profile.name[0]}
            </div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-foreground/40 flex items-center justify-center gap-2 mt-1">
              <Mail className="w-3 h-3" /> {profile.email}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Total XP</span>
                </div>
                <div className="text-2xl font-bold">{profile.xp}</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-center gap-2 text-secondary mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Streak</span>
                </div>
                <div className="text-2xl font-bold">{profile.streak}🔥</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/40 flex items-center gap-2"><Clock className="w-4 h-4" /> Total Learning Time</span>
                <span className="font-bold">{formatSeconds(profile.totalTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/40 flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined Platform</span>
                <span className="font-bold">{format(new Date(profile.joined), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{courses.length}</div>
                <div className="text-xs text-foreground/40 font-bold uppercase tracking-widest">Enrolled Courses</div>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{quizzes.length}</div>
                <div className="text-xs text-foreground/40 font-bold uppercase tracking-widest">Quizzes Attempted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Insights & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrolled Courses Progress */}
          <section className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Course Progression
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {courses.length === 0 ? (
                <div className="p-12 text-center text-foreground/20 italic">No courses enrolled yet.</div>
              ) : (
                courses.map((course: any, i: number) => (
                  <div key={i} className="p-6 flex items-center justify-between gap-6 hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{course.title}</h3>
                      <div className="text-xs text-foreground/40 mt-1">Enrolled: {format(new Date(course.enrolled_at), 'MMM d, yyyy')}</div>
                    </div>
                    <div className="w-48">
                      <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                        <span className="text-foreground/40">Completion</span>
                        <span className={course.completion_percentage >= 100 ? 'text-secondary' : 'text-primary'}>
                          {Math.round(course.completion_percentage || 0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${course.completion_percentage >= 100 ? 'bg-secondary' : 'bg-primary'}`}
                          style={{ width: `${course.completion_percentage || 0}%` }}
                        />
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      course.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="glass-card flex flex-col h-[600px]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary" />
                Detailed Activity Log
              </h2>
              <div className="text-xs text-foreground/30 font-medium">Last 50 actions</div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {activity.length === 0 ? (
                <div className="h-full flex items-center justify-center text-foreground/20 italic">No activity logs found.</div>
              ) : (
                activity.map((log: any, i: number) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== activity.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-white/5" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                      log.action_type.includes('VIDEO') ? 'bg-blue-500/20 text-blue-400' :
                      log.action_type.includes('QUIZ') ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-primary/20 text-primary'
                    }`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold truncate">
                          {log.action_type.replace(/_/g, ' ')}
                        </h4>
                        <span className="text-[10px] text-foreground/30 font-mono">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </span>
                      </div>
                      <div className="text-xs text-foreground/50 mt-0.5">
                        {format(new Date(log.created_at), 'MMMM d, yyyy')}
                      </div>
                      {log.metadata && (
                        <div className="mt-2 p-3 bg-white/5 rounded-xl text-[10px] font-mono text-foreground/40 break-words border border-white/5">
                          {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quiz Performance History */}
          <section className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Quiz Performance
              </h2>
            </div>
            <div className="p-6">
              {quizzes.length === 0 ? (
                <div className="text-center py-12 text-foreground/20 italic">No quiz attempts recorded.</div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="text-xs text-foreground/30 w-24 font-mono">
                        {format(new Date(quiz.attempted_at), 'MMM d')}
                      </div>
                      <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${quiz.score_percentage}%` }}
                          className={`h-full rounded-r-md ${
                            quiz.score_percentage >= 80 ? 'bg-emerald-500/30 border-r-2 border-emerald-500' :
                            quiz.score_percentage >= 50 ? 'bg-orange-500/30 border-r-2 border-orange-500' :
                            'bg-red-500/30 border-r-2 border-red-500'
                          }`}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold">
                          {Math.round(quiz.score_percentage)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
