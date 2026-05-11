const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

/**
 * ============================================================
 * API CLIENT — Central HTTP client for the frontend.
 * ============================================================
 */
export const api = {
  /**
   * Generic request handler
   */
  async request(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong') as any;
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. The video might be too long to process in one go.');
      }
      throw err;
    }
  },

  // ============================================
  // AUTH
  // ============================================

  async login(credentials: any) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  async getMe() {
    const data = await this.request('/auth/me');
    if (data && typeof window !== 'undefined') {
      const existingUser = this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify({ ...existingUser, ...data }));
    }
    return data;
  },

  async updateProfile(data: any) {
    return this.request('/auth/update-profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updatePassword(data: any) {
    return this.request('/auth/update-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // ============================================
  // COURSES
  // ============================================

  async getCourses() {
    return this.request('/courses');
  },

  async getCourse(id: string) {
    return this.request(`/courses/${id}`);
  },

  async createCourse(data: any) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCourse(id: string, data: any) {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCourse(id: string) {
    return this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  },

  async searchCourses(query: string) {
    return this.request(`/courses/search?q=${encodeURIComponent(query)}`);
  },

  // ============================================
  // LESSONS
  // ============================================

  async getCourseLessons(courseId: string) {
    return this.request(`/lessons/${courseId}`);
  },

  async deleteLesson(id: string) {
    return this.request(`/lessons/${id}`, {
      method: 'DELETE',
    });
  },

  async addLesson(data: { course_id: string; title: string; video_url: string; sequence_order?: number }) {
    return this.request('/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ============================================
  // AI TUTOR
  // ============================================

  async askAI(courseId: string, question: string, conversationId?: string) {
    return this.request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId, question, conversation_id: conversationId }),
    });
  },

  async askGlobalAI(question: string, conversationId?: string) {
    return this.request('/ai/ask-global', {
      method: 'POST',
      body: JSON.stringify({ question, conversation_id: conversationId }),
    });
  },

  async getConversations() {
    return this.request('/ai/conversations');
  },

  async getConversationMessages(conversationId: string) {
    return this.request(`/ai/conversations/${conversationId}/messages`);
  },

  // ============================================
  // CONTENT GENERATION (Summaries, Flashcards, Quizzes)
  // ============================================

  async generateSummary(lessonId: string) {
    return this.request(`/content/${lessonId}/summary`, { method: 'POST' });
  },

  async getSummary(lessonId: string) {
    return this.request(`/content/${lessonId}/summary`);
  },

  async generateFlashcards(lessonId: string, count: number = 10) {
    return this.request(`/content/${lessonId}/flashcards`, {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  },

  async getFlashcards(lessonId: string) {
    return this.request(`/content/${lessonId}/flashcards`);
  },

  async generateQuiz(lessonId: string, options?: any) {
    return this.request(`/content/${lessonId}/quiz`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  async generateExam(courseId: string, options?: any) {
    return this.request(`/content/course/${courseId}/exam`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  // ============================================
  // SEARCH
  // ============================================

  async searchLessons(query: string, courseId?: string) {
    return this.request('/search/lessons', {
      method: 'POST',
      body: JSON.stringify({ query, course_id: courseId }),
    });
  },

  async searchVideo(query: string, courseId?: string) {
    return this.request('/search/video', {
      method: 'POST',
      body: JSON.stringify({ query, course_id: courseId }),
    });
  },

  // ============================================
  // ENROLLMENTS
  // ============================================

  async enroll(courseId: string) {
    return this.request('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    });
  },

  async getMyEnrolledCourses() {
    return this.request('/enrollments/my-courses');
  },

  async getEnrollmentByCourse(courseId: string) {
    const enrolled = await this.getMyEnrolledCourses();
    return enrolled.find((e: any) => String(e.id) === String(courseId));
  },

  // ============================================
  // ADMIN
  // ============================================

  async getAdminStats() {
    return this.request('/admin/stats');
  },

  async getStudents() {
    return this.request('/admin/students');
  },

  async getMyActivity() {
    return this.request('/tracking/my-activity');
  },

  async getMyProgress() {
    return this.request('/tracking/progress');
  },

  async getAdvancedAnalytics() {
    return this.request('/tracking/advanced');
  },

  async completeLesson(data: { enrollment_id: string; lesson_id: string }) {
    return this.request('/tracking/complete-lesson', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logEvent(data: { action_type: string; target_id?: string; metadata?: any }) {
    return this.request('/tracking/event', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAdminActivity() {
    return this.request('/admin/activity');
  },

  async parsePlaylist(url: string) {
    return this.request('/admin/parse-playlist', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  async extractTranscript(lessonId: string) {
    return this.request(`/admin/extract-transcript/${lessonId}`, {
      method: 'POST',
    });
  },

  async getStudentDetails(id: string) {
    return this.request(`/admin/students/${id}`);
  },

  async updateCourseStatus(id: string, isPublished: boolean) {
    return this.request(`/admin/courses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    });
  },

  // ============================================
  // REVIEWS & RATINGS
  // ============================================

  async getCourseReviews(courseId: string) {
    return this.request(`/reviews/course/${courseId}`);
  },

  async submitReview(courseId: string, reviewData: { content: string; score: number }) {
    return this.request(`/reviews/course/${courseId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // ============================================
  // COMMENTS & DISCUSSIONS
  // ============================================

  async getLessonComments(lessonId: string) {
    return this.request(`/comments/lesson/${lessonId}`);
  },

  async postComment(lessonId: string, commentData: { content: string; parentCommentId?: string }) {
    return this.request(`/comments/lesson/${lessonId}`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  async deleteComment(commentId: string) {
    return this.request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // ============================================
  // GAMIFICATION
  // ============================================

  async getLeaderboard() {
    return this.request('/gamification/leaderboard');
  },

  async getMyBadges() {
    return this.request('/gamification/my-badges');
  },

  async getMyRank() {
    return this.request('/gamification/my-rank');
  },

  // ============================================
  // CERTIFICATES
  // ============================================

  async getMyCertificates() {
    return this.request('/certificates');
  },

  async issueCertificate(courseId: string) {
    return this.request(`/certificates/issue/${courseId}`, {
      method: 'POST',
    });
  },

  async verifyCertificate(code: string) {
    return this.request(`/certificates/verify/${code}`);
  },

  async getMySkillMap() {
    return this.request('/skills/my-map');
  },

  // ============================================
  // RECOMMENDATIONS
  // ============================================

  async submitOnboarding(data: { goals: string; interests: string[]; level: string }) {
    return this.request('/recommendations/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getRecommendations() {
    return this.request('/recommendations');
  },

  // ============================================
  // ADMIN & ANALYTICS
  // ============================================

  async getAdminStudents() {
    return this.request('/admin/students');
  },

  async getStudentRisk(userId: string) {
    return this.request(`/tracking/student-risk/${userId}`);
  },
};
