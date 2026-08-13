import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { networkService } from '@/services/networkService';
import { UserProfile } from '@/types/discovery';
import './WorkSuite.css';

const getInitials = (firstName: string, lastName: string) => `${firstName[0] || ''}${lastName[0] || ''}`;

export const WorkSuiteConnectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [connections, setConnections] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isGuest) return;
    setIsLoading(true);
    networkService.getRecentConnections()
      .then(setConnections)
      .finally(() => setIsLoading(false));
  }, [isGuest]);

  const viewProfile = (person: UserProfile) => {
    navigate(`/profile?view=${person.firstName.toLowerCase()}-${person.lastName.toLowerCase()}`);
  };

  const message = (person: UserProfile) => {
    navigate(`/messages?to=${person.id}`);
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? connections.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || (c.headline || '').toLowerCase().includes(q)
      )
    : connections;

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Connections</h1>
          <p className="worksuite-page__subtitle">Your network — the people you're connected with on Ornave.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-page__header-row">
          <input
            className="worksuite-select"
            style={{ minWidth: '240px' }}
            placeholder="Search connections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="files-storage-total">
            {connections.length} connection{connections.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="worksuite-grid">
          {isLoading ? (
            <div className="worksuite-empty">Loading connections…</div>
          ) : filtered.length === 0 ? (
            <div className="worksuite-empty worksuite-empty--goals">
              <div className="worksuite-empty__icon">🤝</div>
              <p>{search ? 'No connections match your search.' : "You haven't connected with anyone yet."}</p>
              {!search && <button className="worksuite-create-btn" onClick={() => navigate('/network')}>Find People</button>}
            </div>
          ) : (
            filtered.map((person) => (
              <div key={person.id} className="worksuite-card">
                <div className="worksuite-card__header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      className="worksuite-connection-avatar"
                      onClick={() => viewProfile(person)}
                      style={person.profilePicture ? { backgroundImage: `url(${person.profilePicture})` } : undefined}
                    >
                      {!person.profilePicture && getInitials(person.firstName, person.lastName)}
                    </div>
                    <div>
                      <div className="worksuite-card__title" style={{ cursor: 'pointer' }} onClick={() => viewProfile(person)}>
                        {person.firstName} {person.lastName}
                      </div>
                      {person.headline && <div className="worksuite-card__meta">{person.headline}</div>}
                    </div>
                  </div>
                </div>
                <div className="worksuite-card__actions">
                  <button className="worksuite-btn" onClick={() => message(person)}>Message</button>
                  <button className="worksuite-btn" onClick={() => viewProfile(person)}>View Profile</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
