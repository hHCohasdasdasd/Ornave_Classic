import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { leadsService } from '@/services/leadsService';
import './LeadsPage.css';
import '@/pages/WorkSuite.css';

interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  connections: number;
  mutualConnections?: string;
  saved: boolean;
}

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'recommended' | 'saved' | 'recent'>('recommended');
  const [keyword, setKeyword] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId;

  const load = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await leadsService.listLeads(companyId);
      setLeads(data.map(l => ({
        id: l.id,
        name: l.name,
        title: l.title || '',
        company: l.leadCompany || '',
        location: l.location || '',
        industry: l.industry || '',
        connections: l.connections,
        mutualConnections: l.mutualConnections ? String(l.mutualConnections) : undefined,
        saved: l.saved,
      })));
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
    const current = leads.find(l => l.id === id);
    if (!current) return;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, saved: !l.saved } : l));
    try {
      await leadsService.updateLead(companyId, id, { saved: !current.saved });
    } finally {
      await load();
    }
  };

  const openCreate = () => {
    setName('');
    setTitle('');
    setLeadCompany('');
    setLocation('');
    setIndustry('');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !companyId) return;
    setIsSaving(true);
    setError(null);
    try {
      await leadsService.createLead(companyId, {
        name: name.trim(),
        title: title.trim() || undefined,
        leadCompany: leadCompany.trim() || undefined,
        location: location.trim() || undefined,
        industry: industry.trim() || undefined,
        connections: 0,
        saved: false,
      });
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that lead — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = leads.filter(l => {
    const tab = activeTab === 'saved' ? l.saved : true;
    const kw = keyword === '' || l.name.toLowerCase().includes(keyword.toLowerCase()) || l.title.toLowerCase().includes(keyword.toLowerCase()) || l.company.toLowerCase().includes(keyword.toLowerCase());
    const loc = locationFilter === '' || l.location.toLowerCase().includes(locationFilter.toLowerCase());
    const ind = industryFilter === '' || l.industry.toLowerCase().includes(industryFilter.toLowerCase());
    return tab && kw && loc && ind;
  });

  return (
    <>
      <ProtectedPageOverlay isVisible={!user} />
      <div className="leads-page">
        <Navbar />

      {/* Search Banner */}
      <div className="leads-page__search-banner">
        <div className="leads-page__search-container">
          <div className="leads-search">
            <div className="leads-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#a79e8c" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#a79e8c" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Name, title, company or keyword"
                className="leads-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <div className="leads-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#a79e8c"/></svg>
              <input
                type="text"
                placeholder="Location"
                className="leads-search__input"
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="leads-search__field">
              <input
                type="text"
                placeholder="Industry"
                className="leads-search__input"
                value={industryFilter}
                onChange={e => setIndustryFilter(e.target.value)}
              />
            </div>
            <button className="leads-search__btn" onClick={openCreate}>+ Add Lead</button>
          </div>
        </div>
      </div>

      <div className="leads-page__container">
        {/* Tabs */}
        <div className="leads-page__tabs">
          {(['recommended', 'saved', 'recent'] as const).map(tab => (
            <button
              key={tab}
              className={`leads-page__tab${activeTab === tab ? ' leads-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'saved' && <span className="leads-page__tab-badge">{leads.filter(l => l.saved).length}</span>}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="leads-stats">
          <div className="leads-stat">
            <span className="leads-stat__value">{filtered.length}</span>
            <span className="leads-stat__label">Prospects found</span>
          </div>
          <div className="leads-stat">
            <span className="leads-stat__value">{leads.filter(l => l.saved).length}</span>
            <span className="leads-stat__label">Saved leads</span>
          </div>
        </div>

        {/* Lead Cards */}
        <div className="leads-grid">
          {isLoading ? (
            <div className="worksuite-empty">Loading leads…</div>
          ) : filtered.length === 0 ? (
            <div className="leads-empty">No leads match your search criteria.</div>
          ) : (
          filtered.map(lead => (
            <div key={lead.id} className="lead-card">
              <div className="lead-card__avatar">
                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="lead-card__info">
                <div className="lead-card__name">{lead.name}</div>
                <div className="lead-card__title">{lead.title}</div>
                <div className="lead-card__company">{lead.company}</div>
                <div className="lead-card__meta">
                  <span className="lead-card__location">📍 {lead.location}</span>
                  <span className="lead-card__industry">· {lead.industry}</span>
                </div>
                {lead.mutualConnections && (
                  <div className="lead-card__mutual">👤 Connected via {lead.mutualConnections}</div>
                )}
              </div>
              <div className="lead-card__actions">
                <button
                  className={`lead-card__save${lead.saved ? ' lead-card__save--saved' : ''}`}
                  onClick={() => toggleSave(lead.id)}
                >
                  {lead.saved ? '★ Saved' : '☆ Save'}
                </button>
                <button className="lead-card__connect">Connect</button>
              </div>
            </div>
          ))
          )}
        </div>
      </div>
    </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Lead</h2>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={120} />
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Company</label>
            <input value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Industry</label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Optional" maxLength={120} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!name.trim() || isSaving}>
                {isSaving ? 'Saving…' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
