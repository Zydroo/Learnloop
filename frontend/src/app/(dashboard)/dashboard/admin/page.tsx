'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, BookOpen, TrendingUp, 
  ArrowUpRight, Clock, CheckCircle, 
  XCircle, Plus, LayoutDashboard,
  ExternalLink, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Stats {
  totalStudents: number;
  activeCourses: number;
  recentCourses: any[];
  avgProgression: string;
  engagement: number[];
  trends: {
    students: string;
    courses: string;
    progression: string;
  };
}

interface Activity {
  name: string;
  action: string;
  time: string;
}

export default function EnhancedAdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminActivity()
      ]);
      setStats(statsData);
      setActivities(activityData);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePublish = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      await api.updateCourseStatus(courseId, true);
      await fetchData(); // Refresh
    } catch (err) {
      console.error('Failed to publish course');
    } finally {
      setActionLoading(null);
    }
  };

  const statConfig = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: stats?.trends.students },
    { label: 'Published Courses', value: stats?.activeCourses || 0, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10', trend: stats?.trends.courses },
    { label: 'Avg. Progression', value: stats?.avgProgression || '0%', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10', trend: stats?.trends.progression },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
        <p className="text-foreground/30 font-bold uppercase tracking-widest text-xs">Assembling Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Admin Overview</h1>
          <p className="text-foreground/50">Master control for LearnLoop ecosystem.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin/create" className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Create Course
          </Link>
          <button className="p-3 glass hover:bg-white/5 text-foreground/40 rounded-2xl transition-all border border-white/5">
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statConfig.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-8 flex flex-col justify-between group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className={`p-4 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <span className="text-xs font-black text-emerald-400 flex items-center bg-emerald-400/10 px-2 py-1 rounded-lg">
                {stat.trend} <ArrowUpRight className="w-3 h-3 ml-1" />
              </span>
            </div>
            <div className="mt-8">
              <p className="text-xs text-foreground/30 font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-4xl font-black mt-2 tracking-tighter">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Course Management Section */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Manage Courses
            </h3>
            <Link href="/dashboard/courses" className="text-xs font-bold text-primary hover:underline">View All</Link>
          </div>

          <div className="space-y-4">
            {stats?.recentCourses && stats.recentCourses.length > 0 ? (
              stats.recentCourses.map((course) => (
                <motion.div 
                  key={course.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-5 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-surface-hover">
                      {course.thumbnail_url && <img src={course.thumbnail_url} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{course.title}</h4>
                      <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest mt-1">
                        ID: {course.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
                      href={`/dashboard/admin/edit/${course.id}`}
                      className="p-2 bg-white/5 hover:bg-white/10 text-foreground/60 rounded-xl transition-all"
                      title="Edit Course"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </Link>
                    <button 
                      onClick={async () => {
                        if(confirm('Delete this course?')) {
                          await api.deleteCourse(course.id);
                          await fetchData();
                        }
                      }}
                      className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all" 
                      title="Delete Course"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center glass-card border-dashed border-white/10 text-foreground/20 italic">
                No courses managed yet. Create your first course to get started.
              </div>
            )}
          </div>

          {/* Performance Chart */}
          <div className="glass-card p-8 min-h-[350px] flex flex-col">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Platform Growth
            </h3>
            <div className="flex-1 flex items-end justify-between gap-3 pt-10">
              {stats?.engagement.map((count, i) => {
                const maxCount = Math.max(...stats.engagement, 1);
                const height = (count / maxCount) * 100;
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height || 5}%` }}
                    className="w-full bg-gradient-to-t from-primary/20 to-primary/80 rounded-t-lg hover:to-secondary transition-all relative group"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 p-2 rounded-xl text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all shadow-2xl z-10">
                      {count} Enrollments
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between mt-6 text-[9px] text-foreground/20 font-black uppercase tracking-[0.2em] px-1">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="space-y-8">
          <section className="glass-card p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-secondary" />
              Real-time Logs
            </h3>
            <div className="space-y-8 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
              {activities.length > 0 ? activities.map((activity, i) => (
                <div key={i} className="flex items-start gap-5 relative group">
                  <div className="w-5 h-5 rounded-full bg-surface border-2 border-white/10 mt-1 flex-shrink-0 group-hover:border-primary transition-colors z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/20 group-hover:bg-primary m-auto mt-1" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-bold text-foreground">{activity.name}</span>
                      <span className="text-foreground/40 ml-1.5">{activity.action}</span>
                    </p>
                    <p className="text-[10px] text-foreground/20 font-black uppercase tracking-widest mt-1.5">
                      {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-foreground/20 text-sm italic">Passive monitoring active...</p>
              )}
            </div>
          </section>

          {/* Quick Shortcuts */}
          <section className="glass-card p-8 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground/30">Quick Access</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/dashboard/admin/students" className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group">
                Student Directory
                <ArrowUpRight className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
              </Link>
              <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all text-left flex items-center justify-between group">
                Export Platform Logs
                <ArrowUpRight className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
