import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import './TalentInsightsPage.css';

const statCards = [
  { label: 'Total Applicants', value: '1,284', change: '+18%', positive: true, icon: '👥' },
  { label: 'Active Job Posts', value: '7', change: '+2', positive: true, icon: '💼' },
  { label: 'Interviews Scheduled', value: '43', change: '+5', positive: true, icon: '📅' },
  { label: 'Hired This Month', value: '6', change: '-1', positive: false, icon: '✅' },
];

const topRoles = [
  { role: 'Senior Software Engineer', applications: 312, views: 1450 },
  { role: 'Product Manager', applications: 187, views: 890 },
  { role: 'Data Scientist', applications: 156, views: 730 },
  { role: 'DevOps Engineer', applications: 94, views: 560 },
  { role: 'UX Designer', applications: 78, views: 440 },
];

const recentActivity = [
  { id: '1', event: 'New applicant for Senior Software Engineer', time: '2 hours ago', type: 'application' },
  { id: '2', event: 'Interview scheduled with Nina Hoffmann', time: '5 hours ago', type: 'interview' },
  { id: '3', event: 'Carlos Rivera moved to offer stage', time: 'Yesterday', type: 'offer' },
  { id: '4', event: 'Job post "DevOps Engineer" reached 500 views', time: 'Yesterday', type: 'milestone' },
  { id: '5', event: 'Anya Kowalski accepted offer', time: '2 days ago', type: 'hire' },
];

const activityIcons: Record<string, string> = {
  application: '📥',
  interview: '📅',
  offer: '📄',
  milestone: '🏆',
  hire: '🎉',
};

export const TalentInsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | '90d'>('30d');

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="ti-page">
      <Navbar />

      <div className="ti-page__container">
        {/* Header */}
        <div className="ti-page__header">
          <div>
            <h1 className="ti-page__title">Hiring Metrics</h1>
            <p className="ti-page__subtitle">Monitor your hiring pipeline and track performance metrics.</p>
          </div>
          <div className="ti-range-tabs">
            {(['7d', '30d', '90d'] as const).map(r => (
              <button
                key={r}
                className={`ti-range-tab${activeRange === r ? ' ti-range-tab--active' : ''}`}
                onClick={() => setActiveRange(r)}
              >
                {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="ti-stats-grid">
          {statCards.map(card => (
            <div key={card.label} className="ti-stat-card">
              <div className="ti-stat-card__icon">{card.icon}</div>
              <div className="ti-stat-card__value">{card.value}</div>
              <div className="ti-stat-card__label">{card.label}</div>
              <div className={`ti-stat-card__change${card.positive ? ' ti-stat-card__change--up' : ' ti-stat-card__change--down'}`}>
                {card.positive ? '▲' : '▼'} {card.change}
              </div>
            </div>
          ))}
        </div>

        <div className="ti-content-grid">
          {/* Top Roles */}
          <div className="ti-section">
            <h2 className="ti-section__title">Top Performing Job Posts</h2>
            <table className="ti-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Applications</th>
                  <th>Views</th>
                  <th>Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {topRoles.map(row => (
                  <tr key={row.role}>
                    <td className="ti-table__role">{row.role}</td>
                    <td>{row.applications}</td>
                    <td>{row.views}</td>
                    <td>
                      <span className="ti-table__rate">
                        {((row.applications / row.views) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Activity */}
          <div className="ti-section">
            <h2 className="ti-section__title">Recent Activity</h2>
            <div className="ti-activity-list">
              {recentActivity.map(item => (
                <div key={item.id} className="ti-activity-item">
                  <span className="ti-activity-item__icon">{activityIcons[item.type]}</span>
                  <div className="ti-activity-item__content">
                    <div className="ti-activity-item__event">{item.event}</div>
                    <div className="ti-activity-item__time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="ti-section ti-section--full">
          <h2 className="ti-section__title">Hiring Funnel</h2>
          <div className="ti-funnel">
            {[
              { stage: 'Applied', count: 1284, color: 'var(--tech-blue)' },
              { stage: 'Screened', count: 340, color: '#b5ab92' },
              { stage: 'Interview', count: 97, color: '#c2a878' },
              { stage: 'Offer', count: 22, color: '#cbb37e' },
              { stage: 'Hired', count: 6, color: '#c6a15b' },
            ].map((step, _i, arr) => (
              <div key={step.stage} className="ti-funnel__step">
                <div className="ti-funnel__bar-wrap">
                  <div
                    className="ti-funnel__bar"
                    style={{
                      width: `${(step.count / arr[0].count) * 100}%`,
                      background: step.color,
                    }}
                  />
                </div>
                <div className="ti-funnel__label">
                  <span className="ti-funnel__stage">{step.stage}</span>
                  <span className="ti-funnel__count">{step.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
