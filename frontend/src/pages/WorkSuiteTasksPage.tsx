import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, Task, Project } from '@/services/workSuiteService';
import { scopedKey } from '@/utils/storage';
import './WorkSuite.css';

const COLUMNS: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE'];

const STATUS_LABEL: Record<Task['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const DEFAULT_COLUMN_COLORS: Record<Task['status'], string> = {
  TODO: '#9d9483',
  IN_PROGRESS: '#c6a15b',
  DONE: '#3f6f47',
};

interface TaskBoardPrefs {
  columnColors: Record<Task['status'], string>;
  notifyOverdue: boolean;
  notifyDueSoon: boolean;
}

const DEFAULT_PREFS: TaskBoardPrefs = {
  columnColors: DEFAULT_COLUMN_COLORS,
  notifyOverdue: true,
  notifyDueSoon: true,
};

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate).setHours(23, 59, 59, 999) < Date.now();
}

function isDueSoon(task: Task): boolean {
  if (!task.dueDate || task.status === 'DONE' || isOverdue(task)) return false;
  const days = (new Date(task.dueDate).getTime() - Date.now()) / 86400000;
  return days >= 0 && days <= 3;
}

export const WorkSuiteTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFilter = searchParams.get('projectId') || '';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drag-and-drop state — which card is being dragged, and which column
  // it's currently hovering over (for the drop-target highlight).
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task['status'] | null>(null);

  // Board customization — client-side only (no backend model for this),
  // scoped per user so it doesn't bleed across accounts sharing a browser.
  const prefsKey = scopedKey('worksuite_task_prefs', user?.id);
  const [prefs, setPrefs] = useState<TaskBoardPrefs>(() => {
    try {
      const raw = localStorage.getItem(prefsKey);
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const updatePrefs = (next: Partial<TaskBoardPrefs>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(prefsKey, JSON.stringify(merged));
      return merged;
    });
  };

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

  const openCreate = (status?: Task['status']) => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setProjectId(projectIdFilter || '');
    setDueDate('');
    setError(null);
    setShowModal(true);
    // Stash the target column so a card created from a specific column's
    // "+" button lands there instead of always defaulting to To Do.
    pendingCreateStatus.current = status || 'TODO';
  };
  const pendingCreateStatus = React.useRef<Task['status']>('TODO');

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
        const created = await workSuiteService.createTask(payload);
        if (pendingCreateStatus.current !== 'TODO') {
          await workSuiteService.updateTaskStatus(created.id, pendingCreateStatus.current);
        }
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that task — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const moveTask = async (task: Task, status: Task['status']) => {
    if (task.status === status) return;
    // Optimistic update so the card jumps columns instantly instead of
    // waiting on the round trip.
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await workSuiteService.updateTaskStatus(task.id, status);
    } catch {
      await load(); // reconcile with the server if the update failed
    }
  };

  const handleDelete = async (task: Task) => {
    await workSuiteService.deleteTask(task.id);
    await load();
  };

  const activeProjectName = projects.find((p) => p.id === projectIdFilter)?.name;

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggingTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleColumnDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t.id === taskId);
    setDragOverColumn(null);
    setDraggingTaskId(null);
    if (task) moveTask(task, status);
  };

  const overdueTasks = tasks.filter(isOverdue);
  const dueSoonTasks = tasks.filter(isDueSoon);
  const upcoming = [...tasks]
    .filter((t) => t.dueDate && t.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const showBanner =
    (prefs.notifyOverdue && overdueTasks.length > 0) || (prefs.notifyDueSoon && dueSoonTasks.length > 0);

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Tasks</h1>
          <p className="worksuite-page__subtitle">
            {activeProjectName ? `Filtered to project: ${activeProjectName}` : 'Drag cards between columns, or use the menu on each card.'}
          </p>
        </div>
      </div>

      <div className="worksuite-page__container worksuite-page__container--wide">
        <div className="worksuite-page__header-row">
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
          <button className="worksuite-create-btn" onClick={() => openCreate()}>+ New Task</button>
        </div>

        {showBanner && (
          <div className="worksuite-tasks-banner">
            {prefs.notifyOverdue && overdueTasks.length > 0 && (
              <span className="worksuite-tasks-banner__item worksuite-tasks-banner__item--overdue">
                ⚠ {overdueTasks.length} overdue
              </span>
            )}
            {prefs.notifyDueSoon && dueSoonTasks.length > 0 && (
              <span className="worksuite-tasks-banner__item">
                ⏳ {dueSoonTasks.length} due within 3 days
              </span>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="worksuite-empty">Loading tasks…</div>
        ) : (
          <div className="worksuite-tasks-layout">
            {/* Left: compact overview */}
            <aside className="worksuite-tasks-sidebar">
              <div className="worksuite-tasks-sidebar__section">
                <h4>Overview</h4>
                <div className="worksuite-tasks-overview__total">{tasks.length}</div>
                <div className="worksuite-tasks-overview__total-label">Total tasks</div>
              </div>

              <div className="worksuite-tasks-sidebar__section">
                {COLUMNS.map((status) => (
                  <div key={status} className="worksuite-tasks-overview__stat-row">
                    <span
                      className="worksuite-tasks-overview__dot"
                      style={{ background: prefs.columnColors[status] }}
                    />
                    <span className="worksuite-tasks-overview__stat-label">{STATUS_LABEL[status]}</span>
                    <span className="worksuite-tasks-overview__stat-value">
                      {tasks.filter((t) => t.status === status).length}
                    </span>
                  </div>
                ))}
              </div>

              <div className="worksuite-tasks-sidebar__section">
                <div className="worksuite-tasks-overview__stat-row">
                  <span className="worksuite-tasks-overview__dot" style={{ background: '#a2504b' }} />
                  <span className="worksuite-tasks-overview__stat-label">Overdue</span>
                  <span className="worksuite-tasks-overview__stat-value">{overdueTasks.length}</span>
                </div>
                <div className="worksuite-tasks-overview__stat-row">
                  <span className="worksuite-tasks-overview__dot" style={{ background: '#c6a15b' }} />
                  <span className="worksuite-tasks-overview__stat-label">Due soon</span>
                  <span className="worksuite-tasks-overview__stat-value">{dueSoonTasks.length}</span>
                </div>
              </div>

              {upcoming.length > 0 && (
                <div className="worksuite-tasks-sidebar__section">
                  <h4>Upcoming</h4>
                  {upcoming.map((t) => (
                    <div key={t.id} className="worksuite-tasks-overview__upcoming-item">
                      <span>{t.title}</span>
                      <span className="worksuite-tasks-overview__upcoming-date">
                        {new Date(t.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </aside>

            {/* Middle: the board itself */}
            <div className="worksuite-kanban">
              {COLUMNS.map((status) => {
                const columnTasks = tasks.filter((t) => t.status === status);
                const columnColor = prefs.columnColors[status];
                return (
                  <div
                    key={status}
                    className={`worksuite-kanban__column${dragOverColumn === status ? ' worksuite-kanban__column--drag-over' : ''}`}
                    style={{ borderTop: `3px solid ${columnColor}` }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverColumn(status); }}
                    onDragLeave={() => setDragOverColumn((prev) => (prev === status ? null : prev))}
                    onDrop={(e) => handleColumnDrop(e, status)}
                  >
                    <div className="worksuite-kanban__column-header">
                      <span>
                        <span className="worksuite-tasks-overview__dot" style={{ background: columnColor, marginRight: '8px' }} />
                        {STATUS_LABEL[status]}
                      </span>
                      <span className="worksuite-kanban__column-count">{columnTasks.length}</span>
                    </div>

                    <div className="worksuite-kanban__cards">
                      {columnTasks.length === 0 ? (
                        <div className="worksuite-kanban__empty">Drop a task here</div>
                      ) : (
                        columnTasks.map((task) => {
                          const overdue = prefs.notifyOverdue && isOverdue(task);
                          const dueSoon = prefs.notifyDueSoon && isDueSoon(task);
                          return (
                            <div
                              key={task.id}
                              className={`worksuite-kanban-card${draggingTaskId === task.id ? ' worksuite-kanban-card--dragging' : ''}`}
                              style={{ borderLeft: `4px solid ${columnColor}` }}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task)}
                              onDragEnd={handleDragEnd}
                            >
                              <div className="worksuite-kanban-card__top">
                                <h3 className="worksuite-kanban-card__title">{task.title}</h3>
                                <span className={`worksuite-badge worksuite-badge--${task.priority.toLowerCase()}`}>{task.priority}</span>
                              </div>

                              {(task.project || task.dueDate || overdue || dueSoon) && (
                                <div className="worksuite-kanban-card__meta">
                                  {task.project && <span>📁 {task.project.name}</span>}
                                  {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                                  {overdue && <span className="worksuite-kanban-card__flag worksuite-kanban-card__flag--overdue">Overdue</span>}
                                  {!overdue && dueSoon && <span className="worksuite-kanban-card__flag">Due soon</span>}
                                </div>
                              )}

                              <div className="worksuite-kanban-card__footer">
                                <select
                                  className="worksuite-kanban-card__move-select"
                                  value={task.status}
                                  onChange={(e) => moveTask(task, e.target.value as Task['status'])}
                                  title="Move to another column"
                                >
                                  {COLUMNS.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                                  ))}
                                </select>
                                <div className="worksuite-kanban-card__actions">
                                  <button className="worksuite-kanban-card__icon-btn" onClick={() => openEdit(task)} title="Edit">✎</button>
                                  <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDelete(task)} title="Delete">✕</button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button
                      className="worksuite-kanban-card__move-select"
                      style={{ width: '100%', marginTop: '10px', padding: '8px', cursor: 'pointer' }}
                      onClick={() => openCreate(status)}
                    >
                      + Add task
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right: customization settings */}
            <aside className="worksuite-tasks-sidebar">
              <div className="worksuite-tasks-sidebar__section">
                <h4>Card Colors</h4>
                {COLUMNS.map((status) => (
                  <div key={status} className="worksuite-tasks-settings__color-row">
                    <span>{STATUS_LABEL[status]}</span>
                    <input
                      type="color"
                      value={prefs.columnColors[status]}
                      onChange={(e) =>
                        updatePrefs({ columnColors: { ...prefs.columnColors, [status]: e.target.value } })
                      }
                    />
                  </div>
                ))}
                {JSON.stringify(prefs.columnColors) !== JSON.stringify(DEFAULT_COLUMN_COLORS) && (
                  <button
                    className="worksuite-kanban-card__move-select"
                    style={{ width: '100%', marginTop: '8px', padding: '6px', cursor: 'pointer' }}
                    onClick={() => updatePrefs({ columnColors: DEFAULT_COLUMN_COLORS })}
                  >
                    Reset colors
                  </button>
                )}
              </div>

              <div className="worksuite-tasks-sidebar__section">
                <h4>Notifications</h4>
                <label className="worksuite-tasks-settings__checkbox-row">
                  <input
                    type="checkbox"
                    checked={prefs.notifyOverdue}
                    onChange={(e) => updatePrefs({ notifyOverdue: e.target.checked })}
                  />
                  <span>Flag overdue tasks</span>
                </label>
                <label className="worksuite-tasks-settings__checkbox-row">
                  <input
                    type="checkbox"
                    checked={prefs.notifyDueSoon}
                    onChange={(e) => updatePrefs({ notifyDueSoon: e.target.checked })}
                  />
                  <span>Flag tasks due within 3 days</span>
                </label>
                <p className="worksuite-tasks-settings__hint">
                  These show as banners and badges here on the board — there's no email/push delivery yet.
                </p>
              </div>
            </aside>
          </div>
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
