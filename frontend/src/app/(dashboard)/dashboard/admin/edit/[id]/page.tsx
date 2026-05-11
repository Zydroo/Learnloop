'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Save, ArrowLeft, Loader2, 
  Trash2, Plus, Image as ImageIcon,
  Type, AlignLeft, Video,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    price: 0
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await api.getCourse(id as string);
        setCourse(data);
        setFormData({
          title: data.title,
          description: data.description,
          thumbnail_url: data.thumbnail_url || '',
          price: data.price || 0
        });
      } catch (err) {
        console.error('Failed to fetch course');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCourse(id as string, formData);
      router.push('/dashboard/admin');
    } catch (err) {
      console.error('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
        <p className="text-foreground/30 font-bold uppercase tracking-widest text-xs">Loading Course Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left Column: Form */}
        <div className="md:col-span-2 space-y-8">
          <section className="glass-card p-8 space-y-6">
            <h2 className="text-xl font-bold">General Information</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-foreground/30 ml-1">Course Title</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:border-primary/50 focus:bg-white/10 transition-all outline-none font-medium"
                    placeholder="e.g. Master React & Next.js"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-foreground/30 ml-1">Description</label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-foreground/20" />
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={5}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:border-primary/50 focus:bg-white/10 transition-all outline-none font-medium resize-none"
                    placeholder="Describe what students will learn..."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Lessons ({course?.lessons?.length || 0})</h2>
              <button 
                onClick={async () => {
                  const title = prompt('Enter lesson title:');
                  const url = prompt('Enter YouTube URL:');
                  if (title && url) {
                    await api.addLesson({ course_id: id as string, title, video_url: url, sequence_order: (course?.lessons?.length || 0) + 1 });
                    // Reload course
                    const data = await api.getCourse(id as string);
                    setCourse(data);
                  }
                }}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Lesson
              </button>
            </div>
            
            <div className="space-y-3">
              {course?.lessons?.map((lesson: any, i: number) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-foreground/20">{i + 1}</span>
                    <Video className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{lesson.title}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={async () => {
                        if (confirm('Delete this lesson?')) {
                          await api.deleteLesson(lesson.id);
                          const data = await api.getCourse(id as string);
                          setCourse(data);
                        }
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-foreground/40 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Media & Meta */}
        <div className="space-y-8">
          <section className="glass-card p-8 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/30">Course Preview</h2>
            <div className="aspect-video w-full rounded-2xl bg-surface-hover overflow-hidden relative group border border-white/5">
              {formData.thumbnail_url ? (
                <img src={formData.thumbnail_url} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-foreground/10">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Play className="w-12 h-12 text-white fill-current" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/30 ml-1">Thumbnail URL</label>
              <input 
                type="text"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 focus:border-primary/50 focus:bg-white/10 transition-all outline-none text-xs"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </section>

          <section className="glass-card p-8 space-y-4">
             <h2 className="text-xs font-black uppercase tracking-widest text-foreground/30">Quick Stats</h2>
             <div className="space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-foreground/40">Total Students</span>
                 <span className="font-bold">{course?.student_count || 0}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-foreground/40">Avg Rating</span>
                 <span className="font-bold text-yellow-500">
                   {course?.avg_rating ? Number(course.avg_rating).toFixed(1) : 'N/A'} ★
                 </span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-foreground/40">Status</span>
                 <span className="font-bold text-emerald-500">
                   {course?.is_published ? 'Live' : 'Draft'}
                 </span>
               </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
