import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import './TalentPage.css';

interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  skills: string[];
  experience: string;
  availability: 'Available' | 'Passive' | 'Not looking';
  saved: boolean;
}

const mockCandidates: Candidate[] = [
  { id: '1', name: 'Nina Hoffmann', title: 'Senior Software Engineer', location: 'Berlin, Germany', skills: ['TypeScript', 'React', 'Node.js'], experience: '7 years', availability: 'Available', saved: false },
  { id: '2', name: 'Carlos Rivera', title: 'Product Manager', location: 'Barcelona, Spain', skills: ['Agile', 'Roadmapping', 'Jira'], experience: '5 years', availability: 'Passive', saved: true },
  { id: '3', name: 'Anya Kowalski', title: 'Data Scientist', location: 'Warsaw, Poland', skills: ['Python', 'Machine Learning', 'SQL'], experience: '4 years', availability: 'Available', saved: false },
  { id: '4', name: 'Felix Braun', title: 'DevOps Engineer', location: 'Frankfurt, Germany', skills: ['Kubernetes', 'AWS', 'CI/CD'], experience: '6 years', availability: 'Passive', saved: false },
  { id: '5', name: 'Priya Sharma', title: 'UX Designer', location: 'Amsterdam, Netherlands', skills: ['Figma', 'User Research', 'Prototyping'], experience: '3 years', availability: 'Available', saved: true },
  { id: '6', name: 'Luc Fontaine', title: 'Financial Analyst', location: 'Paris, France', skills: ['Excel', 'Financial Modeling', 'Power BI'], experience: '5 years', availability: 'Not looking', saved: false },
];

const availabilityColors: Record<Candidate['availability'], string> = {
  'Available': 'talent-badge--open',
  'Passive': 'talent-badge--passive',
  'Not looking': 'talent-badge--closed',
};

export const TalentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [activeTab, setActiveTab] = useState<'recommended' | 'saved'>('recommended');

  const toggleSave = (id: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, saved: !c.saved } : c));
  };

  const filtered = candidates.filter(c => {
    if (activeTab === 'saved' && !c.saved) return false;
    const kw = keyword === '' || c.name.toLowerCase().includes(keyword.toLowerCase()) || c.title.toLowerCase().includes(keyword.toLowerCase()) || c.skills.some(s => s.toLowerCase().includes(keyword.toLowerCase()));
    const loc = locationFilter === '' || c.location.toLowerCase().includes(locationFilter.toLowerCase());
    return kw && loc;
  });

  return (
    <>
      <ProtectedPageOverlay isVisible={!user} />
      <div className="talent-page">
        <Navbar />

      {/* Search Banner */}
      <div className="talent-page__search-banner">
        <div className="talent-page__search-container">
          <div className="talent-search">
            <div className="talent-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#a79e8c" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#a79e8c" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Name, title or skill"
                className="talent-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <div className="talent-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#a79e8c"/></svg>
              <input
                type="text"
                placeholder="Location"
                className="talent-search__input"
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
              />
            </div>
            <button className="talent-search__btn">Search</button>
          </div>
        </div>
      </div>

      <div className="talent-page__container">
        <div className="talent-page__heading">
          <h1 className="talent-page__title">Talent</h1>
          <p className="talent-page__subtitle">Find and connect with top professionals across Europe.</p>
        </div>

        {/* Tabs */}
        <div className="talent-page__tabs">
          {(['recommended', 'saved'] as const).map(tab => (
            <button
              key={tab}
              className={`talent-page__tab${activeTab === tab ? ' talent-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'saved' && (
                <span className="talent-page__tab-badge">{candidates.filter(c => c.saved).length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Candidate Grid */}
        <div className="talent-grid">
          {filtered.length === 0 && (
            <div className="talent-empty">No candidates match your criteria.</div>
          )}
          {filtered.map(candidate => (
            <div key={candidate.id} className="talent-card">
              <div className="talent-card__top">
                <div className="talent-card__avatar">
                  {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="talent-card__info">
                  <div className="talent-card__name">{candidate.name}</div>
                  <div className="talent-card__title">{candidate.title}</div>
                  <div className="talent-card__location">📍 {candidate.location}</div>
                </div>
              </div>
              <div className="talent-card__meta">
                <span className={`talent-badge ${availabilityColors[candidate.availability]}`}>
                  {candidate.availability}
                </span>
                <span className="talent-card__exp">· {candidate.experience}</span>
              </div>
              <div className="talent-card__skills">
                {candidate.skills.map(skill => (
                  <span key={skill} className="talent-skill">{skill}</span>
                ))}
              </div>
              <div className="talent-card__actions">
                <button
                  className={`talent-card__save${candidate.saved ? ' talent-card__save--saved' : ''}`}
                  onClick={() => toggleSave(candidate.id)}
                >
                  {candidate.saved ? '★ Saved' : '☆ Save'}
                </button>
                <button 
                  className="talent-card__message"
                  onClick={() => {
                    if (!user) {
                      triggerAuthModal('Please log in to message candidates.');
                      return;
                    }
                    alert('Message opened');
                  }}
                >
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};
