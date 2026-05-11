'use client';

import React, { useState, useEffect } from 'react';
import { Star, Send, Loader2, User, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ReviewSectionProps {
  courseId: string;
}

export default function ReviewSection({ courseId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);

  const fetchReviews = async () => {
    try {
      const data = await api.getCourseReviews(courseId);
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim()) return;

    setSubmitting(true);
    try {
      await api.submitReview(courseId, { content: newReview, score: rating });
      setNewReview('');
      setRating(5);
      fetchReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Submit Review Form */}
      <div className="glass-card p-6 border border-primary/20 bg-primary/5">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Leave a Review
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'text-primary fill-primary'
                      : 'text-foreground/20'
                  } transition-colors`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-bold text-foreground/40 uppercase tracking-widest">
              {rating}/5 Stars
            </span>
          </div>

          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Tell us what you think about this course..."
            className="w-full bg-surface/50 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-primary/50 transition-all min-h-[100px]"
          />

          <button
            type="submit"
            disabled={submitting || !newReview.trim()}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/30 flex items-center gap-2">
          Recent Reviews ({reviews.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 glass-card border-dashed border-white/10">
            <p className="text-foreground/30 italic text-sm">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 border border-white/5 hover:border-primary/20 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center font-bold text-primary border border-white/5">
                        {(review.first_name || 'S')[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold">
                          {review.first_name || 'Anonymous'} {review.last_name || 'Student'}
                        </div>
                        <div className="text-[10px] text-foreground/30 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/5 px-2 py-1 rounded-lg">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-xs font-bold">{review.score}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed italic">
                    "{review.content}"
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
