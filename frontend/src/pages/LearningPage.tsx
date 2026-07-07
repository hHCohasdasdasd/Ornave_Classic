import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import './LearningPage.css';

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

const mockCourses: Course[] = [
  { id: '1', title: 'B2B Sales Mastery: Enterprise Closing Techniques', instructor: 'Stefan Vogel', category: 'Sales', level: 'Advanced', duration: '4h 20m', rating: 4.8, enrolled: 3420, progress: 65, saved: false, thumbnail: '📈' },
  { id: '2', title: 'Data-Driven Marketing for B2B Companies', instructor: 'Marie Leclerc', category: 'Marketing', level: 'Intermediate', duration: '3h 10m', rating: 4.6, enrolled: 2180, saved: true, thumbnail: '📢' },
  { id: '3', title: 'Mastering LinkedIn & Professional Networking', instructor: 'James Fletcher', category: 'Networking', level: 'Beginner', duration: '2h 45m', rating: 4.9, enrolled: 8930, progress: 20, saved: false, thumbnail: '🤝' },
  { id: '4', title: 'Financial Modeling for Business Leaders', instructor: 'Anna Becker', category: 'Finance', level: 'Intermediate', duration: '5h 00m', rating: 4.7, enrolled: 1520, saved: false, thumbnail: '💰' },
  { id: '5', title: 'Hiring & Building High-Performance Teams', instructor: 'Priya Nair', category: 'HR & Leadership', level: 'Intermediate', duration: '3h 30m', rating: 4.5, enrolled: 2870, saved: true, thumbnail: '👥' },
  { id: '6', title: 'AI Tools for Business Productivity', instructor: 'Lucas Andreou', category: 'Technology', level: 'Beginner', duration: '2h 00m', rating: 4.8, enrolled: 6140, saved: false, thumbnail: '🤖' },
];

const levelColors = {
  'Beginner': 'lvl--beginner',
  'Intermediate': 'lvl--intermediate',
  'Advanced': 'lvl--advanced',
};

export const LearningPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'recommended' | 'my-learning' | 'saved'>('recommended');
  const [keyword, setKeyword] = useState('');
  const [courses, setCourses] = useState<Course[]>(mockCourses);

  if (!user) {
    navigate('/login');
    return null;
  }

  const toggleSave = (id: string) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, saved: !c.saved } : c));
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#c7ceda" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#c7ceda" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Search courses by topic, skill or keyword"
                className="learn-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <button className="learn-search__btn">Search</button>
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
          {filtered.length === 0 && (
            <div className="learn-empty">No courses found.</div>
          )}
          {filtered.map(course => (
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
    </div>
  );
};
