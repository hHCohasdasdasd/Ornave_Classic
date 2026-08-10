import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { marketingService, Campaign as ServiceCampaign } from '@/services/marketingService';
import './MarketingPage.css';
import '@/pages/WorkSuite.css';

interface Campaign {
  id: string;
  name: string;
  type: 'Sponsored Content' | 'Text Ad' | 'Message Ad' | 'Dynamic Ad';
  status: 'Active' | 'Paused' | 'Draft' | 'Completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

const statusColors: Record<Campaign['status'], string> = {
  'Active': 'mkt-status--active',
  'Paused': 'mkt-status--paused',
  'Draft': 'mkt-status--draft',
  'Completed': 'mkt-status--completed',
};

const campaignTypes: Campaign['type'][] = ['Sponsored Content', 'Text Ad', 'Message Ad', 'Dynamic Ad'];
const campaignStatuses: Campaign['status'][] = ['Active', 'Paused', 'Draft', 'Completed'];

const toLocal = (c: ServiceCampaign): Campaign => ({
  id: c.id,
  name: c.name,
  type: c.type,
  status: c.status,
  budget: c.budget,
  spent: c.spent,
  impressions: c.impressions,
  clicks: c.clicks,
  conversions: c.conversions,
});

export const MarketingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics' | 'audience'>('campaigns');
  const [keyword, setKeyword] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Campaign['type']>('Sponsored Content');
  const [status, setStatus] = useState<Campaign['status']>('Draft');
  const [budget, setBudget] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId;

  const load = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await marketingService.listCampaigns(companyId);
      setCampaigns(data.map(toLocal));
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

  const openCreate = () => {
    setName('');
    setType('Sponsored Content');
    setStatus('Draft');
    setBudget('');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !companyId) return;
    setIsSaving(true);
    setError(null);
    try {
      await marketingService.createCampaign(companyId, {
        name: name.trim(),
        type,
        status,
        budget: parseFloat(budget) || 0,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      });
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that campaign — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (campaign: Campaign, newStatus: Campaign['status']) => {
    if (!companyId) return;
    await marketingService.updateCampaign(companyId, campaign.id, { status: newStatus });
    await load();
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!companyId) return;
    await marketingService.deleteCampaign(companyId, campaign.id);
    await load();
  };

  const filtered = campaigns.filter(c =>
    keyword === '' || c.name.toLowerCase().includes(keyword.toLowerCase())
  );

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

  return (
    <div className="mkt-page">
      <Navbar />

      {/* Search Banner */}
      <div className="mkt-page__search-banner">
        <div className="mkt-page__search-container">
          <div className="mkt-search">
            <div className="mkt-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#a79e8c" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#a79e8c" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Search campaigns..."
                className="mkt-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <button className="mkt-search__btn" onClick={openCreate}>+ Create Campaign</button>
          </div>
        </div>
      </div>

      <div className="mkt-page__container">
        {/* Stats */}
        <div className="mkt-stats">
          {[
            { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: '👁️' },
            { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: '🖱️' },
            { label: 'Avg. CTR', value: `${avgCtr}%`, icon: '📊' },
            { label: 'Conversions', value: totalConversions.toString(), icon: '🎯' },
          ].map(stat => (
            <div key={stat.label} className="mkt-stat">
              <div className="mkt-stat__icon">{stat.icon}</div>
              <div className="mkt-stat__value">{stat.value}</div>
              <div className="mkt-stat__label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mkt-page__tabs">
          {(['campaigns', 'analytics', 'audience'] as const).map(tab => (
            <button
              key={tab}
              className={`mkt-page__tab${activeTab === tab ? ' mkt-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="mkt-campaigns-list">
            {isLoading ? (
              <div className="worksuite-empty">Loading campaigns…</div>
            ) : filtered.length === 0 ? (
              <div className="worksuite-empty">No campaigns yet — create one to get started.</div>
            ) : filtered.map(campaign => (
              <div key={campaign.id} className="mkt-campaign-card">
                <div className="mkt-campaign-card__main">
                  <div className="mkt-campaign-card__left">
                    <div className="mkt-campaign-card__name">{campaign.name}</div>
                    <div className="mkt-campaign-card__type">{campaign.type}</div>
                  </div>
                  <span className={`mkt-status ${statusColors[campaign.status]}`}>{campaign.status}</span>
                </div>
                <div className="mkt-campaign-card__metrics">
                  <div className="mkt-metric">
                    <div className="mkt-metric__value">{campaign.impressions.toLocaleString()}</div>
                    <div className="mkt-metric__label">Impressions</div>
                  </div>
                  <div className="mkt-metric">
                    <div className="mkt-metric__value">{campaign.clicks.toLocaleString()}</div>
                    <div className="mkt-metric__label">Clicks</div>
                  </div>
                  <div className="mkt-metric">
                    <div className="mkt-metric__value">{campaign.conversions}</div>
                    <div className="mkt-metric__label">Conversions</div>
                  </div>
                  <div className="mkt-metric">
                    <div className="mkt-metric__value mkt-metric__value--budget">€{campaign.spent.toLocaleString()} / €{campaign.budget.toLocaleString()}</div>
                    <div className="mkt-metric__label">Budget Spent</div>
                  </div>
                </div>
                {campaign.status !== 'Draft' && campaign.budget > 0 && (
                  <div className="mkt-campaign-card__progress-wrap">
                    <div
                      className="mkt-campaign-card__progress-bar"
                      style={{
                        width: `${Math.min(100, (campaign.spent / campaign.budget) * 100)}%`
                      }}
                    />
                  </div>
                )}
                <div className="mkt-campaign-card__actions">
                  {campaign.status === 'Active' && <button className="mkt-btn mkt-btn--pause" onClick={() => handleStatusChange(campaign, 'Paused')}>⏸ Pause</button>}
                  {campaign.status === 'Paused' && <button className="mkt-btn mkt-btn--resume" onClick={() => handleStatusChange(campaign, 'Active')}>▶ Resume</button>}
                  {campaign.status === 'Draft' && <button className="mkt-btn mkt-btn--launch" onClick={() => handleStatusChange(campaign, 'Active')}>🚀 Launch</button>}
                  <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(campaign)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="mkt-placeholder">
            <div className="mkt-placeholder__icon">📊</div>
            <div className="mkt-placeholder__title">Campaign Analytics</div>
            <p className="mkt-placeholder__text">Dive deep into performance data, audience insights, and ROI across all your campaigns.</p>
            <button className="mkt-placeholder__btn">View Full Report</button>
          </div>
        )}

        {activeTab === 'audience' && (
          <div className="mkt-placeholder">
            <div className="mkt-placeholder__icon">🎯</div>
            <div className="mkt-placeholder__title">Audience Manager</div>
            <p className="mkt-placeholder__text">Create and manage saved audiences based on job title, industry, seniority, and more.</p>
            <button className="mkt-placeholder__btn">Create Audience</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Campaign</h2>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" maxLength={120} />
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as Campaign['type'])}>
              {campaignTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Campaign['status'])}>
              {campaignStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label>Budget (€)</label>
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!name.trim() || isSaving}>
                {isSaving ? 'Saving…' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
