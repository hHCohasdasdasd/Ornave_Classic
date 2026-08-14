import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { networkService } from '@/services/networkService';
import { FirmConnection, UserProfile } from '@/types/discovery';
import './WorkSuite.css';

const getInitials = (firstName: string, lastName: string) => `${firstName[0] || ''}${lastName[0] || ''}`;

type ConnectionKind = 'people' | 'firms';

export const WorkSuiteConnectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [kind, setKind] = useState<ConnectionKind>('people');
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [firms, setFirms] = useState<FirmConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isGuest) return;
    setIsLoading(true);
    Promise.all([networkService.getRecentConnections(), networkService.getFirmConnections()])
      .then(([p, f]) => { setPeople(p); setFirms(f); })
      .finally(() => setIsLoading(false));
  }, [isGuest]);

  const viewProfile = (person: UserProfile) => {
    navigate(`/profile?view=${person.firstName.toLowerCase()}-${person.lastName.toLowerCase()}`);
  };

  const viewFirmProfile = (firm: FirmConnection) => {
    navigate(`/profile?view=${firm.id}`);
  };

  const message = (person: UserProfile) => {
    navigate(`/messages?to=${person.id}`);
  };

  const unfollowFirm = async (firm: FirmConnection) => {
    setFirms((prev) => prev.filter((f) => f.id !== firm.id));
    await networkService.unfollowFirmConnection(firm.id);
  };

  const openFirmDetail = (firm: FirmConnection) => {
    navigate(`/work-suite/connections/firms/${firm.id}`);
  };

  const q = search.trim().toLowerCase();
  const filteredPeople = q
    ? people.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || (c.headline || '').toLowerCase().includes(q)
      )
    : people;
  const filteredFirms = q
    ? firms.filter((c) =>
        c.name.toLowerCase().includes(q) || (c.headline || '').toLowerCase().includes(q)
      )
    : firms;

  const count = kind === 'people' ? people.length : firms.length;

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Connections</h1>
          <p className="worksuite-page__subtitle">Your network — the people and firms you're connected with on Ornave.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-tabs">
          <button className={`worksuite-tab${kind === 'people' ? ' worksuite-tab--active' : ''}`} onClick={() => setKind('people')}>
            People
          </button>
          <button className={`worksuite-tab${kind === 'firms' ? ' worksuite-tab--active' : ''}`} onClick={() => setKind('firms')}>
            Firms
          </button>
        </div>

        <div className="worksuite-page__header-row">
          <input
            className="worksuite-select"
            style={{ minWidth: '240px' }}
            placeholder={`Search ${kind}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="files-storage-total">
            {count} {kind === 'people' ? `connection${count === 1 ? '' : 's'}` : `firm${count === 1 ? '' : 's'}`}
          </span>
        </div>

        <div className="worksuite-grid">
          {isLoading ? (
            <div className="worksuite-empty">Loading connections…</div>
          ) : kind === 'people' ? (
            filteredPeople.length === 0 ? (
              <div className="worksuite-empty worksuite-empty--goals">
                <div className="worksuite-empty__icon">🤝</div>
                <p>{search ? 'No connections match your search.' : "You haven't connected with anyone yet."}</p>
                {!search && <button className="worksuite-create-btn" onClick={() => navigate('/network')}>Find People</button>}
              </div>
            ) : (
              filteredPeople.map((person) => (
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
            )
          ) : filteredFirms.length === 0 ? (
            <div className="worksuite-empty worksuite-empty--goals">
              <div className="worksuite-empty__icon">🏢</div>
              <p>{search ? 'No firms match your search.' : "You aren't connected with any firms yet."}</p>
              {!search && <button className="worksuite-create-btn" onClick={() => navigate('/firms')}>Find Firms</button>}
            </div>
          ) : (
            filteredFirms.map((firm) => (
              <div key={firm.id} className="worksuite-card">
                <div className="worksuite-card__header">
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => openFirmDetail(firm)}
                  >
                    <div className="worksuite-connection-avatar worksuite-connection-avatar--square">
                      🏢
                    </div>
                    <div>
                      <div className="worksuite-card__title">{firm.name}</div>
                      {firm.headline && <div className="worksuite-card__meta">{firm.headline}</div>}
                      {firm.location && <div className="worksuite-card__meta">{firm.location}</div>}
                    </div>
                  </div>
                </div>
                <div className="worksuite-card__actions">
                  <button className="worksuite-btn" onClick={() => openFirmDetail(firm)}>Open</button>
                  <button className="worksuite-btn" onClick={() => viewFirmProfile(firm)}>View Profile</button>
                  <button className="worksuite-btn worksuite-btn--danger" onClick={() => unfollowFirm(firm)}>Unfollow</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
