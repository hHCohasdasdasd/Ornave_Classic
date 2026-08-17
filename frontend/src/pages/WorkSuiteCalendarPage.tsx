import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, Task, Goal, JobApplication } from '@/services/workSuiteService';
import { IconChevronDown, IconCheck, IconTarget, IconBriefcase } from '@/components/ui/Icons';
import './WorkSuite.css';

type EventType = 'task' | 'goal' | 'job';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  subtitle: string;
  type: EventType;
  route: string;
}

const TYPE_COLOR: Record<EventType, string> = {
  task: '#6b8cae',
  goal: '#c6a15b',
  job: '#7c9473',
};

const TYPE_LABEL: Record<EventType, string> = {
  task: 'Task',
  goal: 'Goal',
  job: 'Application',
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isoToDateKey(iso?: string): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

/** Full 6-row (42-day) grid for the month containing `monthDate`, including
 * the trailing/leading days from neighboring months needed to fill whole weeks. */
function buildMonthGrid(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export const WorkSuiteCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toDateKey(today));

  const load = async () => {
    setIsLoading(true);
    try {
      const [taskList, goalList, jobList] = await Promise.all([
        workSuiteService.listTasks(),
        workSuiteService.listGoals(),
        workSuiteService.listJobApplications(),
      ]);
      setTasks(taskList);
      setGoals(goalList);
      setJobApplications(jobList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [];
    for (const t of tasks) {
      const dateKey = isoToDateKey(t.dueDate);
      if (!dateKey) continue;
      list.push({
        id: `task-${t.id}`,
        date: dateKey,
        title: t.title,
        subtitle: t.status === 'DONE' ? 'Done' : `${t.priority.charAt(0)}${t.priority.slice(1).toLowerCase()} priority task`,
        type: 'task',
        route: '/work-suite/personal?tab=board',
      });
    }
    for (const g of goals) {
      const dateKey = isoToDateKey(g.targetDate);
      if (!dateKey) continue;
      list.push({
        id: `goal-${g.id}`,
        date: dateKey,
        title: g.title,
        subtitle: `${g.progress}% complete`,
        type: 'goal',
        route: '/work-suite/personal?tab=goals',
      });
    }
    for (const j of jobApplications) {
      const dateKey = isoToDateKey(j.appliedDate);
      if (!dateKey) continue;
      list.push({
        id: `job-${j.id}`,
        date: dateKey,
        title: `${j.role} @ ${j.company}`,
        subtitle: 'Applied',
        type: 'job',
        route: '/work-suite/jobs',
      });
    }
    return list;
  }, [tasks, goals, jobApplications]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const grid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const todayKey = toDateKey(today);
  const selectedEvents = eventsByDate.get(selectedDateKey) || [];

  const goToMonth = (delta: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToToday = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(todayKey);
  };

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Calendar</h1>
          <p className="worksuite-page__subtitle">Every task, goal, and application deadline in one place.</p>
        </div>
      </div>

      <div className="worksuite-page__container worksuite-page__container--wide">
        <div className="worksuite-calendar-layout">
          <div className="worksuite-calendar-main">
            <div className="worksuite-calendar-toolbar">
              <div className="worksuite-calendar-toolbar__nav">
                <button className="worksuite-calendar-nav-btn" onClick={() => goToMonth(-1)} aria-label="Previous month">
                  <span style={{ display: 'inline-flex', transform: 'rotate(90deg)' }}><IconChevronDown size={14} /></span>
                </button>
                <h2 className="worksuite-calendar-month-label">
                  {visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </h2>
                <button className="worksuite-calendar-nav-btn" onClick={() => goToMonth(1)} aria-label="Next month">
                  <span style={{ display: 'inline-flex', transform: 'rotate(-90deg)' }}><IconChevronDown size={14} /></span>
                </button>
              </div>
              <button className="worksuite-btn" onClick={goToToday}>Today</button>
            </div>

            <div className="worksuite-calendar-legend">
              <span className="worksuite-calendar-legend__item"><span className="worksuite-calendar-dot" style={{ background: TYPE_COLOR.task }} /> Tasks</span>
              <span className="worksuite-calendar-legend__item"><span className="worksuite-calendar-dot" style={{ background: TYPE_COLOR.goal }} /> Goals</span>
              <span className="worksuite-calendar-legend__item"><span className="worksuite-calendar-dot" style={{ background: TYPE_COLOR.job }} /> Applications</span>
            </div>

            {isLoading ? (
              <div className="worksuite-empty">Loading calendar…</div>
            ) : (
              <>
                <div className="worksuite-calendar-weekdays">
                  {WEEKDAY_LABELS.map((w) => <div key={w} className="worksuite-calendar-weekday">{w}</div>)}
                </div>
                <div className="worksuite-calendar-grid">
                  {grid.map((day) => {
                    const dateKey = toDateKey(day);
                    const dayEvents = eventsByDate.get(dateKey) || [];
                    const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                    const isToday = dateKey === todayKey;
                    const isSelected = dateKey === selectedDateKey;
                    return (
                      <button
                        key={dateKey}
                        className={`worksuite-calendar-day${isCurrentMonth ? '' : ' worksuite-calendar-day--muted'}${isToday ? ' worksuite-calendar-day--today' : ''}${isSelected ? ' worksuite-calendar-day--selected' : ''}`}
                        onClick={() => setSelectedDateKey(dateKey)}
                      >
                        <span className="worksuite-calendar-day__number">{day.getDate()}</span>
                        {dayEvents.length > 0 && (
                          <span className="worksuite-calendar-day__dots">
                            {dayEvents.slice(0, 3).map((e) => (
                              <span key={e.id} className="worksuite-calendar-dot" style={{ background: TYPE_COLOR[e.type] }} />
                            ))}
                            {dayEvents.length > 3 && <span className="worksuite-calendar-day__more">+{dayEvents.length - 3}</span>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <aside className="worksuite-calendar-sidebar">
            <h4>
              {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h4>
            {selectedEvents.length === 0 ? (
              <p className="worksuite-jobs-profile-empty">Nothing due this day.</p>
            ) : (
              <div className="worksuite-calendar-agenda">
                {selectedEvents.map((e) => (
                  <button key={e.id} className="worksuite-calendar-agenda-item" onClick={() => navigate(e.route)}>
                    <span className="worksuite-calendar-agenda-item__icon" style={{ color: TYPE_COLOR[e.type] }}>
                      {e.type === 'task' ? <IconCheck size={14} /> : e.type === 'goal' ? <IconTarget size={14} /> : <IconBriefcase size={14} />}
                    </span>
                    <span className="worksuite-calendar-agenda-item__copy">
                      <span className="worksuite-calendar-agenda-item__title">{e.title}</span>
                      <span className="worksuite-calendar-agenda-item__subtitle">{TYPE_LABEL[e.type]} · {e.subtitle}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
