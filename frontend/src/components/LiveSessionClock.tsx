'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { api } from '@/lib/api';

export default function LiveSessionClock() {
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    // Initial fetch of total session time
    api.getMe().then(user => {
      if (user && user.total_session_time_seconds) {
        setSessionSeconds(user.total_session_time_seconds);
      }
    });

    // Tick every second locally so the user sees it update in real time
    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 bg-surface/30 border border-white/5 rounded-lg text-sm text-foreground/70 font-medium">
      <Clock className="w-4 h-4 text-primary" />
      <span>Total Study Time: {formatTime(sessionSeconds)}</span>
    </div>
  );
}
