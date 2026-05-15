import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Zap, CheckCircle2, AlertOctagon, Inbox, Calendar,
  TrendingUp, Clock, Activity, FolderKanban, ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import EmptyState from '../components/EmptyState';

const STATUS_META = {
  todo:        { label: 'To Do',       color: 'bg-ink-400',     text: 'text-ink-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500',    text: 'text-blue-700' },
  review:      { label: 'Review',      color: 'bg-amber-500',   text: 'text-amber-700' },
  done:        { label: 'Done',        color: 'bg-emerald-500', text: 'text-emerald-700' },
};

function StatCard({ label, value, icon: Icon, accent = 'ink', sub }) {
  const accentClasses = {
    ink:     'text-ink-600 dark:text-ink-300 bg-ink-100 dark:bg-ink-800',
    blue:    'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    red:     'text-red-600 bg-red-50 dark:bg-red-950/30',
    amber:   'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    forge:   'text-forge-600 bg-forge-50 dark:bg-forge-500/10',
  };
  return (
    <div className="card p-5 hover:shadow-soft transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentClasses[accent]}`}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-ink-900 dark:text-white tabular-nums">{value ?? 0}</p>
      </div>
      {sub && <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{sub}</p>}
    </div>
  );
}

function StatusBar({ byStatus = {}, total = 0 }) {
  if (total === 0) {
    return (
      <div className="space-y-2">
        <div className="h-2.5 rounded-full bg-ink-100 dark:bg-ink-800" />
        <p className="text-xs text-ink-500 dark:text-ink-400 text-center pt-2">Create your first task to see the breakdown.</p>
      </div>
    );
  }
  const order = ['todo', 'in_progress', 'review', 'done'];
  return (
    <div className="space-y-4">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-ink-100 dark:bg-ink-800">
        {order.map(s => {
          const v = byStatus[s] || 0;
          const pct = (v / total) * 100;
          return pct > 0 ? <div key={s} className={STATUS_META[s].color} style={{ width: `${pct}%` }} title={`${STATUS_META[s].label}: ${v}`} /> : null;
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {order.map(s => {
          const v = byStatus[s] || 0;
          const pct = total > 0 ? Math.round((v / total) * 100) : 0;
          return (
            <div key={s} className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${STATUS_META[s].color}`} />
              <div>
                <p className="text-xs text-ink-500 dark:text-ink-400">{STATUS_META[s].label}</p>
                <p className="text-sm font-semibold text-ink-900 dark:text-white tabular-nums">{v} <span className="text-ink-400 font-normal text-xs">· {pct}%</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectProgressRow({ p }) {
  const total = parseInt(p.total_tasks) || 0;
  const done  = parseInt(p.done_tasks)  || 0;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Link to={`/projects/${p.id}`} className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors group">
      <div className="w-9 h-9 rounded-lg bg-ink-100 dark:bg-ink-800 flex items-center justify-center shrink-0">
        <FolderKanban className="w-4 h-4 text-ink-500 dark:text-ink-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{p.name}</p>
          <span className="text-xs tabular-nums text-ink-500 dark:text-ink-400 shrink-0">{done}/{total}</span>
        </div>
        <div className="h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-forge-500 to-forge-400 rounded-full transition-all"
               style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-ink-300 dark:text-ink-600 group-hover:text-forge-500 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'admin';

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    enabled: isAdmin,
  });

  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/dashboard/my-tasks').then(r => r.data),
  });

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-ink-500 dark:text-ink-400">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-3xl font-bold text-ink-900 dark:text-white mt-1">
            {greeting}, {user?.name?.split(' ')[0] || 'there'}.
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            {isAdmin ? "Here's how your team is performing today." : "Here's what's on your plate."}
          </p>
        </div>
      </div>

      {/* Admin view */}
      {isAdmin && stats && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Tasks" value={stats.totalTasks} icon={ClipboardList} accent="ink"
              sub={`${stats.projectStats?.length || 0} active project${stats.projectStats?.length === 1 ? '' : 's'}`} />
            <StatCard label="In Progress" value={stats.byStatus?.in_progress || 0} icon={Zap} accent="blue"
              sub="Currently being worked on" />
            <StatCard label="Completed" value={stats.byStatus?.done || 0} icon={CheckCircle2} accent="emerald"
              sub={stats.totalTasks ? `${Math.round(((stats.byStatus?.done || 0) / stats.totalTasks) * 100)}% completion rate` : 'No tasks yet'} />
            <StatCard label="Overdue" value={stats.overdue?.length || 0} icon={AlertOctagon} accent="red"
              sub={stats.overdue?.length ? 'Needs attention' : 'All on schedule'} />
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Status distribution */}
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-ink-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-forge-500" />
                    Task Distribution
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Status breakdown across all projects</p>
                </div>
              </div>
              <StatusBar byStatus={stats.byStatus} total={stats.totalTasks} />
            </div>

            {/* Overdue card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink-900 dark:text-white flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-500" />
                  Overdue
                </h3>
                {stats.overdue?.length > 0 && (
                  <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md">
                    {stats.overdue.length}
                  </span>
                )}
              </div>
              {stats.overdue?.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.overdue.slice(0, 4).map(t => (
                    <div key={t.id} className="flex items-start justify-between gap-3 pb-2.5 border-b border-ink-100 dark:border-ink-800 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{t.title}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{t.project_name}</p>
                      </div>
                      <span className="text-[11px] font-medium text-red-600 shrink-0 mt-0.5">
                        {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-ink-900 dark:text-white">All caught up</p>
                  <p className="text-xs text-ink-500 mt-0.5">Nothing overdue.</p>
                </div>
              )}
            </div>
          </div>

          {/* Project progress + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-ink-900 dark:text-white flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-forge-500" />
                    Project Progress
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Completion status across active projects</p>
                </div>
                <Link to="/projects" className="text-xs font-semibold text-forge-600 hover:underline">View all →</Link>
              </div>
              {stats.projectStats?.length > 0 ? (
                <div className="space-y-1">
                  {stats.projectStats.slice(0, 6).map(p => <ProjectProgressRow key={p.id} p={p} />)}
                </div>
              ) : (
                <EmptyState icon={FolderKanban} title="No projects yet"
                  description="Create your first project to start tracking work." />
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-ink-900 dark:text-white flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-forge-500" />
                Recent Activity
              </h3>
              {stats.recentActivity?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 6).map((a, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-forge-500 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-ink-700 dark:text-ink-200">
                          <span className="font-semibold text-ink-900 dark:text-white">{a.user_name || 'Someone'}</span>{' '}
                          <span className="text-ink-500">{a.details || a.action}</span>
                        </p>
                        <p className="text-ink-400 dark:text-ink-500 mt-0.5">
                          {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-500 text-center py-4">No activity yet.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* My Tasks (everyone) */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-ink-900 dark:text-white flex items-center gap-2">
              <Inbox className="w-4 h-4 text-forge-500" />
              My Tasks
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              {myTasks?.length || 0} task{myTasks?.length === 1 ? '' : 's'} assigned to you
            </p>
          </div>
        </div>
        {!myTasks?.length ? (
          <EmptyState icon={CheckCircle2} title="You're all clear"
            description="No tasks assigned to you right now. Enjoy the calm." />
        ) : (
          <div className="space-y-1.5">
            {myTasks.map(t => (
              <div key={t.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors
                  ${t.is_overdue
                    ? 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/10'
                    : 'border-ink-200 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800/40'}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_META[t.status]?.color || 'bg-ink-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{t.title}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{t.project_name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.due_date && (
                    <span className={`chip ${t.is_overdue ? 'bg-red-100 text-red-700' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300'}`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <span className={`chip capitalize ${
                    t.status === 'done'        ? 'bg-emerald-100 text-emerald-700' :
                    t.status === 'in_progress' ? 'bg-blue-100 text-blue-700'      :
                    t.status === 'review'      ? 'bg-amber-100 text-amber-700'    :
                                                  'bg-ink-100 text-ink-700'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
