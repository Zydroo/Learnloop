'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

export default function SessionTracker() {
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Start Session
    const startSession = async () => {
      try {
        const response = await api.request('/tracking/session', {
          method: 'POST',
          body: JSON.stringify({ action: 'start' }),
        });
        if (isMounted && response.session_id) {
          sessionIdRef.current = response.session_id;
          startHeartbeat();
        }
      } catch (err) {
        console.error('Failed to start session analytics');
      }
    };

    const startHeartbeat = () => {
      // Send heartbeat every 30 seconds
      heartbeatIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const idleTime = now - lastInteractionRef.current;

        // 5 MINUTES = 300,000 ms
        if (idleTime > 300000) {
          if (!isIdle) {
            console.log('[TRACKER] User is idle. Pausing study time counter.');
            setIsIdle(true);
          }
          return; // Skip heartbeat
        }

        if (isIdle) setIsIdle(false);

        if (sessionIdRef.current) {
          api.request('/tracking/session', {
            method: 'POST',
            body: JSON.stringify({ action: 'heartbeat', session_id: sessionIdRef.current }),
          }).catch(() => {});
        }
      }, 30000);
    };

    // Interaction Listeners
    const handleInteraction = () => {
      lastInteractionRef.current = Date.now();
      if (isIdle) setIsIdle(false);
    };

    // Track Tab Switching (Visibility Change)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab was hidden (user switched tabs or minimized)
        api.request('/tracking/event', {
          method: 'POST',
          body: JSON.stringify({
            action_type: 'TAB_SWITCH_AWAY',
            metadata: { timestamp: new Date().toISOString() },
          }),
        }).catch(() => {});
      } else {
        // Tab is visible again
        api.request('/tracking/event', {
          method: 'POST',
          body: JSON.stringify({
            action_type: 'TAB_SWITCH_BACK',
            metadata: { timestamp: new Date().toISOString() },
          }),
        }).catch(() => {});
      }
    };

    startSession();
    
    // Add interaction listeners
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('scroll', handleInteraction);
    window.addEventListener('click', handleInteraction);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Try to cleanly end the session on unmount
      if (sessionIdRef.current) {
        const token = api.getToken();
        if (token) {
           fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/tracking/session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action: 'end', session_id: sessionIdRef.current }),
            keepalive: true
          }).catch(() => {});
        }
      }
    };
  }, [isIdle]);

  return null;
}
