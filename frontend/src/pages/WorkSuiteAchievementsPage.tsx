import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { ThemedDatePicker } from '@/components/ui/ThemedDatePicker';
import { workSuiteService, Achievement } from '@/services/workSuiteService';
import './WorkSuite.css';

export const WorkSuiteAchievementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [achievedAt, setAchievedAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setAchievements(await workSuiteService.listAchievements());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const openCreate = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setAchievedAt('');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await workSuiteService.createAchievement({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        achievedAt: achievedAt || undefined,
      });
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong logging that achievement — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (achievement: Achievement) => {
    setAchievements((prev) => prev.filter((a) => a.id !== achievement.id));
    try {
      await workSuiteService.deleteAchievement(achievement.id);
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
          <h1 className="worksuite-page__title">Achievements</h1>
          <p className="worksuite-page__subtitle">Every win worth remembering, logged in one place.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-page__header-row">
          <button className="worksuite-create-btn" onClick={openCreate}>+ Log Achievement</button>
        </div>

        {isLoading ? (
          <div className="worksuite-empty">Loading achievements…</div>
        ) : achievements.length === 0 ? (
          <div className="worksuite-empty worksuite-empty--goals">
            <div className="worksuite-empty__icon">🏆</div>
            <p>Nothing logged yet — record your first win.</p>
            <button className="worksuite-create-btn" onClick={openCreate}>+ Log Achievement</button>
          </div>
        ) : (
          achievements.map((a) => (
            <div key={a.id} className="worksuite-achievement">
              <div className="worksuite-achievement__icon">{a.category === 'Milestone' ? '🥇' : '🏆'}</div>
              <div className="worksuite-achievement__main">
                <div className="worksuite-achievement__title">{a.title}</div>
                <div className="worksuite-achievement__meta">
                  <span>{new Date(a.achievedAt).toLocaleDateString()}</span>
                  {a.category && <span>{a.category}</span>}
                </div>
                {a.description && (
                  <p className="worksuite-achievement__description">{a.description}</p>
                )}
              </div>
              <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(a)}>Delete</button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Log Achievement</h2>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Finished my first 5K" maxLength={160} />
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional details" maxLength={500} />
            <label>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Fitness, Career, Learning…" maxLength={60} />
            <label>Date</label>
            <ThemedDatePicker value={achievedAt} onChange={setAchievedAt} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!title.trim() || isSaving}>
                {isSaving ? 'Saving…' : 'Log Achievement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
