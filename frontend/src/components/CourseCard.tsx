'use client';

import Link from 'next/link';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Book, MoreVertical, Trash2, Settings, BarChart3, X, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    price?: number;
    enrolledCount?: number;
    thumbnail_url?: string;
  };
  isAdmin?: boolean;
  isEnrolled?: boolean;
  onDelete?: () => void;
  onEnroll?: () => void;
}

export default function CourseCard({ course, isAdmin, isEnrolled, onDelete, onEnroll }: CourseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setShowConfirm(false);
    try {
      await api.deleteCourse(course.id);
      if (onDelete) onDelete();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      await api.enroll(course.id);
      if (onEnroll) onEnroll();
    } catch (err: any) {
      alert(err.message || 'Failed to enroll');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        className={`glass-card group flex flex-col h-full relative ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}
      >
        {/* Top half: Thumbnail or Gradient */}
        <div className="h-40 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10 relative overflow-hidden rounded-t-2xl">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Book className="w-12 h-12 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
              </div>
            </>
          )}
          
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white uppercase tracking-wider">
            {course.price ? `$${course.price}` : 'Free'}
          </span>
        </div>

        {/* Admin Menu */}
        {isAdmin && (
          <div className="absolute top-4 right-16 z-50">
            <button 
              onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
              className="p-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg hover:bg-primary/20 transition-all text-white"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 mt-2 w-48 glass-card border border-white/10 p-2 z-[100] shadow-2xl shadow-black/80"
                >
                  <Link 
                    href={`/dashboard/admin/edit/${course.id}`}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-all text-sm font-medium"
                  >
                    <Settings className="w-4 h-4 text-primary" />
                    <span>Edit Course</span>
                  </Link>
                  <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-all text-sm font-medium text-left">
                    <BarChart3 className="w-4 h-4 text-secondary" />
                    <span>View Analytics</span>
                  </button>
                  <div className="h-px bg-white/5 my-2" />
                  <button 
                    onClick={(e) => { e.preventDefault(); setShowConfirm(true); setShowMenu(false); }}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all text-sm font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Course</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
            {course.title}
          </h3>
          <p className="mt-2 text-foreground/50 text-sm line-clamp-2 flex-1">
            {course.description}
          </p>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-foreground/30">
              {course.enrolledCount ? `${course.enrolledCount} students` : 'New Course'}
            </div>
            
            {isEnrolled || isAdmin ? (
              <Link href={`/dashboard/courses/${course.id}`} className="flex items-center space-x-2 text-primary font-bold group-hover:translate-x-1 transition-transform">
                <span>View Course</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button 
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="flex items-center space-x-2 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {isEnrolling ? (
                  <Book className="w-4 h-4 animate-spin" />
                ) : (
                  <Book className="w-4 h-4" />
                )}
                <span>Enroll Now</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Advanced Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card border border-danger/20 p-8 shadow-[0_0_50px_rgba(239,68,68,0.1)]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-danger/10 rounded-2xl">
                  <AlertTriangle className="w-8 h-8 text-danger" />
                </div>
                <button onClick={() => setShowConfirm(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X className="w-5 h-5 text-foreground/40" />
                </button>
              </div>

              <h3 className="text-2xl font-bold mb-2">Delete Course?</h3>
              <p className="text-foreground/50 leading-relaxed mb-8">
                You are about to delete <span className="text-foreground font-bold italic underline">"{course.title}"</span>. 
                This action is irreversible and will remove all student progress and lessons.
              </p>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-danger hover:bg-danger/80 text-white rounded-2xl font-bold shadow-xl shadow-danger/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
