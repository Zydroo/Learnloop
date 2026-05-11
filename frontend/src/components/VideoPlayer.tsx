'use client';

import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  lessonId?: string;
  enrollmentId?: string;
  onComplete?: () => void;
  initialCompleted?: boolean;
  isLastLesson?: boolean;
}

export default function VideoPlayer({ 
  videoUrl, title, lessonId, enrollmentId, onComplete, initialCompleted = false, isLastLesson = false 
}: VideoPlayerProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [showCompleteBtn, setShowCompleteBtn] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(initialCompleted);

  useEffect(() => {
    setCompleted(initialCompleted);
    if (initialCompleted) {
      setShowCompleteBtn(false);
    }
  }, [initialCompleted, lessonId]);
  
  // Analytics State
  const playerRef = useRef<any>(null);
  const lastTimeRef = useRef<number>(0);
  const watchTimeRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const getYouTubeId = (url: string) => {
      if (!url) return null;
      const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    };
    setVideoId(getYouTubeId(videoUrl));
  }, [videoUrl]);

  // Handle tracking elapsed time & events (Skips/Rewinds)
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          const timeDiff = currentTime - lastTimeRef.current;

          // Check if near end (within 1 minute)
          if (duration > 0 && (duration - currentTime) < 60) {
            if (!showCompleteBtn && !completed) setShowCompleteBtn(true);
          } else {
            if (showCompleteBtn) setShowCompleteBtn(false);
          }

          // TRACKING LOGIC
          if (timeDiff > 3) {
            api.logEvent({
              action_type: 'VIDEO_SKIP_FORWARD',
              target_id: lessonId,
              metadata: { from: lastTimeRef.current, to: currentTime }
            }).catch(err => console.error('Skip log failed:', err));
          } else if (timeDiff < -3) {
            api.logEvent({
              action_type: 'VIDEO_REWIND',
              target_id: lessonId,
              metadata: { from: lastTimeRef.current, to: currentTime }
            }).catch(err => console.error('Rewind log failed:', err));
          } else if (timeDiff > 0 && timeDiff < 2) {
            watchTimeRef.current += timeDiff;
            
            if (Math.floor(watchTimeRef.current) % 10 === 0 && enrollmentId && lessonId) {
              api.request('/tracking/watch-time', {
                method: 'POST',
                body: JSON.stringify({
                  enrollment_id: enrollmentId,
                  lesson_id: lessonId,
                  elapsed_seconds: Math.floor(watchTimeRef.current)
                })
              }).catch(err => console.error('Watch time sync failed:', err));
            }
          }

          lastTimeRef.current = currentTime;
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, lessonId, enrollmentId, showCompleteBtn, completed]);

  const handleComplete = async () => {
    console.log('[DEBUG] handleComplete clicked. enrollmentId:', enrollmentId, 'lessonId:', lessonId);
    
    if (initialCompleted) {
       console.log('[DEBUG] Rewatch mode - skipping XP award');
       if (onComplete) onComplete();
       return;
    }

    if (!enrollmentId || !lessonId) {
      const msg = `Missing IDs: enrollmentId=${enrollmentId}, lessonId=${lessonId}. Cannot complete lesson.`;
      console.error(msg);
      alert(msg);
      return;
    }

    if (isCompleting) return;
    setIsCompleting(true);
    
    try {
      console.log('[DEBUG] Calling api.completeLesson...');
      const response = await api.completeLesson({ enrollment_id: enrollmentId, lesson_id: lessonId });
      console.log('[DEBUG] api.completeLesson success:', response);
      
      setCompleted(true);
      setShowCompleteBtn(false);
      
      if (onComplete) {
        console.log('[DEBUG] Triggering onComplete callback');
        onComplete();
      }
    } catch (err: any) {
      console.error('Failed to complete lesson', err);
      const errorDetail = err.data?.details || err.message || JSON.stringify(err);
      alert(`Server Error: ${errorDetail}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const onReady: YouTubeProps['onReady'] = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event: YouTubeEvent) => {
    if (event.data === 1) {
      setIsPlaying(true);
      lastTimeRef.current = playerRef.current.getCurrentTime();
    } else if (event.data === 2) {
      setIsPlaying(false);
    }
  };

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-surface/50 rounded-2xl flex items-center justify-center text-foreground/30">
        <p>No video available</p>
      </div>
    );
  }

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-2xl shadow-black/30 relative group">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full absolute inset-0"
        iframeClassName="w-full h-full"
      />

      <AnimatePresence>
        {showCompleteBtn && !completed && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20"
          >
             <button 
               onClick={handleComplete}
               disabled={isCompleting}
               className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-black shadow-2xl shadow-primary/40 flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95"
             >
               {isCompleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
               {isCompleting && isLastLesson ? 'Generating Certificate...' : 'Complete Lesson & Get XP'}
             </button>
          </motion.div>
        )}

        {completed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-8"
          >
             <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 border-2 border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]">
                <CheckCircle className="w-10 h-10 text-primary" />
             </div>
             <h3 className="text-3xl font-black text-white mb-2">Lesson Completed!</h3>
             <p className="text-foreground/60 max-w-xs mb-6">+50 XP awarded to your profile</p>
             <button 
               onClick={() => setCompleted(false)}
               className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white transition-all"
             >
               Rewatch Module
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
