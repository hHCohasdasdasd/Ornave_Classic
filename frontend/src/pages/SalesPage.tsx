import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import './SalesPage.css';

interface Deal {
  id: string;
  name: string;
  company: string;
  value: string;
  stage: 'Prospect' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  owner: string;
  closeDate: string;
}

const mockDeals: Deal[] = [
  { id: '1', name: 'Enterprise Suite Expansion', company: 'Siemens AG', value: '€48,000', stage: 'Negotiation', owner: 'Marco B.', closeDate: 'Mar 28, 2026' },
  { id: '2', name: 'Annual SaaS Renewal', company: 'UniCredit Group', value: '€24,000', stage: 'Proposal', owner: 'Sophia M.', closeDate: 'Apr 5, 2026' },
  { id: '3', name: 'New Business – HR Module', company: 'Skoda Auto', value: '€15,500', stage: 'Qualified', owner: 'Lucie N.', closeDate: 'Apr 15, 2026' },
  { id: '4', name: 'Pilot Program Conversion', company: 'Philips', value: '€9,200', stage: 'Closed Won', owner: 'Jan B.', closeDate: 'Mar 10, 2026' },
  { id: '5', name: 'Global Analytics Package', company: 'Shell PLC', value: '€62,000', stage: 'Prospect', owner: 'Aisha O.', closeDate: 'May 30, 2026' },
  { id: '6', name: 'SMB Onboarding Bundle', company: 'Kalkül GmbH', value: '€3,800', stage: 'Closed Lost', owner: 'David P.', closeDate: 'Feb 28, 2026' },
];

const stageColors: Record<Deal['stage'], string> = {
  'Prospect': 'stage--prospect',
  'Qualified': 'stage--qualified',
  'Proposal': 'stage--proposal',
  'Negotiation': 'stage--negotiation',
  'Closed Won': 'stage--won',
  'Closed Lost': 'stage--lost',
};

const pipelineStages: Deal['stage'][] = ['Prospect', 'Qualified', 'Proposal', 'Negotiation'];

export const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'contacts' | 'activity'>('pipeline');
  const [keyword, setKeyword] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const filtered = mockDeals.filter(d =>
    keyword === '' ||
    d.name.toLowerCase().includes(keyword.toLowerCase()) ||
    d.company.toLowerCase().includes(keyword.toLowerCase())
  );

  const totalPipeline = mockDeals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + parseFloat(d.value.replace(/[^0-9.]/g, '')), 0);

  return (
    <div className="sales-page">
      <Navbar />

      {/* Search Banner */}
      <div className="sales-page__search-banner">
        <div className="sales-page__search-container">
          <div className="sales-search">
            <div className="sales-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#c7ceda" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#c7ceda" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Search deals or companies..."
                className="sales-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <button className="sales-search__btn">+ New Deal</button>
          </div>
        </div>
      </div>

      <div className="sales-page__container">
        {/* Stats */}
        <div className="sales-stats">
          <div className="sales-stat">
            <div className="sales-stat__label">Total Pipeline</div>
            <div className="sales-stat__value">€{totalPipeline.toLocaleString()}</div>
          </div>
          <div className="sales-stat">
            <div className="sales-stat__label">Deals in Progress</div>
            <div className="sales-stat__value">{mockDeals.filter(d => !d.stage.startsWith('Closed')).length}</div>
          </div>
          <div className="sales-stat">
            <div className="sales-stat__label">Won This Month</div>
            <div className="sales-stat__value sales-stat__value--green">{mockDeals.filter(d => d.stage === 'Closed Won').length}</div>
          </div>
          <div className="sales-stat">
            <div className="sales-stat__label">Win Rate</div>
            <div className="sales-stat__value sales-stat__value--green">67%</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sales-page__tabs">
          {(['pipeline', 'contacts', 'activity'] as const).map(tab => (
            <button
              key={tab}
              className={`sales-page__tab${activeTab === tab ? ' sales-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div>
            {/* Kanban by Stage */}
            <div className="sales-kanban">
              {pipelineStages.map(stage => (
                <div key={stage} className="sales-kanban__column">
                  <div className="sales-kanban__col-header">
                    <span>{stage}</span>
                    <span className="sales-kanban__col-count">
                      {filtered.filter(d => d.stage === stage).length}
                    </span>
                  </div>
                  <div className="sales-kanban__cards">
                    {filtered.filter(d => d.stage === stage).map(deal => (
                      <div key={deal.id} className="sales-deal-card">
                        <div className="sales-deal-card__name">{deal.name}</div>
                        <div className="sales-deal-card__company">{deal.company}</div>
                        <div className="sales-deal-card__value">{deal.value}</div>
                        <div className="sales-deal-card__footer">
                          <span className="sales-deal-card__owner">{deal.owner}</span>
                          <span className="sales-deal-card__close">{deal.closeDate}</span>
                        </div>
                      </div>
                    ))}
                    {filtered.filter(d => d.stage === stage).length === 0 && (
                      <div className="sales-kanban__empty">No deals</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Closed deals */}
            <div className="sales-closed-section">
              <h2 className="sales-section-title">Closed Deals</h2>
              <div className="sales-closed-list">
                {filtered.filter(d => d.stage.startsWith('Closed')).map(deal => (
                  <div key={deal.id} className="sales-closed-item">
                    <div>
                      <div className="sales-closed-item__name">{deal.name}</div>
                      <div className="sales-closed-item__company">{deal.company}</div>
                    </div>
                    <div className="sales-closed-item__right">
                      <div className="sales-closed-item__value">{deal.value}</div>
                      <span className={`deal-stage ${stageColors[deal.stage]}`}>{deal.stage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contacts placeholder */}
        {activeTab === 'contacts' && (
          <div className="sales-placeholder">
            <div className="sales-placeholder__icon">👤</div>
            <div className="sales-placeholder__title">CRM Contacts</div>
            <p className="sales-placeholder__text">Manage your client and prospect contacts, track interactions, and build relationships.</p>
            <button className="sales-placeholder__btn">Import Contacts</button>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="sales-placeholder">
            <div className="sales-placeholder__icon">📈</div>
            <div className="sales-placeholder__title">Sales Activity</div>
            <p className="sales-placeholder__text">Track calls, emails, meetings and follow-ups across your entire pipeline.</p>
            <button className="sales-placeholder__btn">Log Activity</button>
          </div>
        )}
      </div>
    </div>
  );
};
