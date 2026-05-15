import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import Logo from '../components/Logo';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data).then(r => r.data),
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name}`);
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Login failed'),
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-ink-950">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-forge-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-forge-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Logo size={40} showWordmark wordmarkClassName="text-white text-2xl" />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              Forge productivity.<br />
              <span className="text-forge-400">Ship faster.</span>
            </h1>
            <p className="text-ink-300 mt-4 max-w-md leading-relaxed">
              A modern command center for teams. Track tasks, manage projects, and keep everyone aligned.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              { icon: BarChart3,   title: 'Live dashboards',     desc: 'Charts, deadlines, and team velocity at a glance' },
              { icon: Zap,         title: 'Drag-and-drop Kanban', desc: 'Move tasks across To Do, In Progress, Review, Done' },
              { icon: ShieldCheck, title: 'Role-based access',    desc: 'Admins manage, members focus on what they own' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-forge-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative z-10 text-xs text-ink-500">© 2026 TaskForge. Built for teams that ship.</p>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size={36} showWordmark /></div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-white">Sign in to your workspace</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1.5">Enter your credentials to continue.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input pl-10" placeholder="you@company.com" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input type="password" required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pl-10" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3">
              {mutation.isPending ? 'Signing in…' : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 dark:text-ink-400 mt-6">
            New to TaskForge?{' '}
            <Link to="/register" className="text-forge-600 dark:text-forge-400 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
