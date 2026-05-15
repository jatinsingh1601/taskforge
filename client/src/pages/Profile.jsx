import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Mail, Save, Shield, UserCheck } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '' });
  }, [user]);

  const update = useMutation({
    mutationFn: (data) => api.put('/auth/me', data).then(r => r.data),
    onSuccess: (data) => { setUser(data); toast.success('Profile updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const RoleIcon = user?.role === 'admin' ? Shield : UserCheck;

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Profile</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Manage your account information and preferences.</p>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-center gap-5 pb-6 border-b border-ink-100 dark:border-ink-800">
          <div className="w-20 h-20 rounded-2xl text-3xl text-white flex items-center justify-center font-bold shadow-soft"
            style={{ backgroundColor: user?.avatar_color || '#f97316' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-ink-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{user?.email}</p>
            <span className={`mt-2 chip ${user?.role === 'admin'
              ? 'bg-forge-100 text-forge-700 dark:bg-forge-500/10 dark:text-forge-400'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
              <RoleIcon className="w-3 h-3" />
              <span className="capitalize">{user?.role}</span>
            </span>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); update.mutate(form); }} className="space-y-5 pt-6">
          <div>
            <label className="label">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input pl-10" placeholder="Your name" />
            </div>
          </div>
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input pl-10" placeholder="you@company.com" />
            </div>
          </div>
          <button type="submit" disabled={update.isPending} className="btn-primary">
            <Save className="w-4 h-4" />
            {update.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Account info card */}
      <div className="card p-6">
        <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Account details</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-ink-100 dark:border-ink-800">
            <dt className="text-ink-500 dark:text-ink-400">Role</dt>
            <dd className="font-medium text-ink-900 dark:text-white capitalize">{user?.role}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-ink-100 dark:border-ink-800">
            <dt className="text-ink-500 dark:text-ink-400">Account ID</dt>
            <dd className="font-mono text-xs text-ink-600 dark:text-ink-400">{user?.id?.slice(0, 8)}…</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500 dark:text-ink-400">Member since</dt>
            <dd className="font-medium text-ink-900 dark:text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
