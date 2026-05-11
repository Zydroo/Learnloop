'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Search, MoreVertical, Mail, CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Student {
  id: string;
  name: string;
  email: string;
  courses: number;
  progress: number;
  score: number;
  status: string;
}

export default function StudentsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.getStudents();
        setStudents(data);
      } catch (err) {
        console.error('Failed to fetch students', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-foreground/50">Track student progress, marks, and engagement levels.</p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-surface/30 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm glow-focus w-full transition-all"
          />
        </div>
      </header>

      {loading ? (
        <div className="p-12 text-center text-foreground/40 animate-pulse">Fetching students list...</div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground/40">Student</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground/40 text-center">Courses</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground/40">Progression</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground/40 text-center">Avg. Score</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground/40">Status</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground/40"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                          {student.name[0]}
                        </div>
                        <div>
                          <div className="font-bold">{student.name}</div>
                          <div className="text-xs text-foreground/40 flex items-center">
                            <Mail className="w-3 h-3 mr-1" /> {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-medium">{student.courses}</td>
                    <td className="p-4">
                      <div className="w-full max-w-[120px]">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className="text-foreground/60">{student.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${student.progress}%` }}
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        student.score >= 90 ? 'bg-emerald-400/10 text-emerald-400' : 
                        student.score >= 80 ? 'bg-blue-400/10 text-blue-400' : 'bg-orange-400/10 text-orange-400'
                      }`}>
                        {student.score}%
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-xs font-bold text-emerald-400">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Active
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/dashboard/admin/students/${student.id}`}
                        className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 w-fit ml-auto"
                      >
                        <span>View Insights</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-foreground/30 italic">No students found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
