'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import CourseCard from '@/components/CourseCard';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(api.getCurrentUser());
    const fetchCourses = async () => {
      try {
        const data = await api.getMyEnrolledCourses();
        setCourses(data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-secondary" />
          <span>My Courses</span>
        </h1>
        <p className="text-foreground/50 mt-1">Browse and continue your learning journey</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground/40">No courses yet</h3>
          <p className="text-sm text-foreground/20 mt-2">Check back soon or ask your admin to create courses.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} isAdmin={isAdmin} isEnrolled={true} onDelete={() => {
              setCourses(prev => prev.filter(c => c.id !== course.id));
            }} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
