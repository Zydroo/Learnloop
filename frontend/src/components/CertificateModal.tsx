'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, CheckCircle, Download, Sparkles } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: {
    studentName: string;
    courseName: string;
    issueDate: string;
    verification_code: string;
    ai_evaluation?: string;
  } | null;
}

export default function CertificateModal({ isOpen, onClose, certificate }: CertificateModalProps) {
  if (!certificate) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-surface/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-1"
          >
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-success opacity-20" />
            
            <div className="relative bg-background rounded-[1.85rem] p-8 md:p-12 text-center space-y-8">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-colors text-foreground/50 hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/5 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                  <Award className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-sm font-black tracking-[0.3em] uppercase text-foreground/50">Certificate of Completion</h2>
              </div>

              {/* Main Content */}
              <div className="space-y-2 py-8">
                <p className="text-foreground/60 italic">This certifies that</p>
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-success pb-2">
                  {certificate.studentName}
                </h1>
                <p className="text-foreground/60 italic">has successfully completed the course</p>
                <h2 className="text-2xl md:text-3xl font-bold pt-2">{certificate.courseName}</h2>
              </div>

              {/* AI Evaluation Box */}
              {certificate.ai_evaluation && (
                <div className="relative max-w-2xl mx-auto p-6 bg-surface/50 rounded-2xl border border-white/5 shadow-inner text-left group">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                     <Sparkles className="w-4 h-4 text-secondary" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">AI Educator Evaluation</h3>
                  <p className="text-foreground/80 leading-relaxed font-medium">
                    "{certificate.ai_evaluation}"
                  </p>
                </div>
              )}

              {/* Footer / Meta */}
              <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-sm text-foreground/40 font-mono">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Issued: {new Date(certificate.issueDate).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 md:mt-0 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                  ID: {certificate.verification_code}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-center gap-4">
                <button onClick={() => window.print()} className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl flex items-center space-x-2 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                  <Download className="w-5 h-5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
