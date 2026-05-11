'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function StudentActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await api.getMyActivity();
        console.log('✅ Activity Feed Data:', data);
        setActivities(data);
      } catch (err) {
        console.error('❌ Failed to fetch activity feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 5000); // 5s refresh for real-time feel
    return () => clearInterval(interval);
  }, []);

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'VIDEO_PLAY': return 'Started watching video';
      case 'VIDEO_PAUSE': return 'Paused video';
      case 'VIDEO_SKIP_FORWARD': return 'Skipped ahead in video';
      case 'VIDEO_REWIND': return 'Rewound video';
      case 'VIEW_LESSON': return 'Joined lesson';
      case 'TAB_SWITCH_AWAY': return 'Switched away from lesson';
      case 'TAB_SWITCH_BACK': return 'Returned to lesson';
      case 'COMPLETE_QUIZ': return 'Completed a quiz';
      case 'ASK_AI': return 'Asked AI Tutor';
      default: return type.replace(/_/g, ' ').toLowerCase();
    }
  };

  if (loading && activities.length === 0) return null;

  return (
    <div className="bg-surface/30 border border-white/5 rounded-2xl p-4 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/30 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Recent Activity
      </h3>
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-xs text-foreground/20 italic">No recent activity logged.</p>
        ) : (
          activities.map((activity, i) => (
            <div key={i} className="flex items-start gap-3 group">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 group-first:animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground/80 truncate">
                  {getActionLabel(activity.action_type)}
                </p>
                <p className="text-[10px] text-foreground/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {(() => {
                    const date = new Date(activity.created_at);
                    // If the date string from MySQL doesn't have a Z or offset, 
                    // it might be interpreted as local time. We want UTC.
                    const utcDate = activity.created_at.includes('Z') || activity.created_at.includes('+') 
                      ? date 
                      : new Date(activity.created_at + 'Z');
                    return formatDistanceToNow(utcDate, { addSuffix: true });
                  })()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
