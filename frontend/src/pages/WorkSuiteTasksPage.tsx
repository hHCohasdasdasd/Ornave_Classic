import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, Task, Project } from '@/services/workSuiteService';
import './WorkSuite.css';

type StatusFilter = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE';

const STATUS_LABEL: Record<Task['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const NEXT_STATUS: Record<Task['status'], Task['status']> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO',
};

export const WorkSuiteTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFilter = searchParams.get('projectId') || '';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [taskList, projectList] = await Promise.all([
        workSuiteService.listTasks(projectIdFilter || undefined),
        workSuiteService.listProjects(),
      ]);
      setTasks(taskList);
      setProjects(projectList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest, projectIdFilter]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setProjectId(projectIdFilter || '');
    setDueDate('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setProjectId(task.projectId || '');
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: projectId || undefined,
        dueDate: dueDate || undefined,
      };
      if (editing) {
        await workSuiteService.updateTask(editing.id, payload);
      } else {
        await workSuiteService.createTask(payload);
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that task — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const advanceStatus = async (task: Task) => {
    await workSuiteService.updateTaskStatus(task.id, NEXT_STATUS[task.status]);
    await load();
  };

  const handleDelete = async (task: Task) => {
    await workSuiteService.deleteTask(task.id);
    await load();
  };

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);
  const activeProjectName = projects.find((p) => p.id === projectIdFilter)?.name;

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Tasks</h1>
          <p className="worksuite-page__subtitle">
            {activeProjectName ? `Filtered to project: ${activeProjectName}` : 'Everything on your plate, organized by status and priority.'}
          </p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-page__header-row">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="worksuite-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
              {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  className={`worksuite-tab${filter === s ? ' worksuite-tab--active' : ''}`}
                  onClick={() => setFilter(s)}
                >
                  {s === 'ALL' ? 'All' : STATUS_LABEL[s as Task['status']]}
                </button>
              ))}
            </div>
            <select
              className="worksuite-select"
              value={projectIdFilter}
              onChange={(e) => setSearchParams(e.target.value ? { projectId: e.target.value } : {})}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button className="worksuite-create-btn" onClick={openCreate}>+ New Task</button>
        </div>

        {isLoading ? (
          <div className="worksuite-empty">Loading tasks…</div>
        ) : filtered.length === 0 ? (
          <div className="worksuite-empty">No tasks here yet — create one to get started.</div>
        ) : (
          filtered.map((task) => (
            <div key={task.id} className="worksuite-task-row">
              <div className="worksuite-task-row__main">
                <div className="worksuite-task-row__title">{task.title}</div>
                <div className="worksuite-task-row__meta">
                  {task.project && <span>📁 {task.project.name}</span>}
                  {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <span className={`worksuite-badge worksuite-badge--${task.priority.toLowerCase()}`}>{task.priority}</span>
              <span className={`worksuite-badge worksuite-badge--${task.status.toLowerCase()}`}>{STATUS_LABEL[task.status]}</span>
              <div className="worksuite-task-row__actions">
                <button className="worksuite-btn" onClick={() => advanceStatus(task)}>
                  {task.status === 'DONE' ? 'Reopen' : `Mark ${STATUS_LABEL[NEXT_STATUS[task.status]]}`}
                </button>
                <button className="worksuite-btn" onClick={() => openEdit(task)}>Edit</button>
                <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(task)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Task' : 'New Task'}</h2>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Design homepage" maxLength={160} />
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional details" maxLength={500} />
            <label>Project</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <label>Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!title.trim() || isSaving}>
                {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
