import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { ThemedSelect } from '@/components/ui/ThemedSelect';
import { workSuiteService, Task, Project, Goal, Achievement } from '@/services/workSuiteService';
import { scopedKey } from '@/utils/storage';
import './WorkSuite.css';

type SectionTab = 'board' | 'goals' | 'achievements';

const SECTIONS: { key: SectionTab; label: string }[] = [
  { key: 'board', label: 'Board' },
  { key: 'goals', label: 'Goals' },
  { key: 'achievements', label: 'Achievements' },
];

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
  /** Delivery channels for the above — in-app is real (Navbar bell); email is
   * saved but not yet sent anywhere, since there's no email sender wired up. */
  notifyChannelApp: boolean;
  notifyChannelEmail: boolean;
}

const DEFAULT_PREFS: TaskBoardPrefs = {
  columnColors: DEFAULT_COLUMN_COLORS,
  notifyOverdue: true,
  notifyDueSoon: true,
  notifyChannelApp: true,
  notifyChannelEmail: false,
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

type GoalStatusFilter = 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'ALL';

export const WorkSuitePersonalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as SectionTab) || 'board';
  const projectIdFilter = searchParams.get('projectId') || '';

  const setTab = (tab: SectionTab) => {
    const next: Record<string, string> = { tab };
    if (tab === 'board' && projectIdFilter) next.projectId = projectIdFilter;
    setSearchParams(next);
  };

  // ---------------------------------------------------------------------
  // Board (Tasks / Kanban)
  // ---------------------------------------------------------------------
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('MEDIUM');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task['status'] | null>(null);

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

  const loadBoard = async () => {
    setIsLoadingBoard(true);
    try {
      const [taskList, projectList] = await Promise.all([
        workSuiteService.listTasks(projectIdFilter || undefined),
        workSuiteService.listProjects(),
      ]);
      setTasks(taskList);
      setProjects(projectList);
    } finally {
      setIsLoadingBoard(false);
    }
  };

  useEffect(() => {
    if (!isGuest) loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, projectIdFilter]);

  const pendingCreateStatus = React.useRef<Task['status']>('TODO');

  const openCreateTask = (status?: Task['status']) => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('MEDIUM');
    setTaskProjectId(projectIdFilter || '');
    setTaskDueDate('');
    setTaskError(null);
    setShowTaskModal(true);
    pendingCreateStatus.current = status || 'TODO';
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskPriority(task.priority);
    setTaskProjectId(task.projectId || '');
    setTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setTaskError(null);
    setShowTaskModal(true);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) return;
    setIsSavingTask(true);
    setTaskError(null);
    try {
      const payload = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        projectId: taskProjectId || undefined,
        dueDate: taskDueDate || undefined,
      };
      if (editingTask) {
        await workSuiteService.updateTask(editingTask.id, payload);
      } else {
        const created = await workSuiteService.createTask(payload);
        if (pendingCreateStatus.current !== 'TODO') {
          await workSuiteService.updateTaskStatus(created.id, pendingCreateStatus.current);
        }
      }
      setShowTaskModal(false);
      await loadBoard();
    } catch {
      setTaskError('Something went wrong saving that task — try again.');
    } finally {
      setIsSavingTask(false);
    }
  };

  const moveTask = async (task: Task, status: Task['status']) => {
    if (task.status === status) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await workSuiteService.updateTaskStatus(task.id, status);
    } catch {
      await loadBoard();
    }
  };

  const handleDeleteTask = async (task: Task) => {
    await workSuiteService.deleteTask(task.id);
    await loadBoard();
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

  const showBoardBanner =
    (prefs.notifyOverdue && overdueTasks.length > 0) || (prefs.notifyDueSoon && dueSoonTasks.length > 0);

  // ---------------------------------------------------------------------
  // Goals
  // ---------------------------------------------------------------------
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalFilter, setGoalFilter] = useState<GoalStatusFilter>('ACTIVE');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const loadGoals = async () => {
    setIsLoadingGoals(true);
    try {
      setGoals(await workSuiteService.listGoals());
    } finally {
      setIsLoadingGoals(false);
    }
  };

  useEffect(() => {
    if (!isGuest) loadGoals();
  }, [isGuest]);

  const openCreateGoal = () => {
    setEditingGoal(null);
    setGoalTitle('');
    setGoalDescription('');
    setGoalCategory('');
    setGoalTargetDate('');
    setGoalError(null);
    setShowGoalModal(true);
  };

  const openEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalDescription(goal.description || '');
    setGoalCategory(goal.category || '');
    setGoalTargetDate(goal.targetDate ? goal.targetDate.slice(0, 10) : '');
    setGoalError(null);
    setShowGoalModal(true);
  };

  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) return;
    setIsSavingGoal(true);
    setGoalError(null);
    try {
      const payload = {
        title: goalTitle.trim(),
        description: goalDescription.trim() || undefined,
        category: goalCategory.trim() || undefined,
        targetDate: goalTargetDate || undefined,
      };
      if (editingGoal) {
        await workSuiteService.updateGoal(editingGoal.id, payload);
      } else {
        await workSuiteService.createGoal(payload);
      }
      setShowGoalModal(false);
      await loadGoals();
    } catch {
      setGoalError('Something went wrong saving that goal — try again.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const bumpGoalProgress = async (goal: Goal, delta: number) => {
    await workSuiteService.updateGoalProgress(goal.id, goal.progress + delta);
    await loadGoals();
  };

  const setGoalStatus = async (goal: Goal, status: Goal['status']) => {
    await workSuiteService.updateGoal(goal.id, { status });
    await loadGoals();
  };

  const handleDeleteGoal = async (goal: Goal) => {
    await workSuiteService.deleteGoal(goal.id);
    await loadGoals();
  };

  const filteredGoals = goalFilter === 'ALL' ? goals : goals.filter((g) => g.status === goalFilter);

  // ---------------------------------------------------------------------
  // Achievements
  // ---------------------------------------------------------------------
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [achievementTitle, setAchievementTitle] = useState('');
  const [achievementDescription, setAchievementDescription] = useState('');
  const [achievementCategory, setAchievementCategory] = useState('');
  const [achievedAt, setAchievedAt] = useState('');
  const [isSavingAchievement, setIsSavingAchievement] = useState(false);
  const [achievementError, setAchievementError] = useState<string | null>(null);

  const loadAchievements = async () => {
    setIsLoadingAchievements(true);
    try {
      setAchievements(await workSuiteService.listAchievements());
    } finally {
      setIsLoadingAchievements(false);
    }
  };

  useEffect(() => {
    if (!isGuest) loadAchievements();
  }, [isGuest]);

  const openCreateAchievement = () => {
    setAchievementTitle('');
    setAchievementDescription('');
    setAchievementCategory('');
    setAchievedAt('');
    setAchievementError(null);
    setShowAchievementModal(true);
  };

  const handleSaveAchievement = async () => {
    if (!achievementTitle.trim()) return;
    setIsSavingAchievement(true);
    setAchievementError(null);
    try {
      await workSuiteService.createAchievement({
        title: achievementTitle.trim(),
        description: achievementDescription.trim() || undefined,
        category: achievementCategory.trim() || undefined,
        achievedAt: achievedAt || undefined,
      });
      setShowAchievementModal(false);
      await loadAchievements();
    } catch {
      setAchievementError('Something went wrong logging that achievement — try again.');
    } finally {
      setIsSavingAchievement(false);
    }
  };

  const handleDeleteAchievement = async (achievement: Achievement) => {
    await workSuiteService.deleteAchievement(achievement.id);
    await loadAchievements();
  };

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Planning</h1>
          <p className="worksuite-page__subtitle">Your board, goals, and achievements — all in one place.</p>
        </div>
      </div>

      <div className={`worksuite-page__container${activeTab === 'board' ? ' worksuite-page__container--wide' : ''}`}>
        <div className="worksuite-tabs">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              className={`worksuite-tab${activeTab === s.key ? ' worksuite-tab--active' : ''}`}
              onClick={() => setTab(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {activeTab === 'board' && (
          <>
            <div className="worksuite-page__header-row">
              <div style={{ maxWidth: '220px' }}>
                <ThemedSelect
                  value={projectIdFilter}
                  options={[{ value: '', label: 'All Projects' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
                  onChange={(v) => setSearchParams(v ? { tab: 'board', projectId: v } : { tab: 'board' })}
                />
              </div>
              <button className="worksuite-create-btn" onClick={() => openCreateTask()}>+ New Task</button>
            </div>

            {activeProjectName && (
              <p className="worksuite-page__subtitle" style={{ marginTop: '-8px' }}>Filtered to project: {activeProjectName}</p>
            )}

            {showBoardBanner && (
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

            {isLoadingBoard ? (
              <div className="worksuite-empty">Loading tasks…</div>
            ) : (
              <div className="worksuite-tasks-layout">
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
                                    <ThemedSelect
                                      className="worksuite-kanban-card__move-select-themed"
                                      value={task.status}
                                      options={COLUMNS.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
                                      onChange={(v) => moveTask(task, v as Task['status'])}
                                      title="Move to another column"
                                    />
                                    <div className="worksuite-kanban-card__actions">
                                      <button className="worksuite-kanban-card__icon-btn" onClick={() => openEditTask(task)} title="Edit">✎</button>
                                      <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDeleteTask(task)} title="Delete">✕</button>
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
                          onClick={() => openCreateTask(status)}
                        >
                          + Add task
                        </button>
                      </div>
                    );
                  })}
                </div>

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

                    <h4 style={{ marginTop: '16px' }}>Notify me via</h4>
                    <label className="worksuite-tasks-settings__checkbox-row">
                      <input
                        type="checkbox"
                        checked={prefs.notifyChannelApp}
                        onChange={(e) => updatePrefs({ notifyChannelApp: e.target.checked })}
                      />
                      <span>App (Navbar notification bell)</span>
                    </label>
                    <label className="worksuite-tasks-settings__checkbox-row">
                      <input
                        type="checkbox"
                        checked={prefs.notifyChannelEmail}
                        onChange={(e) => updatePrefs({ notifyChannelEmail: e.target.checked })}
                      />
                      <span>Email</span>
                    </label>
                    <p className="worksuite-tasks-settings__hint">
                      App notifications show up here on the board and in the Navbar bell. Email delivery isn't
                      connected yet — this saves your preference for once it is, but no emails will send.
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}

        {activeTab === 'goals' && (
          <>
            <div className="worksuite-page__header-row">
              <div className="worksuite-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
                {(['ACTIVE', 'COMPLETED', 'ABANDONED', 'ALL'] as GoalStatusFilter[]).map((s) => (
                  <button
                    key={s}
                    className={`worksuite-tab${goalFilter === s ? ' worksuite-tab--active' : ''}`}
                    onClick={() => setGoalFilter(s)}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <button className="worksuite-create-btn" onClick={openCreateGoal}>+ New Goal</button>
            </div>

            <div className="worksuite-grid">
              {isLoadingGoals ? (
                <div className="worksuite-empty">Loading goals…</div>
              ) : filteredGoals.length === 0 ? (
                <div className="worksuite-empty">No goals here yet — set one to start tracking progress.</div>
              ) : (
                filteredGoals.map((goal) => (
                  <div key={goal.id} className="worksuite-card">
                    <div className="worksuite-card__header">
                      <div>
                        <div className="worksuite-card__title">{goal.title}</div>
                        {goal.category && <div className="worksuite-card__meta">{goal.category}</div>}
                      </div>
                      <span className={`worksuite-badge worksuite-badge--${goal.status.toLowerCase()}`}>
                        {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="worksuite-card__description">
                      {goal.description || 'No description yet.'}
                      {goal.targetDate && <><br />Target: {new Date(goal.targetDate).toLocaleDateString()}</>}
                    </p>
                    <div className="worksuite-progress">
                      <div className="worksuite-progress__track">
                        <div className="worksuite-progress__fill" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <div className="worksuite-progress__label">
                        <span>{goal.progress}% complete</span>
                      </div>
                    </div>
                    <div className="worksuite-card__actions">
                      {goal.status === 'ACTIVE' && (
                        <>
                          <button className="worksuite-btn" onClick={() => bumpGoalProgress(goal, -10)} disabled={goal.progress <= 0}>-10%</button>
                          <button className="worksuite-btn" onClick={() => bumpGoalProgress(goal, 10)} disabled={goal.progress >= 100}>+10%</button>
                        </>
                      )}
                      <button className="worksuite-btn" onClick={() => openEditGoal(goal)}>Edit</button>
                      {goal.status === 'ACTIVE' && (
                        <button className="worksuite-btn" onClick={() => setGoalStatus(goal, 'ABANDONED')}>Abandon</button>
                      )}
                      {goal.status !== 'ACTIVE' && (
                        <button className="worksuite-btn" onClick={() => setGoalStatus(goal, 'ACTIVE')}>Reactivate</button>
                      )}
                      <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDeleteGoal(goal)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'achievements' && (
          <>
            <div className="worksuite-page__header-row">
              <div />
              <button className="worksuite-create-btn" onClick={openCreateAchievement}>+ Log Achievement</button>
            </div>

            {isLoadingAchievements ? (
              <div className="worksuite-empty">Loading achievements…</div>
            ) : achievements.length === 0 ? (
              <div className="worksuite-empty">Nothing logged yet — record your first win.</div>
            ) : (
              achievements.map((achievement) => (
                <div key={achievement.id} className="worksuite-achievement">
                  <div className="worksuite-achievement__icon">🏆</div>
                  <div className="worksuite-achievement__main">
                    <div className="worksuite-achievement__title">{achievement.title}</div>
                    <div className="worksuite-achievement__meta">
                      <span>{new Date(achievement.achievedAt).toLocaleDateString()}</span>
                      {achievement.category && <span>{achievement.category}</span>}
                    </div>
                    {achievement.description && (
                      <p className="worksuite-achievement__description">{achievement.description}</p>
                    )}
                  </div>
                  <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDeleteAchievement(achievement)}>Delete</button>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {showTaskModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
            <label>Title</label>
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Design homepage" maxLength={160} />
            <label>Description</label>
            <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={3} placeholder="Optional details" maxLength={500} />
            <label>Project</label>
            <ThemedSelect
              value={taskProjectId}
              options={[{ value: '', label: 'No project' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
              onChange={setTaskProjectId}
            />
            <label>Priority</label>
            <ThemedSelect
              value={taskPriority}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
              ]}
              onChange={(v) => setTaskPriority(v as Task['priority'])}
            />
            <label>Due Date</label>
            <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
            {taskError && <p className="worksuite-modal__error">{taskError}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSaveTask} disabled={!taskTitle.trim() || isSavingTask}>
                {isSavingTask ? 'Saving…' : editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingGoal ? 'Edit Goal' : 'New Goal'}</h2>
            <label>Title</label>
            <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Run a 5K" maxLength={160} />
            <label>Description</label>
            <textarea value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} rows={3} placeholder="Optional details" maxLength={500} />
            <label>Category</label>
            <input value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)} placeholder="Fitness, Career, Learning…" maxLength={60} />
            <label>Target Date</label>
            <input type="date" value={goalTargetDate} onChange={(e) => setGoalTargetDate(e.target.value)} />
            {goalError && <p className="worksuite-modal__error">{goalError}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowGoalModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSaveGoal} disabled={!goalTitle.trim() || isSavingGoal}>
                {isSavingGoal ? 'Saving…' : editingGoal ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAchievementModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowAchievementModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Log Achievement</h2>
            <label>Title</label>
            <input value={achievementTitle} onChange={(e) => setAchievementTitle(e.target.value)} placeholder="Finished my first 5K" maxLength={160} />
            <label>Description</label>
            <textarea value={achievementDescription} onChange={(e) => setAchievementDescription(e.target.value)} rows={3} placeholder="Optional details" maxLength={500} />
            <label>Category</label>
            <input value={achievementCategory} onChange={(e) => setAchievementCategory(e.target.value)} placeholder="Fitness, Career, Learning…" maxLength={60} />
            <label>Date</label>
            <input type="date" value={achievedAt} onChange={(e) => setAchievedAt(e.target.value)} />
            {achievementError && <p className="worksuite-modal__error">{achievementError}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowAchievementModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSaveAchievement} disabled={!achievementTitle.trim() || isSavingAchievement}>
                {isSavingAchievement ? 'Saving…' : 'Log Achievement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
