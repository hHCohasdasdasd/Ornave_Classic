import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import './NetworkPage.css';

export const TotalConnectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [connections] = useState([
    {
      id: 'c1',
      name: 'Ashik V Yaghu',
      title: 'UI/UX Designer',
      connectedSince: 'Jan 2026',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    },
    {
      id: 'c2',
      name: 'Sarah Johnson',
      title: 'Product Manager',
      connectedSince: 'Mar 2026',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
      id: 'c3',
      name: 'Julian Vogt',
      title: 'Full Stack Engineer',
      connectedSince: 'Apr 2026',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
    },
    {
      id: 'c4',
      name: 'Emma Wilson',
      title: 'Growth Specialist',
      connectedSince: 'Feb 2026',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop'
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
                <h2>Total Connections</h2>
                <span className="network-stat__value">127 Total</span>
              </div>

              <div className="invite-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {connections.map(conn => (
                  <div key={conn.id} className="invite-card">
                    <div 
                      className="invite-card__avatar"
                      style={{ backgroundImage: `url(${conn.avatarUrl})`, backgroundSize: 'cover', color: 'transparent' }}
                    >
                      {conn.name[0]}
                    </div>
                    <div className="invite-card__content">
                      <h3 className="invite-card__name">{conn.name}</h3>
                      <p className="invite-card__headline">{conn.title}</p>
                      <p className="invite-card__mutual">
                        <span className="tech-label">Connected:</span> {conn.connectedSince}
                      </p>
                      <div className="invite-card__actions">
                        <button className="btn-accept" style={{ padding: '6px 12px' }} onClick={() => navigate(`/messages`)}>
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {connections.length === 0 && (
                <div className="catchup-empty">
                  <div className="catchup-empty__icon">👥</div>
                  <h3>No Connections Yet</h3>
                  <p>Start growing your network to see people here.</p>
                  <button className="btn-accept" onClick={() => navigate('/network')} style={{ maxWidth: '200px', margin: '0 auto' }}>
                    Grow Network
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
