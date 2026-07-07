import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import './LeadsPage.css';

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

const mockLeads: Lead[] = [
  { id: '1', name: 'Sophia Müller', title: 'Head of Procurement', company: 'Siemens AG', location: 'Munich, Germany', industry: 'Engineering', connections: 2, mutualConnections: 'Klaus Fischer', saved: false },
  { id: '2', name: 'Marco Bianchi', title: 'Director of Partnerships', company: 'UniCredit Group', location: 'Milan, Italy', industry: 'Finance', connections: 4, saved: true },
  { id: '3', name: 'Aisha Okafor', title: 'VP of Supply Chain', company: 'Shell PLC', location: 'Amsterdam, Netherlands', industry: 'Energy', connections: 1, mutualConnections: 'Elena Torres', saved: false },
  { id: '4', name: 'David Park', title: 'Chief Revenue Officer', company: 'SAP SE', location: 'Walldorf, Germany', industry: 'Software', connections: 6, saved: false },
  { id: '5', name: 'Lucie Novák', title: 'Head of Sales EMEA', company: 'Skoda Auto', location: 'Prague, Czech Republic', industry: 'Automotive', connections: 3, saved: true },
  { id: '6', name: 'Jan van der Berg', title: 'Global Account Manager', company: 'Philips', location: 'Eindhoven, Netherlands', industry: 'Healthcare Tech', connections: 2, saved: false },
];

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'recommended' | 'saved' | 'recent'>('recommended');
  const [keyword, setKeyword] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  if (!user) {
    navigate('/login');
    return null;
  }

  const toggleSave = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, saved: !l.saved } : l));
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#c7ceda" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#c7ceda" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Name, title, company or keyword"
                className="leads-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <div className="leads-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#c7ceda"/></svg>
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
            <button className="leads-search__btn">Search</button>
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
          <div className="leads-stat">
            <span className="leads-stat__value">3</span>
            <span className="leads-stat__label">Contacted this week</span>
          </div>
        </div>

        {/* Lead Cards */}
        <div className="leads-grid">
          {filtered.length === 0 && (
            <div className="leads-empty">No leads match your search criteria.</div>
          )}
          {filtered.map(lead => (
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
          ))}
        </div>
      </div>
    </div>
    </>
  );
};
