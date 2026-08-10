import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, Goal } from '@/services/workSuiteService';
import './WorkSuite.css';

type StatusFilter = 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'ALL';

export const WorkSuiteGoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ACTIVE');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setGoals(await workSuiteService.listGoals());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setTargetDate('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category || '');
    setTargetDate(goal.targetDate ? goal.targetDate.slice(0, 10) : '');
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
        category: category.trim() || undefined,
        targetDate: targetDate || undefined,
      };
      if (editing) {
        await workSuiteService.updateGoal(editing.id, payload);
      } else {
        await workSuiteService.createGoal(payload);
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that goal — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const bumpProgress = async (goal: Goal, delta: number) => {
    await workSuiteService.updateGoalProgress(goal.id, goal.progress + delta);
    await load();
  };

  const setStatus = async (goal: Goal, status: Goal['status']) => {
    await workSuiteService.updateGoal(goal.id, { status });
    await load();
  };

  const handleDelete = async (goal: Goal) => {
    await workSuiteService.deleteGoal(goal.id);
    await load();
  };

  const filtered = filter === 'ALL' ? goals : goals.filter((g) => g.status === filter);

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Goals</h1>
          <p className="worksuite-page__subtitle">Set a target, track progress, and see it through.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-page__header-row">
          <div className="worksuite-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
            {(['ACTIVE', 'COMPLETED', 'ABANDONED', 'ALL'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                className={`worksuite-tab${filter === s ? ' worksuite-tab--active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <button className="worksuite-create-btn" onClick={openCreate}>+ New Goal</button>
        </div>

        <div className="worksuite-grid">
          {isLoading ? (
            <div className="worksuite-empty">Loading goals…</div>
          ) : filtered.length === 0 ? (
            <div className="worksuite-empty">No goals here yet — set one to start tracking progress.</div>
          ) : (
            filtered.map((goal) => (
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
                      <button className="worksuite-btn" onClick={() => bumpProgress(goal, -10)} disabled={goal.progress <= 0}>-10%</button>
                      <button className="worksuite-btn" onClick={() => bumpProgress(goal, 10)} disabled={goal.progress >= 100}>+10%</button>
                    </>
                  )}
                  <button className="worksuite-btn" onClick={() => openEdit(goal)}>Edit</button>
                  {goal.status === 'ACTIVE' && (
                    <button className="worksuite-btn" onClick={() => setStatus(goal, 'ABANDONED')}>Abandon</button>
                  )}
                  {goal.status !== 'ACTIVE' && (
                    <button className="worksuite-btn" onClick={() => setStatus(goal, 'ACTIVE')}>Reactivate</button>
                  )}
                  <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(goal)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Goal' : 'New Goal'}</h2>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Run a 5K" maxLength={160} />
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional details" maxLength={500} />
            <label>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Fitness, Career, Learning…" maxLength={60} />
            <label>Target Date</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!title.trim() || isSaving}>
                {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
