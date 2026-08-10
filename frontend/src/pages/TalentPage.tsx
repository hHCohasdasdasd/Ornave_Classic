import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { talentService } from '@/services/talentService';
import './TalentPage.css';
import '@/pages/WorkSuite.css';

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

const availabilityColors: Record<Candidate['availability'], string> = {
  'Available': 'talent-badge--open',
  'Passive': 'talent-badge--passive',
  'Not looking': 'talent-badge--closed',
};

const availabilityOptions: Candidate['availability'][] = ['Available', 'Passive', 'Not looking'];

export const TalentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommended' | 'saved'>('recommended');

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState<Candidate['availability']>('Available');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId;

  const load = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await talentService.listCandidates(companyId);
      setCandidates(data.map(c => ({
        id: c.id,
        name: c.name,
        title: c.title || '',
        location: c.location || '',
        skills: c.skills || [],
        experience: c.experience || '',
        availability: c.availability,
        saved: c.saved,
      })));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) load();
    else setIsLoading(false);
  }, [companyId]);

  const toggleSave = async (id: string) => {
    if (!companyId) return;
    const current = candidates.find(c => c.id === id);
    if (!current) return;
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, saved: !c.saved } : c));
    try {
      await talentService.updateCandidate(companyId, id, { saved: !current.saved });
    } finally {
      await load();
    }
  };

  const openCreate = () => {
    setName('');
    setTitle('');
    setLocation('');
    setSkillsInput('');
    setExperience('');
    setAvailability('Available');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !companyId) return;
    setIsSaving(true);
    setError(null);
    try {
      await talentService.createCandidate(companyId, {
        name: name.trim(),
        title: title.trim() || undefined,
        location: location.trim() || undefined,
        skills: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
        experience: experience.trim() || undefined,
        availability,
        saved: false,
      });
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that candidate — try again.');
    } finally {
      setIsSaving(false);
    }
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
            <button className="talent-search__btn" onClick={() => {
              if (!user) {
                triggerAuthModal('Please log in to add candidates.');
                return;
              }
              openCreate();
            }}>+ Add Candidate</button>
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
          {isLoading ? (
            <div className="worksuite-empty">Loading candidates…</div>
          ) : filtered.length === 0 ? (
            <div className="talent-empty">No candidates match your criteria.</div>
          ) : filtered.map(candidate => (
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

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Candidate</h2>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={120} />
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Skills (comma-separated)</label>
            <input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, TypeScript, Node.js" maxLength={300} />
            <label>Experience</label>
            <input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5 years" maxLength={60} />
            <label>Availability</label>
            <select value={availability} onChange={(e) => setAvailability(e.target.value as Candidate['availability'])}>
              {availabilityOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!name.trim() || isSaving}>
                {isSaving ? 'Saving…' : 'Add Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
