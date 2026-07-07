import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import './NetworkPage.css';

export const FollowingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [following] = useState([
    {
      id: 'f1',
      name: 'EcoStream Solutions',
      type: 'Company',
      industry: 'Environmental Services',
      avatarUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&h=100&fit=crop'
    },
    {
      id: 'f2',
      name: 'NovaTech Robotics',
      type: 'Company',
      industry: 'Manufacturing',
      avatarUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop'
    },
    {
      id: 'f3',
      name: 'Robert Habeck',
      type: 'Person',
      industry: 'Government',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
    },
    {
      id: 'f4',
      name: 'Azure Health Systems',
      type: 'Company',
      industry: 'Healthcare',
      avatarUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=100&h=100&fit=crop'
    }
  ]);

  return (
    <>
      <Navbar />
      <div className="network-page">
        <div className="network-page__container" style={{ gridTemplateColumns: '1fr' }}>
          <main className="network-main">
            <header className="network-section__header" style={{ borderBottom: 'none', marginBottom: '8px' }}>
              <button className="network-section__link" onClick={() => navigate('/network')} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ← Back to Network
              </button>
            </header>
            
            <section className="network-section">
              <div className="network-section__header">
                <h2>Following</h2>
                <span className="network-stat__value">7 Subscriptions</span>
              </div>

              <div className="suggestion-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {following.map(item => (
                  <div key={item.id} className="suggestion-card">
                    <div 
                      className="suggestion-card__avatar"
                      style={{ backgroundImage: `url(${item.avatarUrl})`, backgroundSize: 'cover', color: 'transparent', borderRadius: item.type === 'Company' ? '12px' : '50%' }}
                    >
                      {item.name[0]}
                    </div>
                    <h3 className="suggestion-card__name">{item.name}</h3>
                    <p className="suggestion-card__headline">{item.industry}</p>
                    <p className="suggestion-card__mutual">
                      <span className="tech-label">{item.type}</span>
                    </p>
                    <button className="suggestion-card__connect connected" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                      Following
                    </button>
                  </div>
                ))}
              </div>

              {following.length === 0 && (
                <div className="catchup-empty">
                  <div className="catchup-empty__icon">🔔</div>
                  <h3>Not Following Anyone</h3>
                  <p>Follow companies and leaders to stay updated with their latest activities.</p>
                  <button className="btn-accept" onClick={() => navigate('/firms')} style={{ maxWidth: '200px', margin: '0 auto' }}>
                    Discover Firms
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
};
