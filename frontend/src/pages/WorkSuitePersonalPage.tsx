import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { ThemedSelect } from '@/components/ui/ThemedSelect';
import { ThemedDatePicker } from '@/components/ui/ThemedDatePicker';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { workSuiteService, Task, Project, Goal, Note, NoteType } from '@/services/workSuiteService';
import { scopedKey } from '@/utils/storage';
import './WorkSuite.css';

type SectionTab = 'board' | 'goals' | 'notes' | 'focus';

const SECTIONS: { key: SectionTab; label: string }[] = [
  { key: 'board', label: 'Board' },
  { key: 'goals', label: 'Goals' },
  { key: 'notes', label: 'Notes' },
  { key: 'focus', label: 'Focus' },
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

const GOAL_CATEGORY_COLORS = ['#c6a15b', '#6b8cae', '#7c9473', '#b5714f', '#8a6a92', '#7d8694'];

function goalCategoryColor(category?: string): string {
  if (!category) return GOAL_CATEGORY_COLORS[0];
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return GOAL_CATEGORY_COLORS[hash % GOAL_CATEGORY_COLORS.length];
}

/** Deterministic accent color from an id — used for note cards, which have
 * no category field of their own to color by. Same palette as goals so the
 * app's color language stays consistent. */
function accentColorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GOAL_CATEGORY_COLORS[hash % GOAL_CATEGORY_COLORS.length];
}

/** Plain-text version of a NOTE's rich HTML content — for card previews and
 * the title-fallback logic, which have no business rendering markup. Sticky
 * and mind-map notes stay plain text at the source, so this is a no-op there. */
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

// Classic sticky-note colors — warm paper tones, not the app's usual gold/dark palette,
// since the whole point of the sticky wall is to feel like a physical corkboard.
const STICKY_COLORS = ['#f4d35e', '#f4a261', '#f28482', '#a7c957', '#8ecae6', '#cdb4db'];

function stickyRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (hash % 9) - 4; // -4deg..4deg, deterministic per note so it doesn't jitter on re-render
}

/** Evenly spaced point on a circle around a mind-map root, starting at the top. */
function mindMapBranchOffset(index: number, total: number, radius = 150): { x: number; y: number } {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
}

function goalDeadlineInfo(targetDate?: string): { label: string; overdue: boolean; soon: boolean } | null {
  if (!targetDate) return null;
  const days = Math.ceil((new Date(targetDate).setHours(23, 59, 59, 999) - Date.now()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, overdue: true, soon: false };
  if (days === 0) return { label: 'Due today', overdue: false, soon: true };
  if (days <= 7) return { label: `${days}d left`, overdue: false, soon: true };
  return { label: `${days}d left`, overdue: false, soon: false };
}

const GOAL_RING_RADIUS = 30;
const GOAL_RING_CIRCUMFERENCE = 2 * Math.PI * GOAL_RING_RADIUS;

const GoalProgressRing: React.FC<{ progress: number; color: string }> = ({ progress, color }) => {
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = GOAL_RING_CIRCUMFERENCE * (1 - clamped / 100);
  return (
    <div className="goal-card__ring">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={GOAL_RING_RADIUS} fill="none" stroke="rgba(246, 243, 237, 0.1)" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={GOAL_RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={GOAL_RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <span className="goal-card__ring-value">{clamped}%</span>
    </div>
  );
};

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

  // Optimistic updates — mutate local state immediately so the ring/bar
  // animates smoothly instead of the whole grid flashing to "Loading…"
  // while a full re-fetch (loadGoals) plays out. Reconcile with the server
  // only if the request actually fails.
  const bumpGoalProgress = async (goal: Goal, delta: number) => {
    const newProgress = Math.max(0, Math.min(100, goal.progress + delta));
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, progress: newProgress } : g)));
    try {
      await workSuiteService.updateGoalProgress(goal.id, newProgress);
    } catch {
      await loadGoals();
    }
  };

  const setGoalStatus = async (goal: Goal, status: Goal['status']) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, status } : g)));
    try {
      await workSuiteService.updateGoal(goal.id, { status });
    } catch {
      await loadGoals();
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    try {
      await workSuiteService.deleteGoal(goal.id);
    } catch {
      await loadGoals();
    }
  };

  const filteredGoals = goalFilter === 'ALL' ? goals : goals.filter((g) => g.status === goalFilter);
  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const completedGoals = goals.filter((g) => g.status === 'COMPLETED');
  const avgActiveProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  // ---------------------------------------------------------------------
  // Notes — three flavors sharing one Note model (type field): plain NOTE
  // (the original list view), STICKY (a corkboard of colorful tilted
  // cards), and MINDMAP (a root node with branches radiating around it,
  // one level deep). Which view is open determines what a "+ New…" button
  // creates — the create modal itself doesn't expose a type switcher, since
  // that only matters at creation time and keeping it out of the modal
  // keeps the common "just jot a note" case simple.
  // ---------------------------------------------------------------------
  type NoteView = 'list' | 'sticky' | 'mindmap';
  const [noteView, setNoteView] = useState<NoteView>('list');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteType, setNoteType] = useState<NoteType>('NOTE');
  const [noteParentId, setNoteParentId] = useState<string | undefined>(undefined);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState(STICKY_COLORS[0]);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const loadNotes = async () => {
    setIsLoadingNotes(true);
    try {
      setNotes(await workSuiteService.listNotes());
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (!isGuest) loadNotes();
  }, [isGuest]);

  const openCreateNote = (opts?: { type?: NoteType; parentId?: string }) => {
    setEditingNote(null);
    setNoteType(opts?.type || 'NOTE');
    setNoteParentId(opts?.parentId);
    setNoteTitle('');
    setNoteContent('');
    setNoteColor(STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)]);
    setNoteError(null);
    setShowNoteModal(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteType(note.type);
    setNoteParentId(note.parentId);
    setNoteTitle(note.title || '');
    setNoteContent(note.content);
    setNoteColor(note.color || STICKY_COLORS[0]);
    setNoteError(null);
    setShowNoteModal(true);
  };

  // Mind-map branches are meaningful by their label alone (content is just
  // optional detail); everything else needs real content, per the backend's
  // NOT NULL constraint on Note.content.
  // A NOTE's content is HTML from the rich editor — an "empty" editor still
  // emits markup like "<p></p>", which .trim() alone would treat as non-blank.
  const noteSaveDisabled =
    noteType === 'MINDMAP' ? !noteTitle.trim() : noteType === 'NOTE' ? !stripHtml(noteContent) : !noteContent.trim();

  const handleSaveNote = async () => {
    if (noteSaveDisabled) return;
    setIsSavingNote(true);
    setNoteError(null);
    try {
      const title = noteTitle.trim() || undefined;
      const content = noteContent.trim() || noteTitle.trim();
      if (editingNote) {
        await workSuiteService.updateNote(editingNote.id, {
          title,
          content,
          color: editingNote.type === 'STICKY' ? noteColor : undefined,
        });
      } else {
        await workSuiteService.createNote({
          type: noteType,
          title,
          content,
          color: noteType === 'STICKY' ? noteColor : undefined,
          parentId: noteParentId,
        });
      }
      setShowNoteModal(false);
      await loadNotes();
    } catch {
      setNoteError('Something went wrong saving that note — try again.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const toggleNotePinned = async (note: Note) => {
    setNotes((prev) =>
      [...prev]
        .map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
        .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))
    );
    try {
      await workSuiteService.updateNote(note.id, { pinned: !note.pinned });
    } catch {
      await loadNotes();
    }
  };

  const handleDeleteNote = async (note: Note) => {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    try {
      await workSuiteService.deleteNote(note.id);
    } catch {
      await loadNotes();
    }
  };

  const plainNotes = notes.filter((n) => n.type === 'NOTE');
  const stickyNotes = notes.filter((n) => n.type === 'STICKY');
  const mindMapNotes = notes.filter((n) => n.type === 'MINDMAP');
  const mindMapRoots = mindMapNotes.filter((n) => !n.parentId);
  const mindMapBranchesOf = (rootId: string) => mindMapNotes.filter((n) => n.parentId === rootId);

  const [noteSearch, setNoteSearch] = useState('');
  const filteredNotes = plainNotes.filter((n) => {
    const q = noteSearch.trim().toLowerCase();
    if (!q) return true;
    return (n.title || '').toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });
  const pinnedNoteCount = plainNotes.filter((n) => n.pinned).length;

  const noteDisplayTitle = (note: Note) => {
    if (note.title?.trim()) return note.title;
    const plain = note.type === 'NOTE' ? stripHtml(note.content) : note.content;
    const firstLine = plain.split('\n')[0].trim();
    return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine || 'Untitled';
  };

  const notePreviewText = (note: Note) => (note.type === 'NOTE' ? stripHtml(note.content) : note.content);

  const formatRelativeShort = (value: string) => {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // ---------------------------------------------------------------------
  // Focus (Pomodoro timer) — entirely client-side. Session durations are a
  // saved preference; the running countdown itself and today's completed
  // session count are session/day state, not synced across devices.
  // ---------------------------------------------------------------------
  type FocusMode = 'work' | 'break';

  interface FocusPrefs {
    workMinutes: number;
    breakMinutes: number;
  }

  const DEFAULT_FOCUS_PREFS: FocusPrefs = { workMinutes: 25, breakMinutes: 5 };
  const focusPrefsKey = scopedKey('worksuite_focus_prefs', user?.id);
  const [focusPrefs, setFocusPrefs] = useState<FocusPrefs>(() => {
    try {
      const raw = localStorage.getItem(focusPrefsKey);
      return raw ? { ...DEFAULT_FOCUS_PREFS, ...JSON.parse(raw) } : DEFAULT_FOCUS_PREFS;
    } catch {
      return DEFAULT_FOCUS_PREFS;
    }
  });

  const updateFocusPrefs = (next: Partial<FocusPrefs>) => {
    setFocusPrefs((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(focusPrefsKey, JSON.stringify(merged));
      return merged;
    });
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const focusSessionsKey = scopedKey(`worksuite_focus_sessions_${todayKey}`, user?.id);
  const [sessionsToday, setSessionsToday] = useState<number>(() => {
    const raw = localStorage.getItem(focusSessionsKey);
    return raw ? parseInt(raw, 10) || 0 : 0;
  });

  const [focusMode, setFocusMode] = useState<FocusMode>('work');
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(focusPrefs.workMinutes * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusLinkedTaskId, setFocusLinkedTaskId] = useState('');

  const focusModeDurationSec = (focusMode === 'work' ? focusPrefs.workMinutes : focusPrefs.breakMinutes) * 60;

  useEffect(() => {
    if (!focusRunning) return;
    const interval = setInterval(() => {
      setFocusSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Countdown hit zero — switch modes and pause for the user to start the next phase.
        if (focusMode === 'work') {
          const next = sessionsToday + 1;
          setSessionsToday(next);
          localStorage.setItem(focusSessionsKey, String(next));
          setFocusMode('break');
          setFocusSecondsLeft(focusPrefs.breakMinutes * 60);
        } else {
          setFocusMode('work');
          setFocusSecondsLeft(focusPrefs.workMinutes * 60);
        }
        setFocusRunning(false);
        return 0;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRunning, focusMode, focusPrefs, sessionsToday]);

  const resetFocusTimer = () => {
    setFocusRunning(false);
    setFocusSecondsLeft(focusModeDurationSec);
  };

  const applyFocusDuration = (mode: FocusMode, minutes: number) => {
    const clamped = Math.max(5, Math.min(120, minutes));
    updateFocusPrefs(mode === 'work' ? { workMinutes: clamped } : { breakMinutes: clamped });
    if (!focusRunning && focusMode === mode) setFocusSecondsLeft(clamped * 60);
  };

  const stepFocusDuration = (mode: FocusMode, delta: number) => {
    const current = mode === 'work' ? focusPrefs.workMinutes : focusPrefs.breakMinutes;
    applyFocusDuration(mode, current + delta);
  };

  const formatClock = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const focusColor = focusMode === 'work' ? '#c6a15b' : '#7c9473';
  const focusRingProgress = focusModeDurationSec > 0 ? ((focusModeDurationSec - focusSecondsLeft) / focusModeDurationSec) * 100 : 0;
  const focusLinkedTask = tasks.find((t) => t.id === focusLinkedTaskId);

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
          <p className="worksuite-page__subtitle">Your board, goals, notes, and focus timer — all in one place.</p>
        </div>
      </div>

      {/* Always the wide variant, regardless of tab — this container is centered via
          margin:auto, so toggling its max-width per-tab used to shift the tab bar
          itself sideways every time you switched tabs. */}
      <div className="worksuite-page__container worksuite-page__container--wide">
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
            {!isLoadingGoals && goals.length > 0 && (
              <div className="goal-stats-strip">
                <div className="goal-stats-strip__item">
                  <span className="goal-stats-strip__value">{activeGoals.length}</span>
                  <span className="goal-stats-strip__label">Active</span>
                </div>
                <div className="goal-stats-strip__item">
                  <span className="goal-stats-strip__value">{completedGoals.length}</span>
                  <span className="goal-stats-strip__label">Completed</span>
                </div>
                <div className="goal-stats-strip__item">
                  <span className="goal-stats-strip__value">{avgActiveProgress}%</span>
                  <span className="goal-stats-strip__label">Avg. progress</span>
                </div>
              </div>
            )}

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
                <div className="worksuite-empty worksuite-empty--goals">
                  <div className="worksuite-empty__icon">🎯</div>
                  <p>No goals here yet — set one to start tracking progress.</p>
                  {goalFilter !== 'ALL' && (
                    <button className="worksuite-create-btn" onClick={openCreateGoal}>+ New Goal</button>
                  )}
                </div>
              ) : (
                filteredGoals.map((goal) => {
                  const catColor = goalCategoryColor(goal.category);
                  const deadline = goalDeadlineInfo(goal.targetDate);
                  return (
                    <div key={goal.id} className="worksuite-card goal-card">
                      <div className="goal-card__top">
                        <GoalProgressRing progress={goal.progress} color={catColor} />
                        <div className="goal-card__top-info">
                          <div className="goal-card__title-row">
                            <div className="worksuite-card__title">{goal.title}</div>
                            <span className={`worksuite-badge worksuite-badge--${goal.status.toLowerCase()}`}>
                              {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
                            </span>
                          </div>
                          {goal.category && (
                            <span className="goal-card__category" style={{ color: catColor, borderColor: `${catColor}66`, background: `${catColor}14` }}>
                              {goal.category}
                            </span>
                          )}
                          {deadline && (
                            <span className={`goal-card__deadline${deadline.overdue ? ' goal-card__deadline--overdue' : deadline.soon ? ' goal-card__deadline--soon' : ''}`}>
                              {deadline.overdue ? '⚠' : '🎯'} {new Date(goal.targetDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {deadline.label}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="worksuite-card__description goal-card__description">
                        {goal.description || 'No description yet.'}
                      </p>

                      {goal.status === 'ACTIVE' && (
                        <div className="goal-card__progress-row">
                          <button
                            className="goal-card__step-btn"
                            onClick={() => bumpGoalProgress(goal, -10)}
                            disabled={goal.progress <= 0}
                            title="-10%"
                          >
                            −
                          </button>
                          <div className="worksuite-progress__track goal-card__progress-track">
                            <div className="worksuite-progress__fill" style={{ width: `${goal.progress}%`, background: catColor }} />
                          </div>
                          <button
                            className="goal-card__step-btn"
                            onClick={() => bumpGoalProgress(goal, 10)}
                            disabled={goal.progress >= 100}
                            title="+10%"
                          >
                            +
                          </button>
                        </div>
                      )}

                      <div className="worksuite-card__actions">
                        <button className="worksuite-btn" onClick={() => openEditGoal(goal)}>✎ Edit</button>
                        {goal.status === 'ACTIVE' && (
                          <button className="worksuite-btn" onClick={() => setGoalStatus(goal, 'ABANDONED')}>Abandon</button>
                        )}
                        {goal.status !== 'ACTIVE' && (
                          <button className="worksuite-btn" onClick={() => setGoalStatus(goal, 'ACTIVE')}>↺ Reactivate</button>
                        )}
                        <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDeleteGoal(goal)}>✕ Delete</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'notes' && (
          <>
            <div className="worksuite-page__header-row">
              <div className="worksuite-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
                <button className={`worksuite-tab${noteView === 'list' ? ' worksuite-tab--active' : ''}`} onClick={() => setNoteView('list')}>List</button>
                <button className={`worksuite-tab${noteView === 'sticky' ? ' worksuite-tab--active' : ''}`} onClick={() => setNoteView('sticky')}>Sticky Wall</button>
                <button className={`worksuite-tab${noteView === 'mindmap' ? ' worksuite-tab--active' : ''}`} onClick={() => setNoteView('mindmap')}>Mind Map</button>
              </div>
              {noteView === 'list' && (
                <button className="worksuite-create-btn" onClick={() => openCreateNote({ type: 'NOTE' })}>+ New Note</button>
              )}
              {noteView === 'sticky' && (
                <button className="worksuite-create-btn" onClick={() => openCreateNote({ type: 'STICKY' })}>+ New Sticky</button>
              )}
              {noteView === 'mindmap' && (
                <button className="worksuite-create-btn" onClick={() => openCreateNote({ type: 'MINDMAP' })}>+ New Mind Map</button>
              )}
            </div>

            {noteView === 'list' && (
              <>
                {!isLoadingNotes && plainNotes.length > 0 && (
                  <div className="goal-stats-strip">
                    <div className="goal-stats-strip__item">
                      <span className="goal-stats-strip__value">{plainNotes.length}</span>
                      <span className="goal-stats-strip__label">Notes</span>
                    </div>
                    <div className="goal-stats-strip__item">
                      <span className="goal-stats-strip__value">{pinnedNoteCount}</span>
                      <span className="goal-stats-strip__label">Pinned</span>
                    </div>
                  </div>
                )}

                {!isLoadingNotes && plainNotes.length > 0 && (
                  <div className="worksuite-page__header-row" style={{ marginTop: '-6px' }}>
                    <input
                      className="note-search"
                      value={noteSearch}
                      onChange={(e) => setNoteSearch(e.target.value)}
                      placeholder="Search notes…"
                    />
                    <div />
                  </div>
                )}

                <div className="worksuite-grid">
                  {isLoadingNotes ? (
                    <div className="worksuite-empty">Loading notes…</div>
                  ) : plainNotes.length === 0 ? (
                    <div className="worksuite-empty worksuite-empty--goals">
                      <div className="worksuite-empty__icon">📝</div>
                      <p>No notes yet — jot something down.</p>
                      <button className="worksuite-create-btn" onClick={() => openCreateNote({ type: 'NOTE' })}>+ New Note</button>
                    </div>
                  ) : filteredNotes.length === 0 ? (
                    <div className="worksuite-empty">No notes match "{noteSearch}".</div>
                  ) : (
                    filteredNotes.map((note) => {
                      const accent = accentColorFromId(note.id);
                      return (
                        <div
                          key={note.id}
                          className={`worksuite-card note-card${note.pinned ? ' note-card--pinned' : ''}`}
                          style={{ borderLeft: `3px solid ${accent}` }}
                          onClick={() => openEditNote(note)}
                        >
                          <div className="note-card__header">
                            <div className="worksuite-card__title">{noteDisplayTitle(note)}</div>
                            <button
                              className={`note-card__pin${note.pinned ? ' note-card__pin--active' : ''}`}
                              onClick={(e) => { e.stopPropagation(); toggleNotePinned(note); }}
                              title={note.pinned ? 'Unpin' : 'Pin to top'}
                            >
                              {note.pinned ? '★' : '☆'}
                            </button>
                          </div>
                          <p className="worksuite-card__description note-card__content">{notePreviewText(note)}</p>
                          <div className="worksuite-card__meta note-card__meta">
                            Edited {formatRelativeShort(note.updatedAt)}
                          </div>
                          <div className="worksuite-card__actions">
                            <button className="worksuite-btn" onClick={(e) => { e.stopPropagation(); openEditNote(note); }}>✎ Edit</button>
                            <button className="worksuite-btn worksuite-btn--danger" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note); }}>✕ Delete</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {noteView === 'sticky' && (
              isLoadingNotes ? (
                <div className="worksuite-empty">Loading notes…</div>
              ) : stickyNotes.length === 0 ? (
                <div className="worksuite-empty worksuite-empty--goals">
                  <div className="worksuite-empty__icon">📌</div>
                  <p>No sticky notes yet — pin something to the wall.</p>
                  <button className="worksuite-create-btn" onClick={() => openCreateNote({ type: 'STICKY' })}>+ New Sticky</button>
                </div>
              ) : (
                <div className="sticky-wall">
                  {stickyNotes.map((note) => (
                    <div
                      key={note.id}
                      className="sticky-note"
                      style={{ background: note.color || STICKY_COLORS[0], transform: `rotate(${stickyRotation(note.id)}deg)` }}
                      onClick={() => openEditNote(note)}
                    >
                      <div className="sticky-note__pin" />
                      <button
                        className="sticky-note__delete"
                        onClick={(e) => { e.stopPropagation(); handleDeleteNote(note); }}
                        title="Remove"
                      >
                        ✕
                      </button>
                      {note.title && <div className="sticky-note__title">{note.title}</div>}
                      <div className="sticky-note__content">{note.content}</div>
                      <div className="sticky-note__meta">{formatRelativeShort(note.updatedAt)}</div>
                    </div>
                  ))}
                </div>
              )
            )}

            {noteView === 'mindmap' && (
              isLoadingNotes ? (
                <div className="worksuite-empty">Loading notes…</div>
              ) : mindMapRoots.length === 0 ? (
                <div className="worksuite-empty worksuite-empty--goals">
                  <div className="worksuite-empty__icon">🧠</div>
                  <p>No mind maps yet — start one and branch out your ideas.</p>
                  <button className="worksuite-create-btn" onClick={() => openCreateNote({ type: 'MINDMAP' })}>+ New Mind Map</button>
                </div>
              ) : (
                <div className="mindmap-list">
                  {mindMapRoots.map((root) => {
                    const branches = mindMapBranchesOf(root.id);
                    const size = 360;
                    const center = size / 2;
                    return (
                      <div key={root.id} className="mindmap-tree-wrap">
                        <div className="mindmap-tree" style={{ width: size, height: size }}>
                          <svg className="mindmap-tree__lines" width={size} height={size}>
                            {branches.map((b, i) => {
                              const { x, y } = mindMapBranchOffset(i, branches.length);
                              return (
                                <line
                                  key={b.id}
                                  x1={center}
                                  y1={center}
                                  x2={center + x}
                                  y2={center + y}
                                  stroke="var(--tech-border-dim, rgba(246,243,237,0.15))"
                                  strokeWidth={2}
                                />
                              );
                            })}
                          </svg>

                          <div
                            className="mindmap-node mindmap-node--root"
                            style={{ left: center, top: center, borderColor: accentColorFromId(root.id) }}
                            onClick={() => openEditNote(root)}
                          >
                            <span>{noteDisplayTitle(root)}</span>
                          </div>

                          {branches.map((b, i) => {
                            const { x, y } = mindMapBranchOffset(i, branches.length);
                            const accent = accentColorFromId(b.id);
                            return (
                              <div
                                key={b.id}
                                className="mindmap-node mindmap-node--branch"
                                style={{ left: center + x, top: center + y, borderColor: accent, color: accent }}
                                onClick={() => openEditNote(b)}
                              >
                                <span>{noteDisplayTitle(b)}</span>
                                <button
                                  className="mindmap-node__delete"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteNote(b); }}
                                  title="Remove branch"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mindmap-tree__actions">
                          <button className="worksuite-btn" onClick={() => openCreateNote({ type: 'MINDMAP', parentId: root.id })}>+ Add branch</button>
                          <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDeleteNote(root)}>✕ Delete map</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}

        {activeTab === 'focus' && (
          <div className="focus-layout">
            <div className="focus-timer">
              <div className="focus-timer__mode-tabs">
                <span
                  className="focus-timer__mode-indicator"
                  style={{ transform: focusMode === 'work' ? 'translateX(0%)' : 'translateX(100%)', background: focusColor }}
                />
                <span className={`focus-timer__mode-pill${focusMode === 'work' ? ' focus-timer__mode-pill--active' : ''}`}>Focus</span>
                <span className={`focus-timer__mode-pill${focusMode === 'break' ? ' focus-timer__mode-pill--active' : ''}`}>Break</span>
              </div>

              <div className={`focus-timer__ring${focusRunning ? ' focus-timer__ring--running' : ''}`}>
                <div className="focus-timer__ring-glow" style={{ background: focusColor }} />
                <svg width="220" height="220" viewBox="0 0 220 220">
                  <circle cx="110" cy="110" r="98" fill="none" stroke="rgba(246, 243, 237, 0.08)" strokeWidth="10" />
                  <circle
                    cx="110"
                    cy="110"
                    r="98"
                    fill="none"
                    stroke={focusColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 98}
                    strokeDashoffset={2 * Math.PI * 98 * (1 - focusRingProgress / 100)}
                    transform="rotate(-90 110 110)"
                    className="focus-timer__ring-progress"
                  />
                </svg>
                <div className="focus-timer__ring-center" key={focusMode}>
                  <span className="focus-timer__clock">{formatClock(focusSecondsLeft)}</span>
                  <span className="focus-timer__mode-label">{focusMode === 'work' ? 'Focus time' : 'Break time'}</span>
                </div>
              </div>

              {focusLinkedTask && (
                <div className="focus-timer__linked-task">Working on: {focusLinkedTask.title}</div>
              )}

              <div className="focus-timer__durations">
                <div className="focus-timer__duration-group">
                  <span className="focus-timer__duration-label">Focus</span>
                  <button
                    className="focus-timer__duration-btn"
                    onClick={() => stepFocusDuration('work', -5)}
                    disabled={focusRunning || focusPrefs.workMinutes <= 5}
                  >
                    −
                  </button>
                  <span className="focus-timer__duration-value">{focusPrefs.workMinutes}m</span>
                  <button
                    className="focus-timer__duration-btn"
                    onClick={() => stepFocusDuration('work', 5)}
                    disabled={focusRunning || focusPrefs.workMinutes >= 120}
                  >
                    +
                  </button>
                </div>
                <div className="focus-timer__duration-group">
                  <span className="focus-timer__duration-label">Break</span>
                  <button
                    className="focus-timer__duration-btn"
                    onClick={() => stepFocusDuration('break', -5)}
                    disabled={focusRunning || focusPrefs.breakMinutes <= 5}
                  >
                    −
                  </button>
                  <span className="focus-timer__duration-value">{focusPrefs.breakMinutes}m</span>
                  <button
                    className="focus-timer__duration-btn"
                    onClick={() => stepFocusDuration('break', 5)}
                    disabled={focusRunning || focusPrefs.breakMinutes >= 120}
                  >
                    +
                  </button>
                </div>
              </div>
              {focusRunning && <p className="worksuite-tasks-settings__hint">Pause to change durations.</p>}

              <div className="focus-timer__controls">
                <button className="worksuite-create-btn focus-timer__primary-btn" onClick={() => setFocusRunning((r) => !r)}>
                  {focusRunning ? 'Pause' : focusSecondsLeft === focusModeDurationSec ? 'Start' : 'Resume'}
                </button>
                <button className="worksuite-btn focus-timer__reset-btn" onClick={resetFocusTimer}>Reset</button>
              </div>
            </div>

            <aside className="worksuite-tasks-sidebar">
              <div className="worksuite-tasks-sidebar__section">
                <h4>Today</h4>
                <div className="worksuite-tasks-overview__total">{sessionsToday}</div>
                <div className="worksuite-tasks-overview__total-label">Focus sessions completed</div>
              </div>

              <div className="worksuite-tasks-sidebar__section">
                <h4>Working on</h4>
                <ThemedSelect
                  value={focusLinkedTaskId}
                  options={[{ value: '', label: 'No linked task' }, ...tasks.filter((t) => t.status !== 'DONE').map((t) => ({ value: t.id, label: t.title }))]}
                  onChange={setFocusLinkedTaskId}
                />
                <p className="worksuite-tasks-settings__hint">Just a label for this session — doesn't change the task itself.</p>
                <p className="worksuite-tasks-settings__hint">
                  Sessions and durations live on this device only — they don't sync across devices yet.
                </p>
              </div>
            </aside>
          </div>
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
            <ThemedDatePicker value={taskDueDate} onChange={setTaskDueDate} />
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
            <ThemedDatePicker value={goalTargetDate} onChange={setGoalTargetDate} />
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

      {showNoteModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className={`worksuite-modal${noteType === 'NOTE' ? ' worksuite-modal--large' : ''}`} onClick={(e) => e.stopPropagation()}>
            <h2>
              {editingNote
                ? noteType === 'STICKY' ? 'Edit Sticky' : noteType === 'MINDMAP' ? 'Edit Branch' : 'Edit Note'
                : noteType === 'STICKY' ? 'New Sticky' : noteType === 'MINDMAP' ? (noteParentId ? 'New Branch' : 'New Mind Map') : 'New Note'}
            </h2>

            {!editingNote && noteType === 'MINDMAP' && noteParentId && (
              <p className="worksuite-modal__hint">
                Branching off "{noteDisplayTitle(notes.find((n) => n.id === noteParentId)!)}"
              </p>
            )}

            <label>{noteType === 'MINDMAP' ? 'Label' : 'Title (optional)'}</label>
            <input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder={noteType === 'MINDMAP' ? 'Idea, topic, next step…' : 'Untitled'}
              maxLength={160}
            />

            {noteType === 'STICKY' && (
              <>
                <label>Color</label>
                <div className="sticky-color-picker">
                  {STICKY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`sticky-color-swatch${noteColor === c ? ' sticky-color-swatch--selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setNoteColor(c)}
                      title={c}
                    />
                  ))}
                </div>
              </>
            )}

            <label>{noteType === 'MINDMAP' ? 'Details (optional)' : 'Content'}</label>
            {noteType === 'NOTE' ? (
              <RichTextEditor content={noteContent} onChange={setNoteContent} placeholder="Write something…" />
            ) : (
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={noteType === 'MINDMAP' ? 3 : 6}
                placeholder={noteType === 'MINDMAP' ? 'Optional notes for this branch…' : 'Write something…'}
                maxLength={2000}
              />
            )}
            {noteError && <p className="worksuite-modal__error">{noteError}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowNoteModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSaveNote} disabled={noteSaveDisabled || isSavingNote}>
                {isSavingNote ? 'Saving…' : editingNote ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
