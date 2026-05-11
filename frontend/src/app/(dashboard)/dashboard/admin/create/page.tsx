'use client';

import React, { useState } from 'react';
import { 
  Video, 
  HardDrive, 
  Plus, 
  Link as LinkIcon, 
  ArrowRight, 
  PlayCircle,
  Trash2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CourseCard from '@/components/CourseCard';
import { api } from '@/lib/api';

type ContentType = 'youtube-video' | 'youtube-playlist' | 'drive';

interface Lesson {
  id: string;
  title: string;
  url: string;
}

export default function CreateCoursePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Development',
    thumbnail_url: '',
  });
  const [contentType, setContentType] = useState<ContentType>('youtube-video');
  const [contentUrl, setContentUrl] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleParsePlaylist = async () => {
    if (!contentUrl) return;
    setIsParsing(true);
    
    try {
      const data = await api.parsePlaylist(contentUrl);
      setLessons(data.lessons);
      if (data.thumbnail) {
        setFormData(prev => ({ ...prev, thumbnail_url: data.thumbnail }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to parse playlist');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddLesson = () => {
    const newLesson = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Lesson',
      url: '',
    };
    setLessons([...lessons, newLesson]);
  };

  const handleRemoveLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const handleSaveCourse = async () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in the title and description');
      return;
    }

    try {
      await api.createCourse({
        ...formData,
        lessons: lessons
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push('/dashboard/admin');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to create course');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-20">
      <div className="lg:col-span-2 space-y-12">
        <header>
          <h1 className="text-3xl font-bold">Create New Course</h1>
          <p className="text-foreground/50">Configure your course details and curriculum source.</p>
        </header>

        {/* Basic Details Section */}
        <section className="glass-card p-8 space-y-6">
          <div className="flex items-center space-x-2 text-primary mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold">1</div>
            <h2 className="font-bold">Basic Information</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/60 ml-1">Course Title</label>
              <input 
                type="text" 
                placeholder="e.g. Master Next.js 15"
                className="w-full bg-surface/30 border border-white/5 rounded-xl px-4 py-3 glow-focus transition-all"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/60 ml-1">Course Thumbnail URL</label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Paste image URL (or parse playlist to get it automatically)"
                  className="flex-1 bg-surface/30 border border-white/5 rounded-xl px-4 py-3 glow-focus transition-all"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                />
                {formData.thumbnail_url && (
                  <div className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden shrink-0">
                    <img src={formData.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/60 ml-1">Description</label>
              <textarea 
                placeholder="Describe what students will learn..."
                rows={4}
                className="w-full bg-surface/30 border border-white/5 rounded-xl px-4 py-3 glow-focus transition-all resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/60 ml-1">Price ($)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full bg-surface/30 border border-white/5 rounded-xl px-4 py-3 glow-focus transition-all"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/60 ml-1">Category</label>
                <select 
                  className="w-full bg-surface/30 border border-white/5 rounded-xl px-4 py-3 glow-focus transition-all appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option>Development</option>
                  <option>Design</option>
                  <option>Business</option>
                  <option>Marketing</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Content Source Section */}
        <section className="glass-card p-8 space-y-6">
          <div className="flex items-center space-x-2 text-primary mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold">2</div>
            <h2 className="font-bold">Content Curriculum</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'youtube-video', label: 'YouTube Video', icon: Video },
              { id: 'youtube-playlist', label: 'YouTube Playlist', icon: PlayCircle },
              { id: 'drive', label: 'Google Drive', icon: HardDrive },
            ].map((source) => (
              <button
                key={source.id}
                onClick={() => setContentType(source.id as ContentType)}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center space-y-2 ${
                  contentType === source.id 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-white/5 border-white/5 text-foreground/40 hover:bg-white/10'
                }`}
              >
                <source.icon className="w-6 h-6" />
                <span className="text-xs font-bold">{source.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder={`Paste your ${contentType.replace('-', ' ')} URL here...`}
                className="w-full bg-surface/30 border border-white/5 rounded-xl pl-12 pr-32 py-4 glow-focus transition-all font-medium"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
              />
              {contentType === 'youtube-playlist' && (
                <button 
                  onClick={handleParsePlaylist}
                  disabled={isParsing || !contentUrl}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  {isParsing ? 'Parsing...' : 'Parse Playlist'}
                </button>
              )}
            </div>

            <AnimatePresence>
              {lessons.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-widest">
                      Curriculum Overview ({lessons.length} Lessons)
                    </h3>
                    <button onClick={handleAddLesson} className="text-xs text-primary font-bold hover:underline flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Add Custom Lesson
                    </button>
                  </div>
                  
                  {lessons.map((lesson, i) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center space-x-3 p-3 bg-white/5 border border-white/5 rounded-xl group"
                    >
                      <span className="text-xs font-bold text-foreground/30 w-4">{i + 1}</span>
                      <input 
                        type="text" 
                        value={lesson.title}
                        onChange={(e) => {
                          const updated = lessons.map(l => l.id === lesson.id ? { ...l, title: e.target.value } : l);
                          setLessons(updated);
                        }}
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium flex-1 p-0 outline-none"
                        placeholder="Lesson title"
                      />
                      <button onClick={() => handleRemoveLesson(lesson.id)} className="opacity-0 group-hover:opacity-100 p-1 text-danger hover:bg-danger/10 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSaveCourse}
            className="px-10 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all flex items-center"
          >
            {success ? (
              <> <Check className="mr-2 w-6 h-6" /> Course Created! </>
            ) : (
              <> <Plus className="mr-2 w-6 h-6" /> Create Course </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest ml-1">Live Card Preview</h3>
        <div className="sticky top-8">
          <CourseCard course={{
            id: 'preview',
            title: formData.title || 'Course Title Preview',
            description: formData.description || 'Your course description will appear here. Start typing to see it in action.',
            price: parseFloat(formData.price) || 0,
            thumbnail_url: formData.thumbnail_url || '',
            enrolledCount: 0
          }} />
          
          <div className="mt-8 p-6 glass border border-primary/20 rounded-2xl bg-primary/5">
            <h4 className="font-bold text-primary flex items-center">
              <ArrowRight className="w-4 h-4 mr-2" /> Quick Tips
            </h4>
            <ul className="mt-4 space-y-3 text-xs text-foreground/60 leading-relaxed">
              <li>• Use catchy titles for better engagement.</li>
              <li>• YouTube playlists will be automatically divided into lessons.</li>
              <li>• Drive links are perfect for supporting documents and PDF resources.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
