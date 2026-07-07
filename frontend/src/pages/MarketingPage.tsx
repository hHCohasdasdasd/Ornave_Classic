import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import './MarketingPage.css';

interface Campaign {
  id: string;
  name: string;
  type: 'Sponsored Content' | 'Text Ad' | 'Message Ad' | 'Dynamic Ad';
  status: 'Active' | 'Paused' | 'Draft' | 'Completed';
  budget: string;
  spent: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Q1 Brand Awareness Campaign', type: 'Sponsored Content', status: 'Active', budget: '€2,000', spent: '€1,340', impressions: 84200, clicks: 1230, conversions: 42 },
  { id: '2', name: 'Talent Recruitment Drive', type: 'Message Ad', status: 'Active', budget: '€800', spent: '€520', impressions: 14900, clicks: 440, conversions: 18 },
  { id: '3', name: 'Product Launch – Spring 2026', type: 'Dynamic Ad', status: 'Draft', budget: '€3,500', spent: '€0', impressions: 0, clicks: 0, conversions: 0 },
  { id: '4', name: 'Lead Gen – Enterprise Clients', type: 'Text Ad', status: 'Completed', budget: '€1,200', spent: '€1,196', impressions: 62000, clicks: 980, conversions: 67 },
  { id: '5', name: 'Webinar Promotion – March', type: 'Sponsored Content', status: 'Paused', budget: '€600', spent: '€280', impressions: 22100, clicks: 310, conversions: 11 },
];

const statusColors: Record<Campaign['status'], string> = {
  'Active': 'mkt-status--active',
  'Paused': 'mkt-status--paused',
  'Draft': 'mkt-status--draft',
  'Completed': 'mkt-status--completed',
};

export const MarketingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics' | 'audience'>('campaigns');
  const [keyword, setKeyword] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const filtered = mockCampaigns.filter(c =>
    keyword === '' || c.name.toLowerCase().includes(keyword.toLowerCase())
  );

  const totalImpressions = mockCampaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = mockCampaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = mockCampaigns.reduce((s, c) => s + c.conversions, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

  return (
    <div className="mkt-page">
      <Navbar />

      {/* Search Banner */}
      <div className="mkt-page__search-banner">
        <div className="mkt-page__search-container">
          <div className="mkt-search">
            <div className="mkt-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#c7ceda" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#c7ceda" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Search campaigns..."
                className="mkt-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <button className="mkt-search__btn">+ Create Campaign</button>
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
            {filtered.map(campaign => (
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
                    <div className="mkt-metric__value mkt-metric__value--budget">{campaign.spent} / {campaign.budget}</div>
                    <div className="mkt-metric__label">Budget Spent</div>
                  </div>
                </div>
                {campaign.status !== 'Draft' && campaign.budget !== '€0' && (
                  <div className="mkt-campaign-card__progress-wrap">
                    <div
                      className="mkt-campaign-card__progress-bar"
                      style={{
                        width: `${Math.min(100, (parseFloat(campaign.spent.replace(/[^0-9.]/g, '')) / parseFloat(campaign.budget.replace(/[^0-9.]/g, ''))) * 100)}%`
                      }}
                    />
                  </div>
                )}
                <div className="mkt-campaign-card__actions">
                  {campaign.status === 'Active' && <button className="mkt-btn mkt-btn--pause">⏸ Pause</button>}
                  {campaign.status === 'Paused' && <button className="mkt-btn mkt-btn--resume">▶ Resume</button>}
                  {campaign.status === 'Draft' && <button className="mkt-btn mkt-btn--launch">🚀 Launch</button>}
                  <button className="mkt-btn mkt-btn--edit">Edit</button>
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
    </div>
  );
};
