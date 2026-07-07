import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import './NetworkPage.css';

export const InvitesSentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invites] = useState([
    {
      id: 's1',
      name: 'Michael Huther',
      title: 'Director, IW Köln',
      status: 'Pending',
      sentAt: '2 days ago',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
    },
    {
      id: 's2',
      name: 'Andrea García Barea',
      title: 'Product Manager',
      status: 'Pending',
      sentAt: '5 hours ago',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop'
    },
    {
      id: 's3',
      name: 'Lisa Chen',
      title: 'AI/ML Engineer',
      status: 'Pending',
      sentAt: '1 week ago',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
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
                <h2>Invitations Sent</h2>
                <span className="network-stat__value">{invites.length} Outbound</span>
              </div>

              <div className="invite-cards">
                {invites.map(invite => (
                  <div key={invite.id} className="invite-card">
                    <div 
                      className="invite-card__avatar"
                      style={{ backgroundImage: `url(${invite.avatarUrl})`, backgroundSize: 'cover', color: 'transparent' }}
                    >
                      {invite.name[0]}
                    </div>
                    <div className="invite-card__content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 className="invite-card__name">{invite.name}</h3>
                          <p className="invite-card__headline">{invite.title}</p>
                          <p className="invite-card__mutual">
                            <span className="tech-label">Sent:</span> {invite.sentAt}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          background: 'rgba(246, 243, 237, 0.05)',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          color: 'var(--tech-blue)',
                          border: '1px solid var(--tech-border-dim)'
                        }}>
                          {invite.status}
                        </span>
                      </div>
                      <div className="invite-card__actions">
                        <button className="btn-ignore" style={{ flex: 'none', width: 'auto' }}>
                          Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {invites.length === 0 && (
                <div className="catchup-empty">
                  <div className="catchup-empty__icon">📨</div>
                  <h3>No Sent Invitations</h3>
                  <p>When you request to connect with someone, it will appear here.</p>
                  <button className="btn-accept" onClick={() => navigate('/network')} style={{ maxWidth: '200px', margin: '0 auto' }}>
                    Find People
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
