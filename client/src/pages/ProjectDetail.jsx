import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import {
  Plus, UserPlus, X, Calendar, AlertOctagon, Trash2, ArrowLeft,
  ChevronRight, ClipboardList, Zap, Eye, CheckCircle2
} from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       icon: ClipboardList, accent: 'border-t-ink-400' },
  { id: 'in_progress', label: 'In Progress', icon: Zap,           accent: 'border-t-blue-500' },
  { id: 'review',      label: 'Review',      icon: Eye,           accent: 'border-t-amber-500' },
  { id: 'done',        label: 'Done',        icon: CheckCircle2,  accent: 'border-t-emerald-500' },
];

const PRIORITY_STYLES = {
  low:    'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  high:   'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

function TaskCard({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={() => onOpen(task)}
      className={`bg-white dark:bg-ink-900 rounded-lg p-3 border cursor-grab active:cursor-grabbing hover:shadow-soft transition-all
        ${task.is_overdue ? 'border-red-200 dark:border-red-900/50' : 'border-ink-200 dark:border-ink-800'}`}>
      <p className="text-sm font-medium text-ink-900 dark:text-white mb-2.5 leading-snug">{task.title}</p>

      <div className="flex items-center justify-between gap-2">
        <span className={`chip capitalize ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
        {task.assignee_name && (
          <div className="w-6 h-6 rounded-full text-[10px] text-white flex items-center justify-center font-bold shrink-0 shadow-soft"
            style={{ backgroundColor: task.assignee_color || '#f97316' }}
            title={task.assignee_name}>
            {task.assignee_name[0].toUpperCase()}
          </div>
        )}
      </div>

      {(task.due_date || task.is_overdue) && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-ink-100 dark:border-ink-800">
          {task.is_overdue ? (
            <AlertOctagon className="w-3 h-3 text-red-500" />
          ) : (
            <Calendar className="w-3 h-3 text-ink-400" />
          )}
          <span className={`text-[11px] font-medium ${task.is_overdue ? 'text-red-600' : 'text-ink-500'}`}>
            {task.due_date && new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {task.is_overdue && ' · Overdue'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [activeTask, setActiveTask]   = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [newTask, setNewTask]         = useState({ title: '', description: '', priority: 'medium', due_date: '', assignee_id: '' });
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [showAddMember, setShowAddMember]   = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/tasks/project/${id}`).then(r => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }) => api.patch(`/tasks/${taskId}/status`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', id] }),
  });
  const createTask = useMutation({
    mutationFn: (data) => api.post(`/tasks/project/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      toast.success('Task created');
      setShowCreate(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assignee_id: '' });
    },
    onError: () => toast.error('Failed to create task'),
  });
  const addMember = useMutation({
    mutationFn: (email) => api.post(`/projects/${id}/members`, { email }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Member added');
      setAddMemberEmail('');
      setShowAddMember(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add member'),
  });
  const deleteTask = useMutation({
    mutationFn: (taskId) => api.delete(`/tasks/${taskId}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      toast.success('Task deleted');
      setSelectedTask(null);
    },
  });

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    let targetColumnId = over.id;
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) targetColumnId = overTask.status;
    const column = COLUMNS.find(c => c.id === targetColumnId);
    if (column) {
      const activeTaskObj = tasks.find(t => t.id === active.id);
      if (activeTaskObj && activeTaskObj.status !== column.id) {
        updateStatus.mutate({ taskId: active.id, status: column.id });
        toast.success(`Moved to ${column.label}`);
      }
    }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        All projects
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-ink-900 dark:text-white">{project?.name || 'Loading…'}</h1>
            {project?.description && <p className="text-sm text-ink-500 dark:text-ink-400 mt-1.5">{project.description}</p>}

            {/* Members */}
            {project?.members?.length > 0 && (
              <div className="flex items-center gap-3 mt-4">
                <div className="flex -space-x-2">
                  {project.members.slice(0, 6).map(m => (
                    <div key={m.id}
                      className="w-7 h-7 rounded-full text-xs text-white flex items-center justify-center font-bold border-2 border-white dark:border-ink-900 shadow-soft"
                      style={{ backgroundColor: m.avatar_color }}
                      title={`${m.name} (${m.role})`}>
                      {m.name[0].toUpperCase()}
                    </div>
                  ))}
                  {project.members.length > 6 && (
                    <div className="w-7 h-7 rounded-full bg-ink-100 dark:bg-ink-800 text-[11px] text-ink-600 dark:text-ink-300 flex items-center justify-center font-semibold border-2 border-white dark:border-ink-900">
                      +{project.members.length - 6}
                    </div>
                  )}
                </div>
                <span className="text-xs text-ink-500 dark:text-ink-400">
                  {project.members.length} member{project.members.length === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowAddMember(true)} className="btn-secondary">
                <UserPlus className="w-4 h-4" /> Add member
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> New task
              </button>
            </div>
          )}
        </div>

        {/* Progress strip */}
        {totalTasks > 0 && (
          <div className="mt-5 pt-5 border-t border-ink-100 dark:border-ink-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-ink-500 dark:text-ink-400 font-medium">Project progress</span>
              <span className="text-ink-900 dark:text-white font-semibold tabular-nums">{doneTasks} / {totalTasks} · {progress}%</span>
            </div>
            <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-forge-500 to-forge-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveTask(tasks.find(t => t.id === active.id))}
        onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const Icon = col.icon;
            return (
              <div key={col.id}
                className={`bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 border-t-4 ${col.accent} p-3 min-h-[400px]`}>
                <div className="flex items-center justify-between px-1 mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-ink-500 dark:text-ink-400" />
                    <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{col.label}</h3>
                  </div>
                  <span className="text-[11px] font-semibold bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 rounded-md px-2 py-0.5 tabular-nums">
                    {tasksByStatus(col.id).length}
                  </span>
                </div>
                <SortableContext items={[...tasksByStatus(col.id).map(t => t.id), col.id]}
                  strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 min-h-[40px]" id={col.id}>
                    {tasksByStatus(col.id).map(task => (
                      <TaskCard key={task.id} task={task} onOpen={setSelectedTask} />
                    ))}
                    {tasksByStatus(col.id).length === 0 && (
                      <div className="text-center py-8 text-xs text-ink-400 dark:text-ink-600 border-2 border-dashed border-ink-200 dark:border-ink-800 rounded-lg">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="bg-white dark:bg-ink-800 rounded-lg p-3 shadow-lift border-2 border-forge-500 text-sm font-medium text-ink-900 dark:text-white">
              {activeTask.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-lg shadow-lift max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <span className={`chip mb-2 capitalize ${PRIORITY_STYLES[selectedTask.priority]}`}>{selectedTask.priority} priority</span>
                <h2 className="text-xl font-bold text-ink-900 dark:text-white">{selectedTask.title}</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-ink-400 hover:text-ink-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedTask.description && (
              <div className="mb-5">
                <p className="label">Description</p>
                <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{selectedTask.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-ink-100 dark:border-ink-800">
              <div>
                <p className="label">Status</p>
                <p className="text-sm font-medium text-ink-900 dark:text-white capitalize">{selectedTask.status.replace('_', ' ')}</p>
              </div>
              {selectedTask.due_date && (
                <div>
                  <p className="label">Due date</p>
                  <p className={`text-sm font-medium ${selectedTask.is_overdue ? 'text-red-600' : 'text-ink-900 dark:text-white'}`}>
                    {new Date(selectedTask.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {selectedTask.is_overdue && ' · Overdue'}
                  </p>
                </div>
              )}
              {selectedTask.assignee_name && (
                <div>
                  <p className="label">Assignee</p>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">{selectedTask.assignee_name}</p>
                </div>
              )}
              <div>
                <p className="label">Created by</p>
                <p className="text-sm font-medium text-ink-900 dark:text-white">{selectedTask.created_by_name || '—'}</p>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-5 flex justify-end">
                <button onClick={() => { if (window.confirm('Delete this task permanently?')) deleteTask.mutate(selectedTask.id); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" /> Delete task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md shadow-lift animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">New task</h2>
              <button onClick={() => setShowCreate(false)} className="text-ink-400 hover:text-ink-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createTask.mutate(newTask); }} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input required placeholder="e.g. Draft Q1 launch email" value={newTask.title}
                  onChange={e => setNewTask(f => ({ ...f, title: e.target.value }))}
                  className="input" autoFocus />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea placeholder="Add details, context, links…" rows={3} value={newTask.description}
                  onChange={e => setNewTask(f => ({ ...f, description: e.target.value }))}
                  className="input resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask(f => ({ ...f, priority: e.target.value }))} className="input">
                    {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input type="date" value={newTask.due_date}
                    onChange={e => setNewTask(f => ({ ...f, due_date: e.target.value }))} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Assign to</label>
                <select value={newTask.assignee_id}
                  onChange={e => setNewTask(f => ({ ...f, assignee_id: e.target.value }))} className="input">
                  <option value="">Unassigned</option>
                  {project?.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createTask.isPending} className="btn-primary">
                  {createTask.isPending ? 'Creating…' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-sm shadow-lift animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">Add member</h2>
              <button onClick={() => setShowAddMember(false)} className="text-ink-400 hover:text-ink-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addMember.mutate(addMemberEmail); }} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input type="email" required placeholder="teammate@company.com" value={addMemberEmail}
                  onChange={e => setAddMemberEmail(e.target.value)} className="input" autoFocus />
                <p className="text-[11px] text-ink-500 mt-1.5">The user must already have a TaskForge account.</p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={addMember.isPending} className="btn-primary">
                  {addMember.isPending ? 'Adding…' : 'Add member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
