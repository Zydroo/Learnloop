'use client';

import React, { useEffect, useState } from 'react';
import { Award, Download, CheckCircle, Search, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { format } from 'date-fns';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingCode, setVerifyingCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await api.getMyCertificates();
        setCertificates(data);
      } catch (err) {
        console.error('Failed to fetch certificates');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingCode.trim()) return;

    setIsVerifying(true);
    try {
      const result = await api.verifyCertificate(verifyingCode);
      setVerificationResult(result);
    } catch (err: any) {
      setVerificationResult({ error: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = (cert: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${cert.verification_code}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; }
            .cert { border: 20px solid #1e293b; padding: 60px; background: #fff; text-align: center; max-width: 900px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; border-radius: 10px; }
            .cert::before { content: ''; position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 2px solid #e2e8f0; border-radius: 5px; }
            .logo { width: 60px; height: 60px; margin: 0 auto 20px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 900; }
            h1 { font-size: 48px; margin: 0 0 20px 0; color: #0f172a; text-transform: uppercase; letter-spacing: 4px; font-weight: 900; }
            p { font-size: 18px; color: #64748b; line-height: 1.6; text-transform: uppercase; letter-spacing: 2px; }
            .name { font-size: 42px; font-weight: 900; color: #1e293b; margin: 30px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; display: inline-block; min-width: 400px; }
            .course { font-size: 32px; font-weight: 900; color: #2563eb; margin: 30px 0; }
            .footer { margin-top: 60px; font-size: 14px; color: #94a3b8; display: flex; justify-content: space-between; align-items: flex-end; }
            .evaluation { background: #f8fafc; padding: 25px; border-radius: 12px; font-style: italic; font-size: 16px; margin: 30px 0; border-left: 4px solid #2563eb; color: #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .stats { display: flex; justify-content: center; gap: 30px; margin: 30px 0; }
            .stat-box { background: #f1f5f9; padding: 15px 25px; border-radius: 10px; border: 1px solid #e2e8f0; }
            .stat-value { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 5px; }
            .stat-label { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            .signature { border-top: 2px solid #e2e8f0; padding-top: 10px; width: 200px; font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="cert">
            <div class="logo">LL</div>
            <h1>Certificate of Completion</h1>
            <p>This certifies that</p>
            <div class="name">${cert.first_name} ${cert.last_name}</div>
            <p>has successfully completed the program</p>
            <div class="course">${cert.course_title}</div>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-value">100%</div>
                <div class="stat-label">Completion</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${cert.course_grade ? Math.round(cert.course_grade) : '100'}%</div>
                <div class="stat-label">Final Grade</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${Math.max(1, Math.round((cert.total_session_time_seconds || 0) / 60))}m</div>
                <div class="stat-label">Study Time</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${cert.ai_interactions || 0}</div>
                <div class="stat-label">AI Chats</div>
              </div>
            </div>

            <div class="evaluation">"${cert.ai_evaluation}"</div>
            <div class="footer">
              <div style="text-align: left;">
                <div class="signature">LearnLoop AI Evaluator</div>
              </div>
              <div style="text-align: right;">
                <div style="color: #0f172a; font-weight: bold; margin-bottom: 5px;">Verification Code: ${cert.verification_code}</div>
                <div>Issue Date: ${new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">My Certificates</h1>
          <p className="text-foreground/50">Verify and showcase your professional achievements.</p>
        </div>

        <div className="bg-surface/30 border border-white/5 p-2 rounded-2xl flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Verification Code..." 
            value={verifyingCode}
            onChange={(e) => setVerifyingCode(e.target.value.toUpperCase())}
            className="bg-transparent border-none focus:ring-0 text-sm pl-4 w-full md:w-48"
          />
          <button 
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Verify
          </button>
        </div>
      </header>

      {/* Verification Result Toast/Modal */}
      <AnimatePresence>
        {verificationResult && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-2xl border ${verificationResult.error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {verificationResult.error ? <Search className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                <div>
                  <div className="font-bold">{verificationResult.error ? 'Verification Failed' : 'Valid Certificate Found'}</div>
                  {!verificationResult.error && (
                    <div className="text-xs opacity-80">
                      Issued to {verificationResult.studentName} for {verificationResult.courseName} on {format(new Date(verificationResult.issueDate), 'MMM d, yyyy')}
                    </div>
                  )}
                  {verificationResult.error && <div className="text-xs opacity-80">{verificationResult.error}</div>}
                </div>
              </div>
              <button onClick={() => setVerificationResult(null)} className="text-xs font-black uppercase tracking-widest opacity-50 hover:opacity-100">Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-20 glass-card border-dashed border-white/10">
          <Award className="w-16 h-16 text-foreground/10 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground/40">No certificates yet</h3>
          <p className="text-sm text-foreground/20 mt-2">Finish a course 100% to earn your professional credential.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certificates.map((cert, i) => (
            <motion.div 
              key={cert.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleDownload(cert)}
              className="glass-card group overflow-hidden flex flex-col cursor-pointer hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]"
            >
              <div className="h-40 bg-surface-hover relative overflow-hidden flex items-center justify-center">
                {cert.thumbnail_url ? (
                  <img src={cert.thumbnail_url} alt={cert.course_title} className="w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-surface/40 backdrop-blur-sm">
                  <Award className="w-12 h-12 text-primary mb-2 shadow-2xl" />
                  <div className="text-sm font-black uppercase tracking-tighter leading-tight drop-shadow-md">
                    CERTIFICATE OF<br />COMPLETION
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">{cert.course_title}</h3>
                  <div className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest flex items-center gap-2">
                    Code: <span className="text-primary font-mono select-all">{cert.verification_code}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[10px] text-foreground/30">
                    Issued {format(new Date(cert.issue_date), 'MMM d, yyyy')}
                  </div>
                  <button 
                    onClick={(e) => handleDownload(cert, e)}
                    className="p-2 bg-white/5 hover:bg-primary/20 text-foreground/60 hover:text-primary rounded-xl transition-all" 
                    title="Open Certificate"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
