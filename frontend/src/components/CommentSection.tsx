'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Reply, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  lessonId: string;
}

export default function CommentSection({ lessonId }: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);

  const fetchComments = async () => {
    try {
      const data = await api.getLessonComments(lessonId);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(api.getCurrentUser());
    fetchComments();
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const content = parentId ? (e.target as any).reply.value : newComment;
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await api.postComment(lessonId, { content, parentCommentId: parentId });
      if (!parentId) setNewComment('');
      fetchComments();
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.deleteComment(commentId);
      fetchComments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 mt-12 pt-12 border-t border-white/5">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Discussion Forum
      </h3>

      {/* Main Comment Input */}
      <form onSubmit={(e) => handleSubmit(e)} className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
          {user?.first_name?.[0] || 'U'}
        </div>
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ask a question or share your thoughts..."
            className="w-full bg-surface/30 border border-white/10 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:border-primary/50 transition-all min-h-[50px] max-h-[200px]"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="absolute right-2 bottom-2 p-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary/30" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-foreground/20 italic text-sm">
            No discussions yet. Be the first to start the conversation!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              currentUser={user} 
              onDelete={handleDelete} 
              onReply={handleSubmit}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, currentUser, onDelete, onReply }: any) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const isAdmin = currentUser?.role === 'admin';
  const isAuthor = currentUser?.id === comment.user_id;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 group">
        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center font-bold text-foreground/40 border border-white/5 flex-shrink-0">
          {comment.first_name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{comment.first_name} {comment.last_name}</span>
              <span className="text-[10px] text-foreground/20 font-medium">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-foreground/40 hover:text-primary transition-colors"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
              {(isAuthor || isAdmin) && (
                <button 
                  onClick={() => onDelete(comment.id)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-foreground/40 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{comment.content}</p>
          
          {/* Reply Form */}
          <AnimatePresence>
            {showReplyForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={(e) => { onReply(e, comment.id); setShowReplyForm(false); }}
                className="mt-4 flex gap-3"
              >
                <input 
                  name="reply"
                  placeholder="Write a reply..."
                  autoFocus
                  className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary/30"
                />
                <button type="submit" className="p-2 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-all">
                  <Send className="w-3 h-3" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies?.length > 0 && (
        <div className="pl-10 space-y-4 relative">
          <div className="absolute left-[19px] top-0 bottom-4 w-px bg-white/5" />
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-bold text-foreground/20 hover:text-primary flex items-center gap-1 transition-colors mb-2"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {isExpanded ? 'Hide Replies' : `Show ${comment.replies.length} Replies`}
          </button>

          {isExpanded && comment.replies.map((reply: any) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              currentUser={currentUser} 
              onDelete={onDelete} 
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
