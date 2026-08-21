import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirmService, FirmTeamMember, FirmJob, FirmLocation, FirmInsightsData, FirmPortfolioItem, FirmResource, FirmSubscription, FirmMenuItem, FirmPropertyListing, FirmFloorPlan as FirmFloorPlanData } from '@/types/firm';
import { storeService, Product } from '@/services/storeService';
import { firmService } from '@/services/firmService';
import { workSuiteService, AutoCheckInEligibility } from '@/services/workSuiteService';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

// Team member avatars are either an emoji placeholder ('👤') or a real photo
// URL — render whichever was given.
const AvatarContent: React.FC<{ avatar: string; name: string }> = ({ avatar, name }) => (
  /^https?:\/\//.test(avatar) ? (
    <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
  ) : (
    <>{avatar}</>
  )
);

// Firm About Section
export const FirmAbout: React.FC<{ bio: string; industry?: string }> = ({ bio, industry }) => {
  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">About</h2>
      </div>
      <div className="profile-section__content">
        {industry && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--tech-accent-gold-text)', border: '1px solid rgba(198, 161, 91, 0.35)',
            borderRadius: '999px', padding: '5px 12px', marginBottom: '16px',
          }}>
            {industry}
          </div>
        )}
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--tech-text-dim)' }}>
          {bio || 'No description provided.'}
        </p>
      </div>
    </section>
  );
};

// Firm Services Section
export const FirmServices: React.FC<{ services: FirmService[], isProminent?: boolean }> = ({ services, isProminent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!services || services.length === 0) return null;

  return (
    <>
      <section className="profile-section">
        <div className="profile-section__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 className="profile-section__title">{isProminent ? 'Featured Services' : 'Services'}</h2>
            {isProminent && (
              <button 
                onClick={() => setIsExpanded(true)}
                style={{ 
                  background: 'rgba(231, 223, 201, 0.1)', 
                  border: '1px solid var(--tech-blue)', 
                  borderRadius: '2px', 
                  padding: '4px 8px', 
                  fontSize: '10px', 
                  fontWeight: 800, 
                  cursor: 'pointer',
                  color: 'var(--tech-blue)',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                EXPAND_MODULE ↗
              </button>
            )}
          </div>
          {isProminent && <span className="profile-section__badge" style={{ background: 'var(--color-primary)', color: '#14140f' }}>MARKETPLACE</span>}
        </div>
        <div className={isProminent ? "profile-section__grid" : "profile-section__items"} style={isProminent ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '16px'
        } : {}}>
          {services.map((service, index) => (
            <div key={index} className={isProminent ? "service-card--prominent card--hover" : "profile-section__item"} style={isProminent ? {
              background: 'rgba(246, 243, 237, 0.02)',
              border: '1px solid var(--tech-border)',
              borderRadius: '0px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            } : {}}>
              <div className="profile-item__icon" style={isProminent ? { 
                fontSize: '24px', 
                background: 'var(--color-bg)', 
                width: '50px', 
                height: '50px', 
                border: '1px solid var(--tech-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
                clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)'
              } : {}}>
                {index % 3 === 0 ? '📊' : index % 3 === 1 ? '🚀' : '🛡️'}
              </div>
              <div className="profile-item__content" style={{ position: 'relative', zIndex: 1 }}>
                <h3 className="profile-item__title" style={isProminent ? { fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: 'var(--color-text)', textTransform: 'uppercase' } : {}}>{service.title}</h3>
                <p className="profile-item__description" style={isProminent ? { fontSize: '0.85rem', color: 'var(--tech-text-dim)', lineHeight: '1.6' } : {}}>{service.description}</p>
                {isProminent && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button style={{
                      background: 'var(--color-primary)',
                      color: '#14140f',
                      border: 'none',
                      padding: '10px 20px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      flex: 1,
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      ENQUIRE_NOW
                    </button>
                    <button 
                      onClick={() => setIsExpanded(true)}
                      style={{
                        background: 'transparent',
                        color: 'var(--tech-blue)',
                        border: '1px solid var(--tech-blue)',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span>🔍</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Expanded View Modal */}
      {isExpanded && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          overflowY: 'auto',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--tech-border)',
            padding: '40px',
            position: 'relative'
          }}>
            <div className="tech-scan-line"></div>
            <button 
              onClick={() => setIsExpanded(false)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'rgba(231, 223, 201, 0.1)',
                border: '1px solid var(--tech-blue)',
                color: 'var(--tech-blue)',
                width: '48px',
                height: '48px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>
            
            <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--tech-border-dim)', paddingBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ background: 'var(--color-primary)', color: '#14140f', padding: '4px 12px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>MODULE_CATALOG</span>
              </div>
              <h1 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase' }}>Comprehensive_Services</h1>
              <p style={{ color: 'var(--tech-text-dim)', margin: 0, fontSize: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>SCANNING_CAPABILITIES // UPLINK_READY</p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '32px' 
            }}>
              {services.map((service, index) => (
                <div key={index} style={{ 
                  backgroundColor: 'rgba(246, 243, 237, 0.02)',
                  padding: '32px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: '1px solid var(--tech-border)',
                  position: 'relative'
                }}>
                  <div className="tech-corner-top-right" style={{ width: '20px', height: '20px' }}></div>
                  <div style={{ 
                    fontSize: '32px', 
                    marginBottom: '24px',
                    background: 'var(--color-bg)',
                    width: '70px',
                    height: '70px',
                    border: '1px solid var(--tech-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)'
                  }}>
                    {index % 3 === 0 ? '📊' : index % 3 === 1 ? '🚀' : '🛡️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.4rem', margin: '0 0 16px 0', color: 'var(--color-text)', fontWeight: 800, textTransform: 'uppercase' }}>{service.title}</h2>
                    <p style={{ fontSize: '0.95rem', color: 'var(--tech-text-dim)', lineHeight: '1.7', marginBottom: '24px' }}>
                      {service.description}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                      {['Premium quality', 'Expert consulting', '24/7 support'].map((feature, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--tech-text-dim)' }}>
                          <span style={{ color: 'var(--tech-blue)', fontWeight: 700 }}>✓</span> {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', borderTop: '1px solid var(--tech-border-dim)', paddingTop: '24px' }}>
                    <button 
                      style={{ 
                        flex: 1,
                        background: 'var(--color-primary)',
                        color: '#14140f',
                        border: 'none',
                        padding: '14px 24px', 
                        fontSize: '14px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}
                    >
                      INITIALIZE
                    </button>
                    <button 
                      style={{ 
                        background: 'transparent',
                        color: 'var(--tech-blue)',
                        border: '1px solid var(--tech-blue)',
                        padding: '14px', 
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}
                    >
                      DETAILS
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '60px', textAlign: 'center', background: 'rgba(231, 223, 201, 0.03)', padding: '40px', border: '1px dashed var(--tech-blue)' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', color: 'var(--color-text)', textTransform: 'uppercase' }}>Ready_to_Initialize_Protocol?</h3>
              <p style={{ color: 'var(--tech-text-dim)', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px', fontFamily: 'JetBrains Mono, monospace' }}>Our units are on standby to optimize your operational efficiency.</p>
              <button style={{ background: 'var(--color-primary)', color: '#14140f', border: 'none', padding: '16px 40px', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                REQUEST_UPLINK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Firm Team Section
export const FirmTeam: React.FC<{ team: FirmTeamMember[] }> = ({ team }) => {
  if (!team || team.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Key People</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>
        {team.map((person, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(246, 243, 237, 0.02)', borderRadius: '0px', border: '1px solid var(--tech-border)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '0', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid var(--tech-blue)', clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)', overflow: 'hidden' }}>
              <AvatarContent avatar={person.avatar} name={person.name} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{person.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--tech-text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>{person.role}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Firm Jobs Section
export const FirmJobs: React.FC<{ jobs: FirmJob[] }> = ({ jobs }) => {
  const navigate = useNavigate();
  if (!jobs || jobs.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Open Opportunities</h2>
        <button className="profile-section__action-btn" onClick={() => navigate('/jobs')} style={{ background: 'var(--color-primary)', color: '#14140f', fontWeight: 800 }}>VIEW_ALL_JOBS</button>
      </div>
      <div className="profile-section__items">
        {jobs.map((job, index) => (
          <div key={index} className="profile-section__item" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: 'rgba(246, 243, 237, 0.02)', border: '1px solid var(--tech-border)', borderRadius: '0', padding: '16px', marginBottom: '12px' }}>
            <div className="profile-item__icon" style={{ position: 'static', flexShrink: 0, background: 'var(--color-bg)', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}>💼</div>
            <div className="profile-item__content" style={{ flex: '1 1 200px', minWidth: 0 }}>
              <h3 className="profile-item__title" style={{ color: 'var(--color-text)', fontSize: '1rem', textTransform: 'uppercase' }}>{job.title}</h3>
              <p className="profile-item__subtitle" style={{ color: 'var(--tech-text-dim)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>{job.location} • {job.type}</p>
            </div>
            <button className="btn-sm-primary" style={{ flexShrink: 0, background: 'transparent', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}>APPLY_MODULE</button>
          </div>
        ))}
      </div>
    </section>
  );
};

// Firm Locations Section
export const FirmLocations: React.FC<{ locations: FirmLocation[] }> = ({ locations }) => {
  if (!locations || locations.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Global Infrastructure</h2>
      </div>
      <div className="profile-section__items">
        {locations.map((loc, index) => (
          <div key={index} className="profile-section__item" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(246, 243, 237, 0.02)', border: '1px solid var(--tech-border)', borderRadius: '0', padding: '16px', marginBottom: '12px' }}>
            <div className="profile-item__icon" style={{ position: 'static', flexShrink: 0, background: 'var(--color-bg)', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}>📍</div>
            <div className="profile-item__content" style={{ minWidth: 0 }}>
              <h3 className="profile-item__title" style={{ color: 'var(--color-text)', fontSize: '1rem', textTransform: 'uppercase' }}>{loc.city} ({loc.type})</h3>
              <p className="profile-item__description" style={{ color: 'var(--tech-text-dim)', fontSize: '0.85rem' }}>{loc.address}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Firm Insights Section
export const FirmInsights: React.FC<{ insights: FirmInsightsData }> = ({ insights }) => {
  if (!insights) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Firm Analytics</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '12px' }}>
        <div style={{ padding: '20px', background: 'rgba(231, 223, 201, 0.05)', border: '1px solid var(--tech-border)', position: 'relative' }}>
          <div className="tech-corner-top-right" style={{ width: '8px', height: '8px' }}></div>
          <div style={{ fontSize: '10px', color: 'var(--tech-blue)', fontWeight: 800, marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}>EMPLOYEE_GROWTH</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)' }}>{insights.employeeGrowth} <span style={{ fontSize: '12px', color: '#8ba378', fontWeight: 800 }}>+ TRENDING</span></div>
        </div>
        <div style={{ padding: '20px', background: 'rgba(231, 223, 201, 0.05)', border: '1px solid var(--tech-border)', position: 'relative' }}>
          <div className="tech-corner-top-right" style={{ width: '8px', height: '8px' }}></div>
          <div style={{ fontSize: '10px', color: 'var(--tech-blue)', fontWeight: 800, marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}>AVG_TENURE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)' }}>{insights.avgTenure}</div>
        </div>
      </div>
    </section>
  );
};

// Firm Network Visualization Section
export const FirmNetwork: React.FC<{ team: FirmTeamMember[], firmName: string }> = ({ team, firmName }) => {
  const navigate = useNavigate();
  if (!team || team.length === 0) return null;

  // Determine node size based on role — sized generously enough that a
  // two-line name plus a one-line truncated role actually fits inside the
  // circle instead of spilling out past its edge.
  const getNodeSize = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes('CEO')) return 104;
    if (r.includes('CFO') || r.includes('CHRO') || r.includes('CTO') || r.includes('COO')) return 94;
    if (r.includes('EXECUTIVE') || r.includes('DIRECTOR')) return 88;
    return 82;
  };

  // Color mapping for roles
  // These render as small text/dot labels directly on a white card (see
  // below), so each needs to hold ~4.5:1 contrast on its own rather than
  // relying on a dark backdrop — plain hue swatches fail that badly.
  const getRoleColor = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes('CEO')) return '#7d6329';
    if (r.includes('FINANCE') || r.includes('CFO')) return '#4f6b3f';
    if (r.includes('HUMAN') || r.includes('CHRO')) return '#5f5646';
    if (r.includes('TECH') || r.includes('CTO')) return '#4f5f68';
    return '#756c5d';
  };

  // First ring: leadership, positioned radially around the hub. Second ring:
  // each leader's own direct reports, fanned out further along roughly the
  // same angle from the hub so their team reads as branching off of them,
  // not off the company.
  const RADIUS_L1 = 220;
  const RADIUS_L2 = 130;
  const SIZE_L2 = 66;
  const hasAnyReports = team.some((p) => p.directReports && p.directReports.length > 0);
  const containerHeight = hasAnyReports ? 700 : 540;

  type Placed = { person: FirmTeamMember; x: number; y: number; size: number; color: string; fromX: number; fromY: number };
  const placed: Placed[] = [];

  team.forEach((person, index) => {
    const angle = (index * (360 / team.length) - 90) * (Math.PI / 180);
    const x = Math.cos(angle) * RADIUS_L1;
    const y = Math.sin(angle) * RADIUS_L1;
    placed.push({ person, x, y, size: getNodeSize(person.role), color: getRoleColor(person.role), fromX: 0, fromY: 0 });

    const reports = person.directReports || [];
    reports.forEach((report, rIndex) => {
      const spread = 55 * (Math.PI / 180); // degrees between siblings, in radians
      const childAngle = angle + (rIndex - (reports.length - 1) / 2) * spread;
      const rx = x + Math.cos(childAngle) * RADIUS_L2;
      const ry = y + Math.sin(childAngle) * RADIUS_L2;
      placed.push({ person: report, x: rx, y: ry, size: SIZE_L2, color: getRoleColor(report.role), fromX: x, fromY: y });
    });
  });

  return (
    <section className="profile-section" style={{ overflow: 'visible' }}>
      <div className="profile-section__header">
        <h2 className="profile-section__title">Company Network</h2>
        <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 500 }}>Interactive Org Chart</span>
      </div>

      <div className="firm-network-container enhanced-network" style={{
        position: 'relative',
        height: `${containerHeight}px`,
        background: 'var(--color-bg)',
        borderRadius: '20px',
        marginTop: '16px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.15)'
      }}>
        {/* Background Grid Decoration */}
        <div className="network-grid-overlay"></div>

        {/* Ambient Glows */}
        <div className="ambient-glow glow-1"></div>
        <div className="ambient-glow glow-2"></div>

        {/* Central Hub (Firm) */}
        <div className="network-node central-hub" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '120px',
          height: '120px',
          background: 'var(--color-card)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid var(--tech-accent-gold)',
          boxShadow: '0 0 30px rgba(198, 161, 91, 0.25), 0 10px 25px rgba(0,0,0,0.4)',
          zIndex: 20
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '2px' }}>🏢</div>
            <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '14px', lineHeight: '1.2' }}>{firmName}</div>
          </div>
        </div>

        {/* Connecting Lines — plain pixel math (not %) so they line up exactly
           with the bubbles below, which are also positioned in pixels. Mixing
           the two broke as soon as the container wasn't perfectly square.
           Each line runs from its node's parent (the hub for leadership,
           or the leader's own bubble for their direct reports). */}
        {placed.map((p, index) => {
          const dx = p.x - p.fromX;
          const dy = p.y - p.fromY;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `calc(50% + ${p.fromX}px)`,
                top: `calc(50% + ${p.fromY}px)`,
                width: `${length}px`,
                height: '2px',
                background: 'linear-gradient(90deg, rgba(198, 161, 91, 0.45), rgba(231, 223, 201, 0.08))',
                transformOrigin: '0 50%',
                transform: `rotate(${angleDeg}deg)`,
                zIndex: 5,
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {/* Team Bubbles */}
        {placed.map((p, index) => {
          const { person, x, y, size, color } = p;
          return (
            <div
              key={index}
              className="network-node person-bubble"
              onClick={() => person.profileSlug && navigate(`/profile?view=${person.profileSlug}`)}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                width: `${size}px`,
                height: `${size}px`,
                background: 'var(--color-card)',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 15,
                padding: '8px',
                border: `1.5px solid rgba(246, 243, 237, 0.12)`,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: person.profileSlug ? 'pointer' : 'default',
                overflow: 'hidden'
              }}
              title={`${person.name} — ${person.role}`}
            >
              <div className="bubble-avatar-wrapper" style={{
                width: size >= 90 ? '32px' : '26px',
                height: size >= 90 ? '32px' : '26px',
                background: `${color}15`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                marginBottom: '4px',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <AvatarContent avatar={person.avatar} name={person.name} />
              </div>
              <div style={{
                fontSize: size >= 90 ? '11px' : '10px',
                fontWeight: 800,
                textAlign: 'center',
                color: 'var(--color-text)',
                lineHeight: '1.15',
                marginBottom: '2px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {person.name}
              </div>
              <div style={{
                fontSize: '8px',
                color: color,
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                maxWidth: 'calc(100% - 4px)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {person.role}
              </div>

              {/* Role-specific decorative dot */}
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: color,
                border: '2px solid var(--color-card)'
              }}></div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
export const FirmStore: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await storeService.getCompanyProducts(companyId);
        setProducts(data);
      } catch (error) {
        console.error('Failed to load firm products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [companyId]);

  if (isLoading) return <div className="profile-section">Loading store...</div>;
  if (products.length === 0) return null;

  return (
    <>
      <section className="profile-section">
        <div className="profile-section__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 className="profile-section__title">Store</h2>
            <button 
              onClick={() => setIsExpanded(true)}
              style={{ 
                background: 'rgba(231, 223, 201, 0.1)', 
                border: '1px solid var(--tech-blue)', 
                borderRadius: '0px', 
                padding: '4px 8px', 
                fontSize: '10px', 
                fontWeight: 800, 
                cursor: 'pointer',
                color: 'var(--tech-blue)',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            >
              EXPAND_VIEW ↗
            </button>
          </div>
          <button 
            className="profile-section__action-btn" 
            onClick={() => navigate(`/manage-store`)}
            style={{ 
              display: user?.userType === 'COMPANY_USER' && user?.id === companyId ? 'block' : 'none',
              background: 'var(--color-primary)',
              color: '#14140f',
              fontWeight: 800
            }}
          >
            MANAGE_STORE
          </button>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
          gap: '16px', 
          marginTop: '12px' 
        }}>
          {products.slice(0, 3).map(product => (
            <div key={product.id} style={{ 
              padding: '12px', 
              background: 'rgba(246, 243, 237, 0.02)', 
              border: '1px solid var(--tech-border)',
              position: 'relative'
            }}>
              <div className="tech-corner-top-right" style={{ width: '10px', height: '10px' }}></div>
              {product.imageUrl && (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '0px', marginBottom: '8px', border: '1px solid var(--tech-border-dim)' }} 
                />
              )}
              <h3 style={{ fontSize: '13px', margin: '0 0 4px 0', color: 'var(--color-text)', textTransform: 'uppercase' }}>{product.name}</h3>
              <p style={{ fontSize: '11px', color: 'var(--tech-text-dim)', margin: '0 0 8px 0', height: '32px', overflow: 'hidden' }}>
                {product.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: 'var(--tech-blue)', fontSize: '14px' }}>${product.price.toFixed(2)}</span>
                <button 
                  style={{ 
                    padding: '4px 10px', 
                    fontSize: '10px', 
                    background: 'transparent', 
                    border: '1px solid var(--tech-blue)', 
                    color: 'var(--tech-blue)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                  onClick={() => navigate(`/store`)}
                >
                  VIEW_ITEM
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Expanded View Modal */}
      {isExpanded && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          overflowY: 'auto',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--tech-border)',
            padding: '40px',
            position: 'relative'
          }}>
            <div className="tech-scan-line"></div>
            <button 
              onClick={() => setIsExpanded(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(231, 223, 201, 0.1)',
                border: '1px solid var(--tech-blue)',
                color: 'var(--tech-blue)',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>
            
            <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--tech-border-dim)', paddingBottom: '20px' }}>
              <h1 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '2px' }}>Inventory_Core_Access</h1>
              <p style={{ color: 'var(--tech-text-dim)', margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem' }}>LINK_ESTABLISHED // SCANNING_CATALOG...</p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '24px' 
            }}>
              {products.map(product => (
                <div key={product.id} style={{ 
                  background: 'rgba(246, 243, 237, 0.02)', 
                  border: '1px solid var(--tech-border)',
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  <div className="tech-corner-top-right" style={{ width: '15px', height: '15px' }}></div>
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      style={{ width: '100%', height: '200px', objectFit: 'cover', border: '1px solid var(--tech-border-dim)', marginBottom: '20px' }} 
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', color: 'var(--color-text)', textTransform: 'uppercase' }}>{product.name}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--tech-text-dim)', lineHeight: '1.5', marginBottom: '24px' }}>
                      {product.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--tech-border-dim)', paddingTop: '20px' }}>
                    <div>
                      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tech-blue)' }}>${product.price.toFixed(2)}</span>
                      <span style={{ fontSize: '12px', color: 'var(--tech-text-dim)', marginLeft: '8px', fontFamily: 'JetBrains Mono, monospace' }}>USD</span>
                    </div>
                    <button 
                      style={{ 
                        padding: '12px 24px', 
                        fontSize: '13px', 
                        background: 'var(--color-primary)', 
                        color: '#14140f', 
                        border: 'none', 
                        fontWeight: 900,
                        cursor: 'pointer',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}
                      onClick={() => navigate(`/store`)}
                    >
                      ACQUIRE_ASSET
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Firm Portfolio Section
export const FirmPortfolio: React.FC<{ portfolio: FirmPortfolioItem[] }> = ({ portfolio }) => {
  if (!portfolio || portfolio.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Case Studies & Portfolio</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '16px' }}>
        {portfolio.map((item, index) => (
          <div key={index} style={{ background: 'rgba(246, 243, 237, 0.02)', border: '1px solid var(--tech-border)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="tech-corner-top-right" style={{ width: '12px', height: '12px' }}></div>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover', opacity: 0.8, borderBottom: '1px solid var(--tech-border-dim)' }} />
            )}
            <div style={{ padding: '24px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--tech-blue)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{item.category}</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '12px 0', color: 'var(--color-text)', textTransform: 'uppercase' }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--tech-text-dim)', lineHeight: '1.6', marginBottom: '20px' }}>{item.description}</p>
              {item.result && (
                <div style={{ background: 'rgba(139, 163, 120, 0.08)', padding: '16px', borderLeft: '3px solid #8ba378' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#8ba378', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>OUTCOME_REPORT</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 600 }}>{item.result}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Firm Resources Section
export const FirmResources: React.FC<{ resources: FirmResource[] }> = ({ resources }) => {
  if (!resources || resources.length === 0) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WHITEPAPER': return '📄';
      case 'CATALOG': return '📖';
      case 'CASE_STUDY': return '🧪';
      case 'TECHNICAL': return '⚙️';
      default: return '📁';
    }
  };

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Resource Library</h2>
      </div>
      <div className="profile-section__items">
        {resources.map((resource, index) => (
          <div key={index} className="profile-section__item" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(246, 243, 237, 0.02)', border: '1px solid var(--tech-border)', padding: '16px', marginBottom: '12px', borderRadius: '0' }}>
            <div className="profile-item__icon" style={{ position: 'static', flexShrink: 0, fontSize: '24px', background: 'var(--color-bg)', border: '1px solid var(--tech-blue)', width: '50px', height: '50px' }}>
              {getTypeIcon(resource.type)}
            </div>
            <div className="profile-item__content" style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <h3 className="profile-item__title" style={{ color: 'var(--color-text)', fontSize: '1rem', textTransform: 'uppercase' }}>{resource.title}</h3>
                <p className="profile-item__description" style={{ color: 'var(--tech-text-dim)', fontSize: '0.85rem' }}>{resource.description}</p>
              </div>
              <button style={{
                flexShrink: 0,
                background: 'transparent',
                border: '1px solid var(--tech-blue)',
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--tech-blue)',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                DOWNLOAD_FILE ⬇
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Firm Subscriptions Section
export const FirmSubscriptions: React.FC<{ subscriptions: FirmSubscription[] }> = ({ subscriptions }) => {
  if (!subscriptions || subscriptions.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Service Protocols & SLAs</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '16px' }}>
        {subscriptions.map((plan, index) => (
          <div key={index} style={{ 
            padding: '32px', 
            position: 'relative',
            background: plan.isPopular ? 'rgba(231, 223, 201, 0.08)' : 'rgba(246, 243, 237, 0.02)',
            border: plan.isPopular ? '2px solid var(--tech-blue)' : '1px solid var(--tech-border)',
            borderRadius: '14px'
          }}>
            {plan.isPopular && (
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '20px',
                background: 'var(--color-primary)',
                color: '#14140f',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                Most Popular
              </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--tech-blue)' }}>${plan.price}</span>
                <span style={{ color: 'var(--tech-text-dim)', fontSize: '14px', fontFamily: 'JetBrains Mono, monospace' }}>/{plan.interval === 'MONTHLY' ? 'MO' : 'YR'}</span>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
              {plan.features.map((feature: string, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--tech-text-dim)', marginBottom: '14px' }}>
                  <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>[✓]</span> {feature}
                </li>
              ))}
            </ul>
            <button style={{
              width: '100%',
              background: plan.isPopular ? 'var(--tech-blue)' : 'transparent',
              color: plan.isPopular ? '#14140f' : 'var(--tech-blue)',
              border: plan.isPopular ? 'none' : '1px solid var(--tech-blue)',
              padding: '16px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              INITIALIZE_SUBSCRIPTION
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

// Firm Floor Plan Section — the layout built and saved in Work Suite,
// shown read-only. Matches the editor's fixed 1600x1000 logical canvas
// (WorkSuiteFloorPlanPage.tsx) but scales it to fit the profile column via
// a percentage-based/viewBox layout instead of the editor's zoom controls,
// since there's nothing here to zoom or edit.
const FLOOR_PLAN_CANVAS_WIDTH = 1600;
const FLOOR_PLAN_CANVAS_HEIGHT = 1000;

export const FirmFloorPlan: React.FC<{
  floorPlan: FirmFloorPlanData;
  onTableClick?: (table: FirmFloorPlanData['tables'][number]) => void;
}> = ({ floorPlan, onTableClick }) => {
  const { tables, chairs, walls } = floorPlan;
  if (tables.length === 0 && chairs.length === 0 && walls.length === 0) return null;

  const pct = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Floor Plan</h2>
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${FLOOR_PLAN_CANVAS_WIDTH} / ${FLOOR_PLAN_CANVAS_HEIGHT}`,
          marginTop: '16px',
          background: 'var(--tech-bg)',
          border: '1px solid var(--tech-border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox={`0 0 ${FLOOR_PLAN_CANVAS_WIDTH} ${FLOOR_PLAN_CANVAS_HEIGHT}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {walls.map((wall) => {
            if (wall.shape === 'circle') {
              return (
                <circle
                  key={wall.id}
                  cx={wall.x1} cy={wall.y1} r={wall.radius || 0}
                  fill="none" stroke="var(--tech-text-dim)" strokeWidth={4}
                />
              );
            }
            const cx = wall.curveX ?? Math.round((wall.x1 + wall.x2) / 2);
            const cy = wall.curveY ?? Math.round((wall.y1 + wall.y2) / 2);
            return (
              <path
                key={wall.id}
                d={`M ${wall.x1} ${wall.y1} Q ${cx} ${cy} ${wall.x2} ${wall.y2}`}
                fill="none" stroke="var(--tech-text-dim)" strokeWidth={4}
              />
            );
          })}
        </svg>

        {chairs.map((chair) => (
          <div
            key={chair.id}
            title="Chair"
            style={{
              position: 'absolute',
              left: pct(chair.positionX, FLOOR_PLAN_CANVAS_WIDTH),
              top: pct(chair.positionY, FLOOR_PLAN_CANVAS_HEIGHT),
              width: pct(28, FLOOR_PLAN_CANVAS_WIDTH),
              height: pct(28, FLOOR_PLAN_CANVAS_HEIGHT),
              borderRadius: '6px',
              border: '2px solid #7a8fb0',
              background: 'var(--tech-card-bg)',
            }}
          />
        ))}

        {tables.map((table) => (
          <div
            key={table.id}
            title={onTableClick ? `${table.label} — ${table.seats} seats — click to reserve` : `${table.label} — ${table.seats} seats`}
            onClick={onTableClick ? () => onTableClick(table) : undefined}
            style={{
              position: 'absolute',
              left: pct(table.positionX, FLOOR_PLAN_CANVAS_WIDTH),
              top: pct(table.positionY, FLOOR_PLAN_CANVAS_HEIGHT),
              width: pct(table.width, FLOOR_PLAN_CANVAS_WIDTH),
              height: pct(table.height, FLOOR_PLAN_CANVAS_HEIGHT),
              borderRadius: table.shape === 'round' ? '50%' : table.shape === 'half-circle' ? '999px 999px 6px 6px' : '10px',
              border: '2px solid #4f9d5c',
              background: 'rgba(79, 157, 92, 0.28)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              textAlign: 'center',
              padding: '2px',
              overflow: 'hidden',
              cursor: onTableClick ? 'pointer' : 'default',
              transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
              boxShadow: onTableClick ? 'var(--shadow-card)' : undefined,
            }}
            onMouseEnter={onTableClick ? (e) => { e.currentTarget.style.borderColor = 'var(--tech-accent-gold)'; } : undefined}
            onMouseLeave={onTableClick ? (e) => { e.currentTarget.style.borderColor = '#4f9d5c'; } : undefined}
          >
            {table.label}
          </div>
        ))}
      </div>
    </section>
  );
};

// A reservation "occupies" its table for this long — must match the
// backend's RESERVATION_BUFFER_MINUTES (workSuiteService.ts) so a slot the
// UI shows as open never actually gets rejected as a conflict on submit.
const RESERVATION_BUFFER_MINUTES = 90;
const RESERVATION_SLOT_START_MINUTES = 11 * 60; // 11:00
const RESERVATION_SLOT_END_MINUTES = 22 * 60; // 22:00
const RESERVATION_SLOT_STEP_MINUTES = 30;

const formatSlotLabel = (minutesFromMidnight: number) => {
  const h24 = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
};

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

// Firm Reservations — wraps the read-only FirmFloorPlan with a booking flow
// for logged-in personal users: click a table, pick a date/time slot (taken
// slots for that table are greyed out), confirm. Company accounts and
// guests just see the plain read-only floor plan, no booking UI.
export const FirmReservations: React.FC<{ companyId: string; floorPlan: FirmFloorPlanData }> = ({ companyId, floorPlan }) => {
  const { user } = useAuth();
  // Personal users and other companies can both book a table — a company
  // just can't book its own restaurant's tables.
  const canReserve = !!user && user.id !== 'guest' && user.companyId !== companyId;

  const [selectedTable, setSelectedTable] = useState<FirmFloorPlanData['tables'][number] | null>(null);
  const [date, setDate] = useState(todayIsoDate());
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [note, setNote] = useState('');
  const [takenTimes, setTakenTimes] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Confirmation now lives in the booker's notifications + Work Suite
  // calendar (not on this public profile) — this is just a brief
  // in-the-moment acknowledgment that the booking went through.
  const [justBookedTable, setJustBookedTable] = useState<string | null>(null);

  // Automatic Check-In — offered right at booking time as well as later
  // from the calendar entry. Eligibility doesn't depend on which table/time
  // is picked, so it's fetched once per mount rather than per table-open.
  const [eligibility, setEligibility] = useState<AutoCheckInEligibility | null>(null);
  const [autoCheckIn, setAutoCheckIn] = useState(false);

  useEffect(() => {
    if (!canReserve) return;
    workSuiteService.getAutoCheckInEligibility().then(setEligibility).catch(() => {});
  }, [canReserve]);

  const openTable = async (table: FirmFloorPlanData['tables'][number]) => {
    if (!canReserve) return;
    setSelectedTable(table);
    setDate(todayIsoDate());
    setTime('');
    setPartySize(2);
    setNote('');
    setAutoCheckIn(false);
    setError(null);
    setIsLoadingSlots(true);
    const slots = await firmService.getTableAvailability(companyId, table.id);
    setTakenTimes(slots.map((s) => s.reservationTime));
    setIsLoadingSlots(false);
  };

  const closeModal = () => setSelectedTable(null);

  // Every 30-min slot from open to close, minus whichever fall within the
  // reservation buffer of an existing booking on the selected date — a
  // client-side mirror of the backend's own conflict window so the picker
  // never offers a time the submit would then reject.
  const slotOptions = React.useMemo(() => {
    if (!date) return [];
    const dayTakenMinutes = takenTimes
      .map((t) => new Date(t))
      .filter((d) => d.toISOString().slice(0, 10) === date || d.toDateString() === new Date(`${date}T00:00:00`).toDateString())
      .map((d) => d.getHours() * 60 + d.getMinutes());

    const options: { minutes: number; label: string; disabled: boolean }[] = [];
    for (let m = RESERVATION_SLOT_START_MINUTES; m <= RESERVATION_SLOT_END_MINUTES; m += RESERVATION_SLOT_STEP_MINUTES) {
      const disabled = dayTakenMinutes.some((taken) => Math.abs(taken - m) < RESERVATION_BUFFER_MINUTES);
      options.push({ minutes: m, label: formatSlotLabel(m), disabled });
    }
    return options;
  }, [date, takenTimes]);

  const handleSubmit = async () => {
    if (!selectedTable || !date || !time) {
      setError('Pick a date and time.');
      return;
    }
    const [hh, mm] = time.split(':').map(Number);
    const reservationDate = new Date(`${date}T00:00:00`);
    reservationDate.setHours(hh, mm, 0, 0);
    if (reservationDate.getTime() < Date.now()) {
      setError('That time has already passed — pick a later slot.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const bookedLabel = selectedTable.label;
      await firmService.reserveTable(companyId, selectedTable.id, {
        reservationTime: reservationDate.toISOString(),
        partySize,
        note: note.trim() || undefined,
        autoCheckIn: eligibility?.eligible ? autoCheckIn : undefined,
      });
      closeModal();
      setJustBookedTable(bookedLabel);
      setTimeout(() => setJustBookedTable(null), 6000);
      // The reservation just created a real notification for this user —
      // tell the navbar to refresh its unread badge now instead of waiting
      // for the next mount/navigation to pick it up.
      window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'table_reservation' } }));
    } catch (err: any) {
      setError(err.message || 'Could not reserve this table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {justBookedTable && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'rgba(79, 157, 92, 0.15)', border: '1px solid #4f9d5c', borderRadius: '8px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
          Reserved {justBookedTable}. Check your notifications and Work Suite calendar for the confirmation.
        </div>
      )}

      <FirmFloorPlan floorPlan={floorPlan} onTableClick={canReserve ? openTable : undefined} />

      {!canReserve && (
        <p style={{ fontSize: '0.8rem', color: 'var(--tech-text-dim)', marginTop: '10px' }}>
          Log in with a personal account to reserve a table.
        </p>
      )}

      {selectedTable && (
        <div
          onClick={closeModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--tech-card-bg)', border: '1px solid var(--tech-border)', borderRadius: '10px', padding: '24px', width: '360px', maxWidth: '90vw' }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)' }}>Reserve {selectedTable.label}</h3>
            <p style={{ margin: '4px 0 16px', fontSize: '0.8rem', color: 'var(--tech-text-dim)' }}>{selectedTable.seats} seats</p>

            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--tech-text-dim)', marginBottom: '4px' }}>Date</label>
            <input
              type="date"
              value={date}
              min={todayIsoDate()}
              onChange={async (e) => {
                setDate(e.target.value);
                setTime('');
              }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginBottom: '14px', background: 'var(--tech-bg)', border: '1px solid var(--tech-border)', borderRadius: '6px', color: 'var(--color-text)' }}
            />

            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--tech-text-dim)', marginBottom: '4px' }}>Time</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={isLoadingSlots}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginBottom: '14px', background: 'var(--tech-bg)', border: '1px solid var(--tech-border)', borderRadius: '6px', color: 'var(--color-text)' }}
            >
              <option value="">{isLoadingSlots ? 'Loading availability…' : 'Select a time'}</option>
              {slotOptions.map((opt) => (
                <option key={opt.minutes} value={`${String(Math.floor(opt.minutes / 60)).padStart(2, '0')}:${String(opt.minutes % 60).padStart(2, '0')}`} disabled={opt.disabled}>
                  {opt.label}{opt.disabled ? ' (booked)' : ''}
                </option>
              ))}
            </select>

            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--tech-text-dim)', marginBottom: '4px' }}>Party size</label>
            <input
              type="number"
              min={1}
              max={20}
              value={partySize}
              onChange={(e) => setPartySize(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginBottom: '14px', background: 'var(--tech-bg)', border: '1px solid var(--tech-border)', borderRadius: '6px', color: 'var(--color-text)' }}
            />

            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--tech-text-dim)', marginBottom: '4px' }}>Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginBottom: '14px', background: 'var(--tech-bg)', border: '1px solid var(--tech-border)', borderRadius: '6px', color: 'var(--color-text)', resize: 'vertical' }}
            />

            <div style={{ padding: '10px 12px', marginBottom: '14px', background: 'rgba(198, 161, 91, 0.06)', border: '1px solid var(--tech-border)', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: eligibility?.eligible ? 'pointer' : 'default' }}>
                <input
                  type="checkbox"
                  checked={autoCheckIn}
                  disabled={!eligibility?.eligible}
                  onChange={(e) => setAutoCheckIn(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>Automatic Check-In</span>
              </label>
              {eligibility?.eligible ? (
                <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: 'var(--tech-text-dim)', lineHeight: 1.4 }}>
                  You'll be checked in automatically once your reservation time arrives — no action needed.
                </p>
              ) : eligibility ? (
                <div style={{ marginTop: '6px' }}>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--tech-text-dim)' }}>Not available yet — three requirements gate this, checked in order:</p>
                  <ol style={{ margin: '4px 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <li style={{ fontSize: '0.74rem', ...(eligibility.tierOk ? { color: '#4f9d5c', opacity: 1 } : eligibility.nextStep === 'TIER' ? { color: 'var(--color-text)', fontWeight: 700, opacity: 1 } : { color: 'var(--tech-text-dim)', opacity: 0.55 }) }}>
                      Silver membership or above {eligibility.tierOk ? '✓' : eligibility.nextStep === 'TIER' ? <a href="/profile/edit" style={{ color: 'var(--tech-accent-gold)' }}>— upgrade</a> : null}
                    </li>
                    <li style={{ fontSize: '0.74rem', ...(eligibility.profileComplete ? { color: '#4f9d5c', opacity: 1 } : eligibility.nextStep === 'PROFILE' ? { color: 'var(--color-text)', fontWeight: 700, opacity: 1 } : { color: 'var(--tech-text-dim)', opacity: 0.55 }) }}>
                      Check-In Profile completed {eligibility.profileComplete ? '✓' : eligibility.nextStep === 'PROFILE' ? <a href="/profile/edit" style={{ color: 'var(--tech-accent-gold)' }}>— finish it</a> : null}
                    </li>
                    <li style={{ fontSize: '0.74rem', ...(eligibility.bankVerified ? { color: '#4f9d5c', opacity: 1 } : eligibility.nextStep === 'BANK' ? { color: 'var(--color-text)', fontWeight: 700, opacity: 1 } : { color: 'var(--tech-text-dim)', opacity: 0.55 }) }}>
                      A verified bank account {eligibility.bankVerified ? '✓' : eligibility.nextStep === 'BANK' ? <a href="/work-suite/finance" style={{ color: 'var(--tech-accent-gold)' }}>— link & verify one</a> : null}
                    </li>
                  </ol>
                </div>
              ) : null}
            </div>

            {error && <p style={{ color: '#c25b52', fontSize: '0.8rem', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ background: 'none', border: '1px solid var(--tech-border-dim)', borderRadius: '6px', color: 'var(--tech-text-dim)', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !time}
                style={{ background: 'var(--tech-accent-gold)', border: 'none', borderRadius: '6px', color: '#1a1a1a', fontWeight: 700, padding: '8px 16px', cursor: isSubmitting || !time ? 'not-allowed' : 'pointer', opacity: isSubmitting || !time ? 0.6 : 1, fontSize: '0.85rem' }}
              >
                {isSubmitting ? 'Reserving…' : 'Confirm Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Firm Menu Section — restaurants/cafes get this instead of Services.
export const FirmMenu: React.FC<{ items: FirmMenuItem[] }> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const categories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Menu</h2>
      </div>
      {categories.map((category) => (
        <div key={category} style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tech-accent-gold-text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            {category}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.filter((item) => item.category === category).map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--tech-border-dim)' }}>
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem' }}>{item.name}</div>
                  {item.description && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--tech-text-dim)', marginTop: '2px' }}>{item.description}</div>
                  )}
                </div>
                <div style={{ flexShrink: 0, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>{item.price}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

// Firm Listings Section — real estate / property firms get this instead of Services.
export const FirmListings: React.FC<{ listings: FirmPropertyListing[] }> = ({ listings }) => {
  if (!listings || listings.length === 0) return null;

  const statusColor = (status: FirmPropertyListing['status']) => {
    if (status === 'For Sale') return '#8ba378';
    if (status === 'For Rent') return '#c6a15b';
    if (status === 'Pending') return '#a79e8c';
    return '#8a7f68';
  };

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Listings</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
        {listings.map((listing) => (
          <div key={listing.id} style={{ border: '1px solid var(--tech-border)', overflow: 'hidden', background: 'rgba(246, 243, 237, 0.02)' }}>
            <div style={{ position: 'relative', height: '160px', background: 'var(--color-bg-alt)' }}>
              {listing.imageUrl ? (
                <img src={listing.imageUrl} alt={listing.address} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tech-text-dim)', fontSize: '2rem' }}>🏠</div>
              )}
              <span style={{
                position: 'absolute', top: '10px', left: '10px',
                background: statusColor(listing.status), color: '#14140f',
                fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.04em', padding: '4px 10px', borderRadius: '999px',
              }}>
                {listing.status}
              </span>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>{listing.price}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text)', marginTop: '4px' }}>{listing.address}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--tech-text-dim)' }}>{listing.city}</div>
              <div style={{ display: 'flex', gap: '14px', marginTop: '12px', fontSize: '0.78rem', color: 'var(--tech-text-dim)' }}>
                <span>{listing.beds} bed</span>
                <span>{listing.baths} bath</span>
                <span>{listing.sqft.toLocaleString()} sqft</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
