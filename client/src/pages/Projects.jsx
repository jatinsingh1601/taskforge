import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, CheckCircle2, X, ArrowRight, Search } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import EmptyState from '../components/EmptyState';

export default function Projects() {
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (data) => api.post('/projects', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
      setShow(false);
      setForm({ name: '', description: '' });
    },
    onError: () => toast.error('Failed to create project'),
  });

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Projects</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            {projects.length} active project{projects.length === 1 ? '' : 's'} in your workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="input pl-10 w-56" />
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => setShow(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              New project
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-ink-100 dark:bg-ink-800 rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState icon={FolderKanban} title="No projects yet"
            description={user?.role === 'admin' ? "Create your first project to start organizing tasks." : "Ask an admin to add you to a project."}
            action={user?.role === 'admin' && (
              <button onClick={() => setShow(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Create your first project
              </button>
            )} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const progress = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="card p-5 hover:shadow-lift hover:border-forge-300 dark:hover:border-forge-700 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ink-100 to-ink-50 dark:from-ink-800 dark:to-ink-900 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-ink-700 dark:text-ink-300" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-300 dark:text-ink-600 group-hover:text-forge-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-semibold text-ink-900 dark:text-white group-hover:text-forge-600 dark:group-hover:text-forge-400 transition-colors line-clamp-2">
                  {p.name}
                </h3>
                {p.description && <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 line-clamp-2">{p.description}</p>}

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-ink-600 dark:text-ink-400">
                    <span className="font-medium">Progress</span>
                    <span className="tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-forge-500 to-forge-400 rounded-full transition-all"
                         style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-ink-100 dark:border-ink-800 text-xs">
                  <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{p.member_count} member{p.member_count == 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{p.done_count}/{p.task_count} done</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {show && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md shadow-lift animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">New project</h2>
              <button onClick={() => setShow(false)} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input" placeholder="e.g. Q1 Marketing Launch" autoFocus />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="input resize-none"
                  placeholder="What is this project about?" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShow(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={create.isPending} className="btn-primary">
                  {create.isPending ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
