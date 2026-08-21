import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { ThemedDatePicker } from '@/components/ui/ThemedDatePicker';
import { workSuiteService, Task, Goal, JobApplication, CalendarEvent, AutoCheckInEligibility, TableReservationDetail } from '@/services/workSuiteService';
import { firmService } from '@/services/firmService';
import { IconChevronDown } from '@/components/ui/Icons';
import './WorkSuite.css';

type AgendaItemType = 'task' | 'goal' | 'job' | 'event';

interface AgendaItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  subtitle: string;
  type: AgendaItemType;
  route?: string;
  sourceEvent?: CalendarEvent;
}

const TYPE_COLOR: Record<AgendaItemType, string> = {
  task: '#6b8cae',
  goal: '#c6a15b',
  job: '#7c9473',
  event: '#b5714f',
};

const TYPE_LABEL: Record<AgendaItemType, string> = {
  task: 'Task',
  goal: 'Goal',
  job: 'Application',
  event: 'Event',
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isoToDateKey(iso?: string): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

// CalendarEvent.startDate/endDate is a real instant (e.g. a 7:30 PM
// reservation is stored as its UTC timestamp), not a bare calendar date like
// task/goal/job due dates. Slicing that ISO string's date portion (as
// isoToDateKey does) reads the UTC calendar day, which can be a day off from
// the viewer's local calendar day — landing a timed event on the wrong cell,
// or outside the visible month grid entirely, depending on timezone. All-day
// events have no real time-of-day, so UTC midnight sliced is already the
// intended date and needs no correction.
function eventDateKey(ev: CalendarEvent): string | null {
  if (ev.allDay) return isoToDateKey(ev.startDate);
  return toDateKey(new Date(ev.startDate));
}

function formatTimeLabel(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Every date key from startKey to endKey inclusive (both YYYY-MM-DD). */
function dateKeysInRange(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let cursor = new Date(startKey + 'T00:00:00');
  const end = new Date(endKey + 'T00:00:00');
  // A runaway endDate shouldn't be able to hang the tab — cap at a year.
  let guard = 0;
  while (cursor <= end && guard < 366) {
    keys.push(toDateKey(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    guard += 1;
  }
  return keys;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toDateKey(today));

  // Create/edit event modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventAllDay, setEventAllDay] = useState(true);
  const [eventMultiDay, setEventMultiDay] = useState(false);
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Automatic Check-In — only relevant when the event being edited was
  // created from a table reservation (editingEvent.tableReservationId).
  const [reservation, setReservation] = useState<TableReservationDetail | null>(null);
  const [eligibility, setEligibility] = useState<AutoCheckInEligibility | null>(null);
  const [isLoadingCheckIn, setIsLoadingCheckIn] = useState(false);
  const [isTogglingCheckIn, setIsTogglingCheckIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  useEffect(() => {
    const reservationId = editingEvent?.tableReservationId;
    if (!reservationId) {
      setReservation(null);
      setEligibility(null);
      return;
    }
    setIsLoadingCheckIn(true);
    setCheckInError(null);
    Promise.all([firmService.getReservation(reservationId), workSuiteService.getAutoCheckInEligibility()])
      .then(([res, elig]) => {
        setReservation(res);
        setEligibility(elig);
      })
      .finally(() => setIsLoadingCheckIn(false));
  }, [editingEvent]);

  const handleToggleAutoCheckIn = async () => {
    if (!reservation) return;
    setIsTogglingCheckIn(true);
    setCheckInError(null);
    try {
      const updated = await firmService.setAutoCheckIn(reservation.id, !reservation.autoCheckInEnabled);
      setReservation(updated);
    } catch (err: any) {
      setCheckInError(err.message || 'Could not update automatic check-in.');
    } finally {
      setIsTogglingCheckIn(false);
    }
  };

  const load = async () => {
    setIsLoading(true);
    try {
      const [taskList, goalList, jobList, eventList] = await Promise.all([
        workSuiteService.listTasks(),
        workSuiteService.listGoals(),
        workSuiteService.listJobApplications(),
        workSuiteService.listCalendarEvents(),
      ]);
      setTasks(taskList);
      setGoals(goalList);
      setJobApplications(jobList);
      setCalendarEvents(eventList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const agendaItems = useMemo<AgendaItem[]>(() => {
    const list: AgendaItem[] = [];
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
    for (const ev of calendarEvents) {
      const startKey = eventDateKey(ev);
      if (!startKey) continue;
      const endKey = (ev.endDate ? eventDateKey({ ...ev, startDate: ev.endDate }) : null) || startKey;
      const span = dateKeysInRange(startKey, endKey);
      const subtitle = !ev.allDay && ev.startTime
        ? `${formatTimeLabel(ev.startTime)}${ev.endTime ? ' – ' + formatTimeLabel(ev.endTime) : ''}`
        : span.length > 1 ? `${span.length}-day event` : 'All day';
      for (const dateKey of span) {
        list.push({
          id: `event-${ev.id}-${dateKey}`,
          date: dateKey,
          title: ev.title,
          subtitle,
          type: 'event',
          sourceEvent: ev,
        });
      }
    }
    return list;
  }, [tasks, goals, jobApplications, calendarEvents]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of agendaItems) {
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [agendaItems]);

  const grid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const todayKey = toDateKey(today);

  const handleItemClick = (item: AgendaItem) => {
    if (item.type === 'event' && item.sourceEvent) {
      openEditEvent(item.sourceEvent);
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const goToMonth = (delta: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToToday = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(todayKey);
  };

  const openCreateEvent = (dateKey?: string) => {
    setEditingEvent(null);
    setEventTitle('');
    setEventDescription('');
    setEventAllDay(true);
    setEventMultiDay(false);
    setEventStartDate(dateKey || selectedDateKey);
    setEventEndDate('');
    setEventStartTime('');
    setEventEndTime('');
    setEventError(null);
    setShowEventModal(true);
  };

  const handleDayDoubleClick = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    openCreateEvent(dateKey);
  };

  const openEditEvent = (ev: CalendarEvent) => {
    const startKey = eventDateKey(ev) || '';
    const endKey = ev.endDate ? eventDateKey({ ...ev, startDate: ev.endDate }) : null;
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventDescription(ev.description || '');
    setEventAllDay(ev.allDay);
    setEventMultiDay(!!endKey && endKey !== startKey);
    setEventStartDate(startKey);
    setEventEndDate(endKey || '');
    setEventStartTime(ev.startTime || '');
    setEventEndTime(ev.endTime || '');
    setEventError(null);
    setShowEventModal(true);
  };

  // Deep-link support — a notification (e.g. "Reservation confirmed at X")
  // links here as /work-suite/calendar?event=<id>. Once events are loaded,
  // jump the grid to that event's month and open it directly instead of
  // making the user hunt for it on the grid themselves.
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (!eventId || calendarEvents.length === 0) return;
    const match = calendarEvents.find((e) => e.id === eventId);
    if (!match) return;
    const key = eventDateKey(match);
    if (key) {
      const [y, m] = key.split('-').map(Number);
      setVisibleMonth(new Date(y, m - 1, 1));
      setSelectedDateKey(key);
    }
    openEditEvent(match);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('event');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarEvents]);

  const handleSaveEvent = async () => {
    if (!eventTitle.trim() || !eventStartDate) return;
    setIsSavingEvent(true);
    setEventError(null);
    try {
      const payload = {
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        startDate: eventStartDate,
        endDate: eventAllDay && eventMultiDay && eventEndDate ? eventEndDate : undefined,
        allDay: eventAllDay,
        startTime: !eventAllDay ? eventStartTime || undefined : undefined,
        endTime: !eventAllDay ? eventEndTime || undefined : undefined,
      };
      if (editingEvent) {
        await workSuiteService.updateCalendarEvent(editingEvent.id, {
          ...payload,
          endDate: payload.endDate ?? null,
          startTime: payload.startTime ?? null,
          endTime: payload.endTime ?? null,
        } as any);
      } else {
        await workSuiteService.createCalendarEvent(payload);
      }
      setShowEventModal(false);
      await load();
    } catch {
      setEventError('Something went wrong saving that event — try again.');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (ev: CalendarEvent) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== ev.id));
    try {
      await workSuiteService.deleteCalendarEvent(ev.id);
    } catch {
      await load();
    }
  };

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Calendar</h1>
          <p className="worksuite-page__subtitle">Every task, goal, application deadline, and event in one place.</p>
        </div>
      </div>

      <div className="worksuite-page__container worksuite-page__container--wide">
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
            <span className="worksuite-calendar-legend__item"><span className="worksuite-calendar-dot" style={{ background: TYPE_COLOR.event }} /> Events</span>
          </div>
          <p className="worksuite-calendar-hint">Double-click a day to add an event · click an entry to open it</p>

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
                  const dayItems = itemsByDate.get(dateKey) || [];
                  const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedDateKey;
                  return (
                    <div
                      key={dateKey}
                      className={`worksuite-calendar-day${isCurrentMonth ? '' : ' worksuite-calendar-day--muted'}${isToday ? ' worksuite-calendar-day--today' : ''}${isSelected ? ' worksuite-calendar-day--selected' : ''}`}
                      onClick={() => setSelectedDateKey(dateKey)}
                      onDoubleClick={() => handleDayDoubleClick(dateKey)}
                      title="Double-click to add an event"
                    >
                      <span className="worksuite-calendar-day__number">{day.getDate()}</span>
                      {dayItems.length > 0 && (
                        <span className="worksuite-calendar-day__items">
                          {dayItems.slice(0, 3).map((item) => (
                            <button
                              key={item.id}
                              className="worksuite-calendar-day__chip"
                              style={{ borderLeftColor: TYPE_COLOR[item.type] }}
                              title={`${item.title} — ${TYPE_LABEL[item.type]}`}
                              onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                            >
                              {item.title}
                            </button>
                          ))}
                          {dayItems.length > 3 && <span className="worksuite-calendar-day__more-chip">+{dayItems.length - 3} more</span>}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {showEventModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEvent ? 'Edit Event' : 'New Event'}</h2>
            <label>Title</label>
            <input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Interview with Acme Corp" maxLength={160} />
            <label>Description</label>
            <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={2} placeholder="Optional details" maxLength={500} />

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
              <input type="checkbox" checked={eventAllDay} onChange={(e) => setEventAllDay(e.target.checked)} style={{ width: 'auto' }} />
              All day
            </label>

            <label>Start Date</label>
            <ThemedDatePicker value={eventStartDate} onChange={setEventStartDate} />

            {eventAllDay ? (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                  <input type="checkbox" checked={eventMultiDay} onChange={(e) => setEventMultiDay(e.target.checked)} style={{ width: 'auto' }} />
                  Multi-day event
                </label>
                {eventMultiDay && (
                  <>
                    <label>End Date</label>
                    <ThemedDatePicker value={eventEndDate} onChange={setEventEndDate} />
                  </>
                )}
              </>
            ) : (
              <div className="worksuite-jobs-cv-form-row">
                <div>
                  <label>Start Time</label>
                  <input type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} />
                </div>
                <div>
                  <label>End Time</label>
                  <input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} />
                </div>
              </div>
            )}

            {editingEvent?.tableReservationId && (
              <div className="worksuite-auto-checkin">
                <div className="worksuite-auto-checkin__header">
                  <span className="worksuite-auto-checkin__title">Automatic Check-In</span>
                  {reservation && !isLoadingCheckIn && (
                    <label className="worksuite-auto-checkin__switch">
                      <input
                        type="checkbox"
                        checked={reservation.autoCheckInEnabled}
                        disabled={isTogglingCheckIn || (!reservation.autoCheckInEnabled && !eligibility?.eligible)}
                        onChange={handleToggleAutoCheckIn}
                      />
                      <span className="worksuite-auto-checkin__slider" />
                    </label>
                  )}
                </div>

                {isLoadingCheckIn ? (
                  <p className="worksuite-auto-checkin__hint">Checking eligibility…</p>
                ) : reservation?.checkedInAt ? (
                  <p className="worksuite-auto-checkin__hint">Checked in automatically at {new Date(reservation.checkedInAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}.</p>
                ) : reservation?.autoCheckInEnabled ? (
                  <p className="worksuite-auto-checkin__hint">You'll be checked in automatically once your reservation time arrives — no action needed.</p>
                ) : eligibility?.eligible ? (
                  <p className="worksuite-auto-checkin__hint">Turn this on to be checked in automatically, without staff or you doing anything.</p>
                ) : (
                  <div className="worksuite-auto-checkin__requirements">
                    <p className="worksuite-auto-checkin__hint">
                      Not available yet — three requirements gate this, checked in order:
                    </p>
                    <ol>
                      <li className={eligibility?.tierOk ? 'worksuite-auto-checkin__req--met' : eligibility?.nextStep === 'TIER' ? 'worksuite-auto-checkin__req--active' : ''}>
                        Silver membership or above {eligibility?.tierOk ? '✓' : eligibility?.nextStep === 'TIER' ? <a href="/profile/edit">— upgrade</a> : null}
                      </li>
                      <li className={eligibility?.profileComplete ? 'worksuite-auto-checkin__req--met' : eligibility?.nextStep === 'PROFILE' ? 'worksuite-auto-checkin__req--active' : ''}>
                        Check-In Profile completed {eligibility?.profileComplete ? '✓' : eligibility?.nextStep === 'PROFILE' ? <a href="/profile/edit">— finish it</a> : null}
                      </li>
                      <li className={eligibility?.bankVerified ? 'worksuite-auto-checkin__req--met' : eligibility?.nextStep === 'BANK' ? 'worksuite-auto-checkin__req--active' : ''}>
                        A verified bank account {eligibility?.bankVerified ? '✓' : eligibility?.nextStep === 'BANK' ? <a href="/work-suite/finance">— link & verify one</a> : null}
                      </li>
                    </ol>
                  </div>
                )}
                {checkInError && <p className="worksuite-modal__error">{checkInError}</p>}
              </div>
            )}

            {eventError && <p className="worksuite-modal__error">{eventError}</p>}
            <div className="worksuite-modal__actions">
              {editingEvent && (
                <button
                  className="worksuite-modal__cancel"
                  style={{ color: 'var(--color-danger)', marginRight: 'auto' }}
                  onClick={async () => { await handleDeleteEvent(editingEvent); setShowEventModal(false); }}
                >
                  Delete
                </button>
              )}
              <button className="worksuite-modal__cancel" onClick={() => setShowEventModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSaveEvent} disabled={!eventTitle.trim() || !eventStartDate || isSavingEvent}>
                {isSavingEvent ? 'Saving…' : editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
