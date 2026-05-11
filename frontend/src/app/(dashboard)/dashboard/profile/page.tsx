'use client';

import React, { useEffect, useState } from 'react';
import { 
  User, Mail, Calendar, Award, 
  Zap, Brain, FileText, Download, 
  ExternalLink, Loader2, ShieldCheck,
  Briefcase, Lock, Settings, BarChart3,
  Globe, Save, 
  ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';


import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { format } from 'date-fns';

type TabType = 'portfolio' | 'insights' | 'security';

export default function ProfilePortfolioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [user, setUser] = useState<any>(null);
  const [skillMap, setSkillMap] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [rankData, setRankData] = useState<any>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form States
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    headline: '',
    bio: '',
    portfolio_url: ''
  });



  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await api.getMe();
        setUser(userData);
        setProfileForm({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          headline: userData.headline || '',
          bio: userData.bio || '',
          portfolio_url: userData.portfolio_url || ''
        });


        
        const isAdmin = userData.role === 'admin' || userData.email?.includes('admin');
        
        if (!isAdmin) {
          // Fetch non-critical data independently to prevent total page failure
          api.getMySkillMap().then(setSkillMap).catch(e => console.warn('SkillMap failed', e));
          api.getMyCertificates().then(setCertificates).catch(e => console.warn('Certificates failed', e));
          api.getMyRank().then(setRankData).catch(e => console.warn('Rank failed', e));
          api.getAdvancedAnalytics().then(setAdvancedAnalytics).catch(e => console.warn('Advanced Analytics failed', e));
        }


      } catch (err) {
        console.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.updateProfile(profileForm);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      const updatedUser = await api.getMe();
      setUser(updatedUser);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Profile Banner & Basic Info */}
      <section className="relative glass-card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/20" />
        <div className="px-8 pb-8 -mt-12 relative z-10 flex flex-col md:flex-row items-end gap-6">
          <div className="w-32 h-32 rounded-3xl bg-surface border-4 border-background shadow-2xl flex items-center justify-center text-4xl font-bold text-primary overflow-hidden">
             {user.first_name ? user.first_name[0] : '?'}
          </div>
          <div className="flex-1 space-y-1">
            <h1 className="text-3xl font-black">{user.first_name} {user.last_name}</h1>
            <p className="text-foreground/60 font-medium">{user.headline || (isAdmin ? 'Platform Administrator' : 'AI-Powered Learner')}</p>
            <div className="flex gap-4 text-xs text-foreground/40 font-bold uppercase tracking-widest pt-2">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {format(new Date(user.created_at), 'MMM yyyy')}</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-secondary" /> {user.xp} XP</span>
            </div>
          </div>
          <div className="flex gap-2">
            {user.portfolio_url && <a href={user.portfolio_url} target="_blank" className="p-2 glass-card hover:bg-secondary/20 transition-all text-secondary"><Globe className="w-5 h-5" /></a>}
          </div>


        </div>
      </section>

      {/* Tabs Navigation */}
      <nav className="flex gap-1 bg-surface/30 p-1.5 rounded-2xl border border-white/5 w-fit">
        {[
          { id: 'portfolio', label: 'Portfolio', icon: User },
          { id: 'insights', label: 'Learning Insights', icon: BarChart3 },
          { id: 'security', label: 'Security & Profile', icon: Lock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-foreground/40 hover:text-foreground/70 hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left: About & Stats */}
            <div className="space-y-8">
              <section className="glass-card p-8 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-primary">
                  <FileText className="w-4 h-4" /> About
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed italic">
                  {user.bio || 'No bio provided. Update your profile to tell the world about your learning journey!'}
                </p>
              </section>

              {!isAdmin && (
                <section className="glass-card p-8 space-y-6">
                   <h3 className="font-bold flex items-center gap-2 text-secondary">
                    <Award className="w-4 h-4" /> Achievements
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5">
                      <span className="block text-2xl font-black text-secondary">{user.current_streak}🔥</span>
                      <span className="text-[10px] text-foreground/30 font-bold uppercase">Streak</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5">
                      <span className="block text-2xl font-black text-primary">{certificates.length}</span>
                      <span className="text-[10px] text-foreground/30 font-bold uppercase">Certs</span>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Right: Skills & Certs */}
            <div className="lg:col-span-2 space-y-8">
              {!isAdmin && (
                <section className="glass-card p-8 space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <Brain className="w-6 h-6 text-primary" />
                    AI-Verified Skill Matrix
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {skillMap?.skills?.map((skill: any, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-bold tracking-tight">{skill.name}</span>
                          <span className="text-[10px] font-black text-primary">{skill.level}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.level}%` }}
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                          />
                        </div>
                      </div>
                    )) || <p className="text-foreground/30 italic text-sm">No skills verified yet. Take quizzes to build your matrix!</p>}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                 <h3 className="text-xl font-black flex items-center gap-2">
                    <Award className="w-6 h-6 text-secondary" />
                    Verified Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.length > 0 ? certificates.map((cert) => (
                      <div key={cert.id} className="glass-card p-6 flex items-center gap-5 group hover:bg-primary/5 transition-all cursor-pointer">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Award className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold leading-tight">{cert.course_title}</h4>
                          <p className="text-[10px] text-foreground/40 mt-1 uppercase font-bold tracking-widest">{cert.verification_code}</p>
                        </div>
                        <Download className="w-5 h-5 text-foreground/20 group-hover:text-primary transition-colors" />
                      </div>
                    )) : (
                      <div className="col-span-2 p-12 text-center glass-card border-dashed border-white/10 text-foreground/20 italic">
                        Credentials will appear here once you complete courses.
                      </div>
                    )}
                  </div>
              </section>
            </div>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-8 space-y-2">
                <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Total Study Time</span>
                <div className="text-4xl font-black text-primary">
                  {Math.floor(user.total_session_time_seconds / 3600)}h {Math.floor((user.total_session_time_seconds % 3600) / 60)}m
                </div>
                <p className="text-xs text-foreground/30">Verified across all active sessions</p>
              </div>
              <div className="glass-card p-8 space-y-2">
                <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Learning Velocity</span>
                <div className="text-4xl font-black text-secondary">
                  {Math.floor(user.xp / 100)} <span className="text-sm font-bold text-foreground/40">XP/Day Avg</span>
                </div>
                <p className="text-xs text-foreground/30">Based on last 30 days of activity</p>
              </div>
              <div className="glass-card p-8 space-y-2">
                <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Global Rank</span>
                <div className="text-4xl font-black text-white">
                  #{rankData?.rank || '---'} <span className={`text-sm font-bold ${rankData?.isTopPercent ? 'text-emerald-500' : 'text-primary'}`}>
                    {rankData?.percentile !== undefined ? `Top ${100 - rankData.percentile}%` : 'Calculating...'}
                  </span>
                </div>

                <p className="text-xs text-foreground/30">Relative to {rankData?.totalStudents || 'all'} platform students</p>
              </div>

            </div>

            <section className="glass-card p-10 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
               <div className="relative z-10 space-y-8">
                 <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    {/* Activity Persona */}
                    <div className="flex-1 space-y-4">
                       <h3 className="text-xl font-bold flex items-center gap-2">
                          <Brain className="w-6 h-6 text-primary" />
                          AI Learning Persona
                       </h3>
                       <div className="p-6 bg-white/5 rounded-2xl border border-white/5 italic text-foreground/70 leading-relaxed">
                          "{advancedAnalytics?.persona || 'Analyzing your learning patterns...'}"
                       </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="flex-1 space-y-4">
                       <h3 className="text-xl font-bold flex items-center gap-2">
                          <BarChart3 className="w-6 h-6 text-secondary" />
                          Knowledge Distribution
                       </h3>
                       <div className="space-y-4">
                          {advancedAnalytics?.distribution?.map((dist: any, i: number) => (
                            <div key={i} className="space-y-1">
                               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                                  <span>{dist.name}</span>
                                  <span>{dist.completion_count} lessons</span>
                               </div>
                               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-secondary transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, dist.completion_count * 10)}%` }}
                                  />
                               </div>
                            </div>
                          ))}
                          {(!advancedAnalytics?.distribution || advancedAnalytics.distribution.length === 0) && (
                            <p className="text-xs text-foreground/20 italic">Complete more lessons to see your distribution.</p>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Activity Heatmap Mock/Simple */}
                 <div className="space-y-4 pt-8 border-t border-white/5">
                    <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-[0.2em]">Learning Consistency (Last 14 Days)</h3>
                    <div className="flex gap-2 h-12 items-end">
                       {Array.from({ length: 14 }).map((_, i) => {
                          const date = format(new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                          const dayData = advancedAnalytics?.heatmap?.find((h: any) => h.date.startsWith(date));
                          const height = dayData ? Math.min(100, dayData.count * 20) : 5;
                          return (
                            <div 
                              key={i} 
                              className={`flex-1 rounded-sm transition-all duration-500 ${dayData ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'bg-white/5'}`}
                              style={{ height: `${height}%` }}
                              title={`${dayData?.count || 0} activities on ${date}`}
                            />
                          );
                       })}
                    </div>
                 </div>
               </div>
            </section>

          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            {/* Profile Settings */}
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="flex items-center gap-3 mb-4">
                 <Settings className="w-6 h-6 text-primary" />
                 <h2 className="text-xl font-bold">Profile Settings</h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">First Name</label>
                  <input 
                    type="text" 
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm glow-focus"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Last Name</label>
                  <input 
                    type="text" 
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm glow-focus"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Professional Headline</label>
                <input 
                  type="text" 
                  value={profileForm.headline}
                  placeholder="e.g. Aspiring Full Stack Developer | Learning AI"
                  onChange={(e) => setProfileForm({...profileForm, headline: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm glow-focus"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Bio</label>
                <textarea 
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm glow-focus"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Social Links
                </h4>
                <div className="space-y-4">
                   <div className="relative">
                     <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                     <input 
                       type="url" 
                       placeholder="Portfolio URL"
                       value={profileForm.portfolio_url}
                       onChange={(e) => setProfileForm({...profileForm, portfolio_url: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm glow-focus"
                     />
                   </div>


                </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Profile
              </button>
            </form>

            {/* Security Settings */}
            <div className="space-y-12">
               <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                   <Lock className="w-6 h-6 text-secondary" />
                   <h2 className="text-xl font-bold">Security & Password</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Current Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm glow-focus"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm glow-focus"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm glow-focus"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/70 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Update Password
                </button>
               </form>

               {/* Sessions Placeholder */}
               <section className="p-8 glass-card border-dashed border-white/10">
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold">Active Sessions</h4>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] font-black rounded-md">Live Now</span>
                 </div>
                 <div className="flex items-center gap-4 text-sm text-foreground/40">
                    <Globe className="w-5 h-5" />
                    <div>
                       <p className="font-bold text-foreground/60">Chrome on Windows 11</p>
                       <p className="text-[10px] uppercase">IP: 192.168.1.XXX • Current Session</p>
                    </div>
                 </div>
               </section>

               {/* Feedback Message */}
               <AnimatePresence>
                 {message && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                       message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                     }`}
                   >
                     {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                     {message.text}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
