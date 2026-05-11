'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, BookOpen, Brain, Lightbulb, FileText, Bot, 
  ChevronRight, Loader2, Star, Award, Zap, 
  Target, CheckCircle2, Circle, LayoutGrid, Info
} from 'lucide-react';
import { api } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import FlashcardViewer from '@/components/FlashcardViewer';
import QuizViewer from '@/components/QuizViewer';
import ChatInterface from '@/components/ChatInterface';
import LiveSessionClock from '@/components/LiveSessionClock';
import StudentActivityFeed from '@/components/StudentActivityFeed';
import ReviewSection from '@/components/ReviewSection';
import CommentSection from '@/components/CommentSection';
import CertificateModal from '@/components/CertificateModal';

type Tab = 'lesson' | 'flashcards' | 'quiz' | 'ai-tutor' | 'summary' | 'reviews';

export default function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonIdFromUrl = searchParams.get('lesson');

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('lesson');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);

  const loadCertificate = async () => {
    try {
      const [certs, me] = await Promise.all([
         api.request('/certificates'),
         api.request('/auth/me')
      ]);
      const courseCert = certs.find((c: any) => String(c.course_id) === String(courseId));
      if (courseCert) {
        setCertificateData({
          studentName: me ? `${me.first_name} ${me.last_name}` : 'Student',
          courseName: courseCert.course_title,
          issueDate: courseCert.issue_date,
          verification_code: courseCert.verification_code,
          ai_evaluation: courseCert.ai_evaluation
        });
        setShowCertificate(true);
      } else {
        alert("Your certificate is still being generated. Please wait a moment and try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to load certificate.");
    }
  };

  const fetchData = async () => {
    try {
      console.log('[DEBUG] Fetching data for course:', courseId);
      const [coursesData, lessonsData, enrollment] = await Promise.all([
        api.getCourses(),
        api.getCourseLessons(courseId),
        api.getEnrollmentByCourse(courseId).catch(() => null)
      ]);
      
      const foundCourse = coursesData.find((c: any) => String(c.id) === String(courseId));
      
      console.log('[DEBUG] Target Course ID:', courseId);
      console.log('[DEBUG] Found Enrollment:', enrollment);

      let currentEnrollment = enrollment;

      if (!currentEnrollment) {
        console.warn('[DEBUG] No enrollment found. Auto-enrolling user...');
        try {
           await api.enroll(courseId);
           currentEnrollment = await api.getEnrollmentByCourse(courseId);
           console.log('[DEBUG] Auto-enrollment successful:', currentEnrollment);
        } catch (e) {
           console.error('[DEBUG] Failed to auto-enroll user:', e);
        }
      }

      setCourse({ 
        ...(foundCourse || { title: 'Course', description: '' }), 
        enrollment_id: currentEnrollment?.enrollment_id,
        completion_percentage: currentEnrollment?.completion_percentage || 0,
        completed_lesson_ids: currentEnrollment?.completed_lesson_ids ? currentEnrollment.completed_lesson_ids.split(',') : []
      });
      setLessons(lessonsData);
      
      // Update local completed set
      setCompletedLessonIds(new Set(currentEnrollment?.completed_lesson_ids ? currentEnrollment.completed_lesson_ids.split(',') : []));

      if (lessonsData.length > 0) {
        const requestedLesson = lessonIdFromUrl 
          ? lessonsData.find((l: any) => String(l.id) === String(lessonIdFromUrl))
          : null;
          
        const current = requestedLesson || lessonsData[0];
        setSelectedLesson(current);

        api.logEvent({
          action_type: 'VIEW_LESSON',
          target_id: current.id,
          metadata: { lesson_title: current.title }
        }).catch(err => console.error('Lesson view log failed:', err));
      }
    } catch (err) {
      console.error('Failed to load course:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(api.getCurrentUser());
    fetchData();
  }, [courseId, lessonIdFromUrl]);

  const handleGenerateSummary = async () => {
    if (!selectedLesson) return;
    setSummaryLoading(true);
    try {
      const data = await api.generateSummary(selectedLesson.id);
      setSummary(data);
    } catch (err) {
      console.error('Summary failed:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleTranscriptExtracted = (newContentText: string) => {
    if (selectedLesson) {
      const updatedLesson = { ...selectedLesson, content_text: newContentText };
      setSelectedLesson(updatedLesson);
      setLessons(prev => prev.map(l => l.id === selectedLesson.id ? updatedLesson : l));
    }
  };

  const handleNextLesson = () => {
    console.log('[DEBUG] handleNextLesson triggered');
    if (!selectedLesson || lessons.length === 0) return;
    const currentIndex = lessons.findIndex((l: any) => String(l.id) === String(selectedLesson.id));
    if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      setActiveTab('lesson');
      setSummary(null);
      const newUrl = window.location.pathname + '?lesson=' + nextLesson.id;
      router.push(newUrl); // This triggers useEffect
    } else {
       // Just refresh stats if it's the last lesson
       fetchData();
    }
  };

  const tabs = [
    { id: 'lesson' as Tab, label: 'Lesson', icon: BookOpen },
    { id: 'summary' as Tab, label: 'Summary', icon: FileText },
    { id: 'flashcards' as Tab, label: 'Flashcards', icon: Lightbulb },
    { id: 'quiz' as Tab, label: 'Quiz', icon: Brain },
    { id: 'ai-tutor' as Tab, label: 'AI Tutor', icon: Bot },
    { id: 'reviews' as Tab, label: 'Reviews', icon: Star },
  ];

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-6">
           <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Zap className="w-6 h-6 text-primary animate-pulse" />
              </div>
           </div>
           <p className="text-foreground/40 font-black uppercase tracking-[0.3em] text-[10px]">Loading Module Nexus...</p>
        </div>
      </div>
    );
  }

  const completionPercent = Math.round(course?.completion_percentage || 0);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-6 overflow-hidden">
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 flex-shrink-0 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="px-2.5 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider rounded-lg border border-primary/20">Learning Path</div>
             <ChevronRight className="w-3 h-3 text-foreground/20" />
             <span className="text-foreground/40 text-[11px] font-bold tracking-tight">{course?.title}</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-2xl">{course?.title}</h1>
        </div>
        <div className="flex items-center gap-4">
           <LiveSessionClock />
        </div>
      </header>

      <div className="flex gap-6 flex-1 min-h-0 overflow-hidden px-2">
        {/* Left Sidebar: ULTRA-EXPANDED LESSON LIST */}
        <aside className="w-80 flex-shrink-0 flex flex-col min-h-0 bg-surface/30 rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
             <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/50">Modules</h3>
             </div>
             <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">{lessons.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {lessons.map((lesson, i) => {
              const isSelected = selectedLesson?.id === lesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => { setSelectedLesson(lesson); setActiveTab('lesson'); setSummary(null); }}
                  className={`w-full text-left p-5 rounded-[1.5rem] transition-all duration-500 flex items-center gap-5 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-br from-primary to-primary-hover text-white shadow-2xl shadow-primary/30 translate-x-2'
                      : 'hover:bg-white/5 text-foreground/60 border border-transparent hover:border-white/5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                    isSelected 
                      ? 'bg-white/20' 
                      : completedLessonIds.has(String(lesson.id))
                        ? 'bg-success/20 text-success border border-success/20'
                        : 'bg-surface/50 text-foreground/30 border border-white/5'
                  }`}>
                    {completedLessonIds.has(String(lesson.id)) && !isSelected ? (
                       <CheckCircle2 className="w-5 h-5" />
                    ) : (
                       String(i + 1).padStart(2, '0')
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-sm font-black truncate leading-tight ${isSelected ? 'text-white' : 'text-foreground/80'}`}>{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/60' : 'text-foreground/30'}`}>Module {i + 1}</p>
                       <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/40' : 'bg-foreground/10'}`} />
                       <p className={`text-[10px] font-bold ${isSelected ? 'text-white/60' : 'text-foreground/30'}`}>
                          {completedLessonIds.has(String(lesson.id)) ? 'Completed' : '15:00'}
                       </p>
                    </div>
                  </div>
                  {isSelected && <Zap className="w-5 h-5 animate-pulse text-white/80" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          {selectedLesson ? (
            <div className="space-y-6 pb-20">
              {/* Video Player */}
              <div className="relative group rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] border border-white/10 bg-black">
                {selectedLesson.video_url && (
                  <VideoPlayer 
                    videoUrl={selectedLesson.video_url} 
                    title={selectedLesson.title} 
                    lessonId={selectedLesson.id}
                    enrollmentId={course?.enrollment_id}
                    onComplete={handleNextLesson}
                    initialCompleted={completedLessonIds.has(String(selectedLesson.id))}
                    isLastLesson={lessons.length - completedLessonIds.size === 1 && !completedLessonIds.has(String(selectedLesson.id))}
                  />
                )}
              </div>

              {/* Tab Navigation */}
              <nav className="flex p-2 bg-surface/30 backdrop-blur-3xl rounded-[2rem] border border-white/10 sticky top-0 z-40 shadow-xl">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 px-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                      activeTab === tab.id
                        ? 'bg-white text-black shadow-2xl'
                        : 'text-foreground/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab} 
                  initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.02, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {activeTab === 'lesson' && (
                    <div className="bg-surface/20 rounded-[2.5rem] p-10 border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                         <BookOpen className="w-64 h-64 -rotate-12" />
                      </div>
                      
                      <div className="space-y-4">
                         <h2 className="text-4xl font-black text-white tracking-tight leading-tight max-w-3xl">{selectedLesson.title}</h2>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                               <Zap className="w-3 h-3 text-primary" />
                               <span className="text-[10px] font-black text-primary uppercase">Active Session</span>
                            </div>
                            <span className="text-foreground/20 text-xs font-bold">Updated 2 days ago</span>
                         </div>
                      </div>
                      
                      {selectedLesson.content_text ? (
                        <div className="space-y-12">
                          <div className="prose prose-invert max-w-none text-foreground/70 leading-relaxed text-xl whitespace-pre-wrap font-medium border-l-4 border-primary/40 pl-10 py-6 bg-gradient-to-r from-primary/5 to-transparent rounded-r-[2rem]">
                            {selectedLesson.content_text}
                          </div>
                          <CommentSection lessonId={selectedLesson.id} />
                        </div>
                      ) : (
                        <div className="py-20 bg-black/20 rounded-[2.5rem] border border-white/5 shadow-inner">
                          <NoContentMessage 
                            feature="Lesson Content" 
                            lessonId={selectedLesson.id} 
                            user={user} 
                            onExtracted={handleTranscriptExtracted} 
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'summary' && (
                    <div className="bg-surface/20 rounded-[2.5rem] p-10 border border-white/5 space-y-8 shadow-2xl">
                       {summary ? (
                        <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-xl">
                                <FileText className="w-7 h-7 text-primary" />
                             </div>
                             <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Executive Summary</h3>
                                <p className="text-xs font-bold text-foreground/30 uppercase tracking-[0.2em]">Generated by LearnLoop AI</p>
                             </div>
                          </div>
                          <p className="text-xl text-foreground/70 leading-relaxed font-semibold border-b border-white/5 pb-10">{summary.summary_text}</p>
                          {summary.key_points && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                              {(typeof summary.key_points === 'string' ? JSON.parse(summary.key_points) : summary.key_points).map((point: string, i: number) => (
                                <motion.div 
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  key={i} 
                                  className="flex items-start gap-5 p-6 bg-white/[0.03] rounded-[2rem] border border-white/5 group hover:border-primary/50 hover:bg-white/[0.05] transition-all duration-500"
                                >
                                  <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-[12px] font-black group-hover:scale-110 transition-transform shadow-lg">{i+1}</div>
                                  <span className="text-sm font-black text-foreground/80 leading-snug">{point}</span>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center space-y-8 py-20">
                          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                             <FileText className="w-10 h-10 text-foreground/20" />
                          </div>
                          <div className="space-y-2">
                             <p className="text-2xl font-black text-white">Synthesizer Offline</p>
                             <p className="text-foreground/40 font-bold max-w-xs mx-auto">Click below to activate the AI Knowledge Processor for this module.</p>
                          </div>
                          <button
                            onClick={handleGenerateSummary}
                            disabled={summaryLoading}
                            className="px-10 py-5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-[0_20px_50px_-15px_rgba(var(--primary-rgb),0.5)] disabled:opacity-50 flex items-center gap-4 mx-auto group"
                          >
                            {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 group-hover:animate-bounce" />}
                            <span>{summaryLoading ? 'Processing Neural Web...' : 'Activate AI Summary'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'flashcards' && (
                    <div className="shadow-2xl rounded-[3rem] overflow-hidden border border-white/5">
                       <FlashcardViewer lessonId={selectedLesson.id} lessonTitle={selectedLesson.title} />
                    </div>
                  )}

                  {activeTab === 'quiz' && (
                    <div className="shadow-2xl rounded-[3rem] overflow-hidden border border-white/5">
                       <QuizViewer lessonId={selectedLesson.id} lessonTitle={selectedLesson.title} />
                    </div>
                  )}

                  {activeTab === 'ai-tutor' && (
                    <div className="h-[700px] shadow-2xl rounded-[3rem] overflow-hidden border border-white/10 bg-black/40 backdrop-blur-3xl">
                      <ChatInterface courseId={courseId} courseName={course?.title} />
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="bg-surface/20 rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                       <ReviewSection courseId={courseId} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-surface/10 rounded-[3rem] border border-white/5">
              <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 rotate-12">
                 <BookOpen className="w-16 h-16 text-foreground/10" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Select a Neural Module</h3>
              <p className="text-foreground/40 max-w-sm font-medium">Choose a module from the curriculum on the left to begin your accelerated learning session.</p>
            </div>
          )}
        </main>

        {/* Right Sidebar: PROGRESS & STATS */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-8 overflow-y-auto custom-scrollbar pb-10">
           {/* Course Progress Card */}
           <section className="flex-shrink-0 bg-gradient-to-br from-primary/20 via-surface/40 to-surface/20 rounded-[2.5rem] border border-white/10 p-8 space-y-8 shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[80px] group-hover:bg-primary/40 transition-all duration-700" />
              
              <div className="flex items-center justify-between relative z-10">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50">Core Mastery</h3>
                 <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                    <Target className="w-6 h-6 text-primary" />
                 </div>
              </div>

              <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-end mb-1">
                    <p className="text-5xl font-black text-white tracking-tighter">{completionPercent}%</p>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-primary uppercase tracking-widest">Achieved</p>
                    </div>
                 </div>
                 
                 <div className="relative h-5 bg-black/30 rounded-2xl overflow-hidden border border-white/5 p-1">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${completionPercent}%` }}
                       transition={{ duration: 1, ease: "circOut" }}
                       className="h-full bg-gradient-to-r from-primary to-secondary rounded-xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)]"
                    />
                 </div>
              </div>

              <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-6 relative z-10">
                 <div className="space-y-2">
                    <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">Efficiency</p>
                    <div className="flex items-center gap-2.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                       <span className="text-xs font-black text-white">Peak</span>
                    </div>
                 </div>
                 <div className="space-y-2 text-right">
                    <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">Bonus XP</p>
                    <div className="flex items-center justify-end gap-2.5 text-warning font-black">
                       <Zap className="w-3.5 h-3.5" />
                       <span className="text-xs">+250</span>
                    </div>
                 </div>
              </div>

              <button 
                 onClick={() => fetchData()}
                 className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-foreground/60 transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10"
              >
                 <Info className="w-4 h-4" />
                 Refresh Stats
              </button>
           </section>

           {/* Activity Feed */}
           <section className="flex-shrink-0 bg-surface/30 rounded-[2.5rem] border border-white/5 flex flex-col min-h-[450px] shadow-2xl backdrop-blur-xl">
              <div className="p-7 border-b border-white/5 flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Nexus Stream</h3>
                 <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              </div>
              <div className="flex-1 overflow-hidden">
                 <StudentActivityFeed />
              </div>
           </section>

           {/* Milestone Progress */}
           <section className="flex-shrink-0 p-8 bg-gradient-to-br from-success/20 to-surface/40 rounded-[2.5rem] border border-success/20 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 text-success">
                 <Award className="w-5 h-5" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">Certification Path</span>
              </div>
              {completedLessonIds.size === lessons.length && lessons.length > 0 ? (
                 <div className="space-y-4">
                    <p className="text-sm text-foreground/80 leading-relaxed font-bold">
                       Congratulations! You have completed all modules and earned your <span className="text-white">Expert Certificate</span>.
                    </p>
                    <button 
                       onClick={loadCertificate}
                       className="w-full py-4 bg-gradient-to-r from-success to-emerald-400 hover:from-success-hover hover:to-emerald-500 text-white rounded-2xl font-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all transform hover:scale-105"
                    >
                       View AI Certificate
                    </button>
                 </div>
              ) : (
                 <>
                    <p className="text-sm text-foreground/80 leading-relaxed font-bold">
                       Complete {lessons.length - completedLessonIds.size} more modules to earn your <span className="text-white">Expert Certificate</span>.
                    </p>
                    <div className="pt-4 grid grid-cols-5 gap-2">
                       {lessons.map((_, i) => (
                          <div key={i} className={`h-2 rounded-full ${i < completedLessonIds.size ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-black/40 border border-white/5'}`} />
                       ))}
                    </div>
                 </>
              )}
           </section>
        </aside>
      </div>

      <CertificateModal 
        isOpen={showCertificate} 
        onClose={() => setShowCertificate(false)} 
        certificate={certificateData} 
      />
    </div>
  );
}

/** Shown when a lesson has no text content for AI features */
function NoContentMessage({ feature, lessonId, user, onExtracted }: { feature: string, lessonId: string, user: any, onExtracted: (content: string) => void }) {
  const [extracting, setExtracting] = useState(false);
  
  const handleExtract = async () => {
    setExtracting(true);
    try {
      const data = await api.extractTranscript(lessonId);
      onExtracted(data.content_text);
    } catch (err: any) {
      console.error('Extraction error:', err);
      const detail = err.data?.error || err.data?.message || err.message;
      const tip = err.data?.tip ? `\n\nTip: ${err.data.tip}` : '';
      alert(`Extraction Failed: ${detail}${tip}`);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="text-center space-y-8 p-10">
      <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
         <Bot className="w-10 h-10 text-primary animate-bounce" />
      </div>
      <div className="space-y-3">
        <h3 className="text-3xl font-black text-white tracking-tight">Neural Sync Required</h3>
        <p className="text-sm text-foreground/40 max-w-sm mx-auto font-black uppercase tracking-widest leading-loose">
          The {feature} engine needs a deep scan of the video neural path to generate content.
        </p>
      </div>
      
      <button 
        onClick={handleExtract}
        disabled={extracting}
        className="px-12 py-5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-[0_20px_50px_-15px_rgba(var(--primary-rgb),0.5)] disabled:opacity-50 flex items-center gap-4 mx-auto group"
      >
        {extracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
        <span>{extracting ? 'Scanning Neural Network...' : `Synthesize ${feature}`}</span>
      </button>
    </div>
  );
}
