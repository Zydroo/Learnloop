'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Bot, 
  User, 
  LogOut,
  ChevronRight,
  Search,
  Trophy,
  Award,
  Settings,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'My Courses', icon: BookOpen, href: '/dashboard/courses' },
  { name: 'Certificates', icon: Award, href: '/dashboard/certificates' },
  { name: 'AI Tutor', icon: Bot, href: '/dashboard/ai-tutor' },
  { name: 'Leaderboard', icon: Trophy, href: '/dashboard/leaderboard' },
  { name: 'Global Search', icon: Search, href: '/dashboard/search' },
];

const adminItems = [
  { name: 'Admin Overview', icon: LayoutDashboard, href: '/dashboard/admin' },
  { name: 'Manage Students', icon: User, href: '/dashboard/admin/students' },
  { name: 'Instructor Risk Center', icon: Sparkles, href: '/dashboard/instructor' },
  { name: 'Create Course', icon: BookOpen, href: '/dashboard/admin/create' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [isHovered, setIsHovered] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initialUser = api.getCurrentUser();
    setUser(initialUser);
    
    api.getMe().then((data) => {
      setUser({ ...initialUser, ...data });
    }).catch(console.error);
  }, []);

  const handleLogout = () => {
    api.logout();
    router.push('/login');
  };

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-background/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-50 shadow-2xl shadow-black/50">
      {/* Brand Logo */}
      <div className="p-8">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">
            Learn<span className="text-primary">Loop</span>
          </span>
        </Link>
      </div>

      {/* Student Progress Summary */}
      <AnimatePresence>
        {user && !isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 mb-6"
          >
            <div className="relative group overflow-hidden bg-gradient-to-br from-surface/40 to-surface/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl transition-all hover:border-primary/30">
               <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy className="w-12 h-12 text-primary" />
               </div>
               <div className="relative z-10 space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Student Level</p>
                      <h4 className="text-xl font-black text-white">Lvl {Math.floor((user.xp || 0) / 100) + 1}</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Next Lvl</p>
                       <p className="text-xs font-bold text-foreground/60">{100 - ((user.xp || 0) % 100)} XP needed</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((user.xp || 0) % 100)}%` }}
                      className="bg-gradient-to-r from-primary to-secondary h-full rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-secondary/10 rounded-lg flex items-center gap-1.5">
                       <span className="text-xs">🔥</span>
                       <span className="text-[10px] font-black text-secondary uppercase">{user.current_streak || 0} Day Streak</span>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-8">
        {/* Admin Section */}
        {isAdmin && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/20 font-black px-4 mb-3">Administration</p>
            {adminItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-foreground/40 hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'group-hover:text-primary group-hover:scale-110'}`} />
                      <span className={`text-sm font-bold transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>{item.name}</span>
                    </div>
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                      />
                    )}
                    {isActive && <ChevronRight className="w-4 h-4 relative z-10" />}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Learning Section */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/20 font-black px-4 mb-3">Nexus Center</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div
                  onMouseEnter={() => setIsHovered(item.name)}
                  onMouseLeave={() => setIsHovered(null)}
                  className={`relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-foreground/40 hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'group-hover:text-primary group-hover:scale-110'}`} />
                    <span className={`text-sm font-bold transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>{item.name}</span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill-learning"
                      className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                    />
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 relative z-10" />}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile & Footer */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 p-3 rounded-2xl mb-4">
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 border border-white/10 flex items-center justify-center font-bold text-primary">
              {user?.first_name ? user.first_name[0] : <User className="w-5 h-5" />}
           </div>
           <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-foreground/40 truncate">{user?.email}</p>
           </div>
           <Link href="/dashboard/profile" className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/20 hover:text-primary transition-colors">
              <Settings className="w-4 h-4" />
           </Link>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-3 p-3 rounded-xl bg-danger/5 text-danger/60 hover:bg-danger/20 hover:text-danger transition-all font-bold text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
