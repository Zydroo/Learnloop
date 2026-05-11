'use client';

import React, { useEffect, useState } from 'react';
import { Search, Bell, Stars } from 'lucide-react';
import { api } from '@/lib/api';
import CourseCard from '@/components/CourseCard';
import { motion } from 'framer-motion';
import OnboardingSurvey from '@/components/OnboardingSurvey';
import Link from 'next/link';
import StudentActivityFeed from '@/components/StudentActivityFeed';
import StudentProgressStats from '@/components/StudentProgressStats';

export default function DashboardPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);


  const fetchRecommendations = async () => {
    try {
      const data = await api.getRecommendations();
      if (Array.isArray(data)) {
        setRecommendations(data);
        if (data.length === 0) {
          const currentUser = api.getCurrentUser();
          if (currentUser?.role !== 'admin') setShowOnboarding(true);
        }
      } else {
        // If not an array, likely an error or empty state
        const currentUser = api.getCurrentUser();
        if (currentUser?.role !== 'admin') setShowOnboarding(true);
      }
    } catch (err) {
      console.warn('Error fetching recommendations, showing onboarding survey as fallback');
      const currentUser = api.getCurrentUser();
      if (currentUser?.role !== 'admin') setShowOnboarding(true);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const data = await api.getMyEnrolledCourses();
      if (Array.isArray(data)) {
        setEnrolledCourseIds(new Set(data.map(c => c.id)));
      }
    } catch (err) {
      console.warn('Failed to fetch enrolled courses');
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (err) {
      console.warn('Backend offline or error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const currentUser = api.getCurrentUser();
    setUser(currentUser);
    fetchCourses();
    if (currentUser) {
      fetchEnrolledCourses();
      if (currentUser.role !== 'admin' && !currentUser.email?.includes('admin')) {
        fetchRecommendations();
      }
    }
  }, []);


  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setLoading(true);
        try {
          const data = await api.searchCourses(searchQuery);
          setCourses(data);
        } catch (err) {
          console.error('Search failed', err);
        } finally {
          setLoading(false);
        }
      } else {
        fetchCourses();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-8">
      {showOnboarding && !isAdmin && (
        <OnboardingSurvey onComplete={() => {
          setShowOnboarding(false);
          fetchRecommendations();
        }} />
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, <span className="text-primary">{user?.first_name || 'Learner'}</span>!
          </h1>
          <p className="text-foreground/50">Here's what's happening with your learning today.</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface/30 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm glow-focus w-64 transition-all"
            />
          </div>
          <button className="p-2 rounded-xl bg-surface/30 border border-white/5 hover:bg-white/5 transition-all relative">
            <Bell className="w-5 h-5 text-foreground/60" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex gap-8">
        {/* Main Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 min-h-0">
          {/* AI Matchmaker */}
          {!isAdmin && recommendations.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-primary">✨</span>
                Your AI-Curated Learning Path
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec) => (
                  <motion.div 
                    key={rec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 border border-primary/20 bg-primary/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                         <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                           {rec.match_score}% Match
                         </span>
                      </div>
                      <h3 className="font-bold mb-2">{rec.title}</h3>
                      <p className="text-xs text-foreground/50 line-clamp-2 italic mb-4">
                        "{rec.reason}"
                      </p>
                    </div>
                    <Link href={`/dashboard/courses/${rec.course_id}`} className="w-full py-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-center text-xs font-bold transition-all">
                      Start Learning
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Featured Courses */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Featured Courses</h2>
              <button className="text-sm text-primary hover:underline">View all</button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 glass-card animate-pulse" />
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {courses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    isAdmin={isAdmin}
                    isEnrolled={enrolledCourseIds.has(course.id)}
                    onDelete={fetchCourses}
                    onEnroll={() => {
                      fetchEnrolledCourses();
                      // Also refresh recommendations if needed
                    }}
                  />
                ))}

              </motion.div>
            )}
          </section>
        </div>

        {/* Sidebar (Fixed Position) */}
        {!isAdmin && (
          <aside className="w-80 flex-shrink-0 space-y-6 hidden xl:block">
            <StudentProgressStats />
            <StudentActivityFeed />
          </aside>
        )}
      </div>
    </div>
  );
}
