import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, FolderKanban, UserCircle2, Sun, Moon, LogOut, Search, Bell } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import Logo from './Logo';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects',  label: 'Projects',  icon: FolderKanban },
  { to: '/profile',   label: 'Profile',   icon: UserCircle2 },
];

export default function Layout() {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
    enabled: !user,
  });
  useEffect(() => { if (me && !user) setUser(me); }, [me, user, setUser]);

  useEffect(() => {
    if (dark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else      { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [dark]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50 dark:bg-ink-950">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white dark:bg-ink-900 border-r border-ink-200 dark:border-ink-800 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-ink-200 dark:border-ink-800">
          <Logo size={32} showWordmark />
          <p className="text-[11px] text-ink-500 dark:text-ink-500 mt-1.5 ml-[42px] font-medium tracking-wide">FORGE PRODUCTIVITY</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-400 dark:text-ink-500">Workspace</p>
          {NAV.map(n => {
            const Icon = n.icon;
            return (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                   ${isActive
                     ? 'bg-ink-900 text-white dark:bg-forge-500 dark:text-white shadow-soft'
                     : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'}`
                }>
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-ink-200 dark:border-ink-800 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-soft"
              style={{ backgroundColor: user?.avatar_color || '#f97316' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-ink-900 dark:text-white">{user?.name}</p>
              <p className="text-[11px] text-ink-500 dark:text-ink-400 capitalize flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${user?.role === 'admin' ? 'bg-forge-500' : 'bg-emerald-500'}`} />
                {user?.role}
              </p>
            </div>
          </div>
          <button onClick={() => setDark(d => !d)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-lg transition-colors">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
