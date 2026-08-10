import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { learningService, Course as ServiceCourse } from '@/services/learningService';
import './LearningPage.css';
import '@/pages/WorkSuite.css';

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  rating: number;
  enrolled: number;
  progress?: number;
  saved: boolean;
  thumbnail: string;
}

const levelColors = {
  'Beginner': 'lvl--beginner',
  'Intermediate': 'lvl--intermediate',
  'Advanced': 'lvl--advanced',
};

const courseLevels: Course['level'][] = ['Beginner', 'Intermediate', 'Advanced'];

const toLocal = (c: ServiceCourse): Course => ({
  id: c.id,
  title: c.title,
  instructor: c.instructor || '',
  category: c.category || '',
  level: c.level,
  duration: c.duration || '',
  rating: c.rating,
  enrolled: c.enrolled,
  progress: c.progress,
  saved: c.saved,
  thumbnail: c.thumbnail || '📚',
});

export const LearningPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'recommended' | 'my-learning' | 'saved'>('recommended');
  const [keyword, setKeyword] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<Course['level']>('Beginner');
  const [duration, setDuration] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId;

  const load = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await learningService.listCourses(companyId);
      setCourses(data.map(toLocal));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) load();
    else setIsLoading(false);
  }, [companyId]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const toggleSave = async (id: string) => {
    if (!companyId) return;
    const current = courses.find(c => c.id === id);
    if (!current) return;
    setCourses(prev => prev.map(c => c.id === id ? { ...c, saved: !c.saved } : c));
    try {
      await learningService.updateCourse(companyId, id, { saved: !current.saved });
    } finally {
      await load();
    }
  };

  const openCreate = () => {
    setTitle('');
    setInstructor('');
    setCategory('');
    setLevel('Beginner');
    setDuration('');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !companyId) return;
    setIsSaving(true);
    setError(null);
    try {
      await learningService.createCourse(companyId, {
        title: title.trim(),
        instructor: instructor.trim() || undefined,
        category: category.trim() || undefined,
        level,
        duration: duration.trim() || undefined,
        rating: 0,
        enrolled: 0,
        saved: false,
      });
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that course — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = courses.filter(c => {
    const kw = keyword === '' || c.title.toLowerCase().includes(keyword.toLowerCase()) || c.category.toLowerCase().includes(keyword.toLowerCase());
    if (activeTab === 'my-learning') return typeof c.progress === 'number' && kw;
    if (activeTab === 'saved') return c.saved && kw;
    return kw;
  });

  const inProgress = courses.filter(c => typeof c.progress === 'number');

  return (
    <div className="learn-page">
      <Navbar />

      {/* Search Banner */}
      <div className="learn-page__search-banner">
        <div className="learn-page__search-container">
          <div className="learn-search">
            <div className="learn-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#a79e8c" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#a79e8c" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Search courses by topic, skill or keyword"
                className="learn-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <button className="learn-search__btn" onClick={openCreate}>+ Add Course</button>
          </div>
        </div>
      </div>

      <div className="learn-page__container">
        {/* Continue Learning Banner */}
        {activeTab === 'recommended' && inProgress.length > 0 && (
          <div className="learn-continue">
            <div className="learn-continue__header">Continue Learning</div>
            <div className="learn-continue__courses">
              {inProgress.map(c => (
                <div key={c.id} className="learn-continue-item">
                  <div className="learn-continue-item__thumb">{c.thumbnail}</div>
                  <div className="learn-continue-item__info">
                    <div className="learn-continue-item__title">{c.title}</div>
                    <div className="learn-continue-item__progress-wrap">
                      <div className="learn-continue-item__progress-bar" style={{ width: `${c.progress}%` }} />
                    </div>
                    <div className="learn-continue-item__pct">{c.progress}% complete</div>
                  </div>
                  <button className="learn-continue-item__btn">Resume</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="learn-page__tabs">
          {([
            { key: 'recommended', label: 'Recommended' },
            { key: 'my-learning', label: 'My Learning' },
            { key: 'saved', label: 'Saved' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              className={`learn-page__tab${activeTab === tab.key ? ' learn-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === 'saved' && (
                <span className="learn-page__tab-badge">{courses.filter(c => c.saved).length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="learn-grid">
          {isLoading ? (
            <div className="worksuite-empty">Loading courses…</div>
          ) : filtered.length === 0 ? (
            <div className="learn-empty">No courses found.</div>
          ) : filtered.map(course => (
            <div key={course.id} className="learn-course-card">
              <div className="learn-course-card__thumb">{course.thumbnail}</div>
              <div className="learn-course-card__body">
                <div className="learn-course-card__category">{course.category}</div>
                <div className="learn-course-card__title">{course.title}</div>
                <div className="learn-course-card__instructor">by {course.instructor}</div>
                <div className="learn-course-card__meta">
                  <span className={`learn-lvl ${levelColors[course.level]}`}>{course.level}</span>
                  <span className="learn-course-card__duration">⏱ {course.duration}</span>
                </div>
                <div className="learn-course-card__stats">
                  <span className="learn-course-card__rating">★ {course.rating}</span>
                  <span className="learn-course-card__enrolled">· {course.enrolled.toLocaleString()} enrolled</span>
                </div>
                {typeof course.progress === 'number' && (
                  <div className="learn-course-card__progress-wrap">
                    <div className="learn-course-card__progress-bar" style={{ width: `${course.progress}%` }} />
                    <span className="learn-course-card__progress-pct">{course.progress}%</span>
                  </div>
                )}
              </div>
              <div className="learn-course-card__actions">
                <button
                  className={`learn-save-btn${course.saved ? ' learn-save-btn--saved' : ''}`}
                  onClick={() => toggleSave(course.id)}
                >
                  {course.saved ? '★' : '☆'}
                </button>
                <button className="learn-enroll-btn">
                  {typeof course.progress === 'number' ? 'Continue' : 'Start Course'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Course</h2>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title" maxLength={160} />
            <label>Instructor</label>
            <input value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as Course['level'])}>
              {courseLevels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <label>Duration</label>
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 3h 20m" maxLength={40} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!title.trim() || isSaving}>
                {isSaving ? 'Saving…' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
