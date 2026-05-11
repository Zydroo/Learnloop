'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, ShieldAlert, Activity, User, BookOpen, BrainCircuit, Target, Video, GraduationCap, XOctagon } from 'lucide-react';
import { api } from '@/lib/api';

export default function InstructorDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState<Record<string, any>>({});
  const [analyzingRisk, setAnalyzingRisk] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await api.getAdminStudents();
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeRisk = async (studentId: string) => {
    setAnalyzingRisk(prev => ({ ...prev, [studentId]: true }));
    try {
      const result = await api.getStudentRisk(studentId);
      setRiskData(prev => ({ ...prev, [studentId]: result }));
    } catch (error) {
      console.error('Failed to analyze risk:', error);
    } finally {
      setAnalyzingRisk(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const analyzeAll = async () => {
    students.forEach(s => {
      if (!riskData[s.id]) analyzeRisk(s.id);
    });
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-4">
      {/* Header */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface/40 p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl border border-white/10">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              Advanced Risk Center
            </h1>
          </div>
          <p className="text-foreground/60 text-lg max-w-xl">
            Real-time behavioral analytics tracking focus scores, video skip rates, and precise AI dropout predictions.
          </p>
        </div>
        
        <button 
          onClick={analyzeAll}
          className="relative z-10 px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)] transition-all transform hover:-translate-y-1 group overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -translate-x-full skew-x-12"></div>
          <BrainCircuit className="w-6 h-6 animate-pulse" />
          <span>Run Global Analysis</span>
        </button>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <AnimatePresence>
          {students.map((student, index) => {
            const riskInfo = riskData[student.id];
            const isAnalyzing = analyzingRisk[student.id];
            const riskPercentage = riskInfo?.dropout_risk_percentage;
            const focusScore = riskInfo?.focus_score;
            const stats = riskInfo?.stats;
            
            let riskColor = 'text-foreground/40';
            let riskBg = 'bg-surface/40';
            let RiskIcon = User;
            let focusColor = 'bg-foreground/20';

            if (riskPercentage !== undefined) {
              if (riskPercentage > 75) {
                riskColor = 'text-error';
                riskBg = 'bg-error/5 border-error/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]';
                RiskIcon = ShieldAlert;
              } else if (riskPercentage > 40) {
                riskColor = 'text-warning';
                riskBg = 'bg-warning/5 border-warning/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]';
                RiskIcon = AlertTriangle;
              } else {
                riskColor = 'text-success';
                riskBg = 'bg-success/5 border-success/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]';
                RiskIcon = CheckCircle;
              }

              if (focusScore >= 80) focusColor = 'bg-success';
              else if (focusScore >= 50) focusColor = 'bg-warning';
              else focusColor = 'bg-error';
            }

            return (
              <motion.div 
                key={student.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden p-8 rounded-[2rem] border transition-all duration-500 ${riskPercentage !== undefined ? riskBg : 'bg-surface/40 border-white/5 hover:border-white/10'}`}
              >
                {/* Top Section */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-surface to-background flex items-center justify-center border border-white/10 shadow-lg">
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary">
                        {student.name ? student.name.charAt(0) : '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white">{student.name}</h3>
                      <p className="text-sm text-foreground/50">{student.email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {riskPercentage !== undefined ? (
                      <div className={`flex items-center gap-3 ${riskColor}`}>
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Dropout Risk</p>
                          <p className="text-4xl font-black drop-shadow-md">{riskPercentage}%</p>
                        </div>
                        <RiskIcon className="w-12 h-12 drop-shadow-lg opacity-80" />
                      </div>
                    ) : (
                      <button 
                        onClick={() => analyzeRisk(student.id)}
                        disabled={isAnalyzing}
                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold border border-white/5 transition-colors flex items-center gap-2"
                      >
                        {isAnalyzing ? (
                          <><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                        ) : (
                          <><BrainCircuit className="w-4 h-4" /> Run Prediction</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Data Grid */}
                {riskInfo && (
                  <div className="space-y-6">
                    {/* Focus Score Bar */}
                    <div className="bg-background/50 rounded-2xl p-5 border border-white/5">
                      <div className="flex justify-between items-end mb-3">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          <span className="font-bold text-sm tracking-wide">FOCUS SCORE</span>
                        </div>
                        <span className="text-2xl font-black">{focusScore}/100</span>
                      </div>
                      <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${focusScore}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${focusColor}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Skip Rate */}
                      <div className="bg-background/40 p-4 rounded-2xl border border-white/5">
                        <Video className="w-5 h-5 text-warning mb-2" />
                        <p className="text-2xl font-black">{stats.video_skip_rate}%</p>
                        <p className="text-[10px] text-foreground/50 font-bold uppercase mt-1">Video Skip Rate</p>
                      </div>

                      {/* Quiz Success */}
                      <div className="bg-background/40 p-4 rounded-2xl border border-white/5">
                        <GraduationCap className="w-5 h-5 text-success mb-2" />
                        <p className="text-2xl font-black">{stats.quiz_success_rate}%</p>
                        <p className="text-[10px] text-foreground/50 font-bold uppercase mt-1">Quiz Success</p>
                      </div>

                      {/* Quiz Failure */}
                      <div className="bg-background/40 p-4 rounded-2xl border border-white/5">
                        <XOctagon className="w-5 h-5 text-error mb-2" />
                        <p className="text-2xl font-black">{stats.quiz_failure_rate}%</p>
                        <p className="text-[10px] text-foreground/50 font-bold uppercase mt-1">Quiz Failure</p>
                      </div>

                      {/* AI Interactions */}
                      <div className="bg-background/40 p-4 rounded-2xl border border-white/5">
                        <BrainCircuit className="w-5 h-5 text-primary mb-2" />
                        <p className="text-2xl font-black">{stats.ai_tutor_interactions}</p>
                        <p className="text-[10px] text-foreground/50 font-bold uppercase mt-1">AI Interactions</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!riskInfo && !isAnalyzing && (
                  <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-background/20">
                    <Activity className="w-8 h-8 text-foreground/20 mb-3" />
                    <p className="text-foreground/40 font-medium">Awaiting analysis scan</p>
                  </div>
                )}

              </motion.div>
            );
          })}
        </AnimatePresence>

        {students.length === 0 && (
          <div className="col-span-1 xl:col-span-2 text-center py-20 bg-surface/30 rounded-[3rem] border border-white/5">
            <BookOpen className="w-16 h-16 text-foreground/20 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-foreground/60">No students enrolled yet</h3>
          </div>
        )}
      </div>
    </div>
  );
}
