import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight, Shield, UserCheck } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import Logo from '../components/Logo';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/register', data).then(r => r.data),
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      toast.success('Account created. Welcome to TaskForge.');
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed'),
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-ink-950">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-forge-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Logo size={40} showWordmark wordmarkClassName="text-white text-2xl" />
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              Build something<br />
              <span className="text-forge-400">extraordinary.</span>
            </h1>
            <p className="text-ink-300 mt-4 max-w-md leading-relaxed">
              Join thousands of teams using TaskForge to ship projects on time and keep everyone in sync.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur">
            <p className="text-sm text-ink-200 italic">
              "We replaced three tools with TaskForge. Our standups got shorter, deliveries faster, and the team finally has a single source of truth."
            </p>
            <p className="text-xs text-ink-400 mt-3">— Engineering Lead, Series B Startup</p>
          </div>
        </div>

        <p className="relative z-10 text-xs text-ink-500">© 2026 TaskForge. Built for teams that ship.</p>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size={36} showWordmark /></div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-white">Create your account</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1.5">Get started in under a minute.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input type="text" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input pl-10" placeholder="Jatin Singh" />
              </div>
            </div>
            <div>
              <label className="label">Work email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input type="email" required value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input pl-10" placeholder="you@company.com" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input type="password" required value={form.password} minLength={6}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input pl-10" placeholder="At least 6 characters" />
              </div>
            </div>

            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'member', label: 'Member',  desc: 'View & update tasks', icon: UserCheck },
                  { value: 'admin',  label: 'Admin',   desc: 'Full access',          icon: Shield },
                ].map(opt => {
                  const Icon = opt.icon;
                  const active = form.role === opt.value;
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(p => ({ ...p, role: opt.value }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all
                        ${active
                          ? 'border-forge-500 bg-forge-50 dark:bg-forge-500/10'
                          : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600'}`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${active ? 'text-forge-600' : 'text-ink-500'}`} />
                        <span className={`text-sm font-semibold ${active ? 'text-forge-700 dark:text-forge-400' : 'text-ink-700 dark:text-ink-200'}`}>
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-500 mt-1">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3 mt-2">
              {mutation.isPending ? 'Creating account…' : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 dark:text-ink-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-forge-600 dark:text-forge-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
