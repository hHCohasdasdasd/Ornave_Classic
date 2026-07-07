import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirmService, FirmTeamMember, FirmJob, FirmLocation, FirmInsightsData, FirmPortfolioItem, FirmResource, FirmSubscription } from '@/types/firm';
import { storeService, Product } from '@/services/storeService';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

// Firm About Section
export const FirmAbout: React.FC<{ bio: string }> = ({ bio }) => {
  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">About</h2>
      </div>
      <div className="profile-section__content">
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
                  background: 'rgba(59, 130, 246, 0.1)', 
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
          {isProminent && <span className="profile-section__badge" style={{ background: 'var(--tech-blue)', color: '#000' }}>MARKETPLACE</span>}
        </div>
        <div className={isProminent ? "profile-section__grid" : "profile-section__items"} style={isProminent ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '16px'
        } : {}}>
          {services.map((service, index) => (
            <div key={index} className={isProminent ? "service-card--prominent card--hover" : "profile-section__item"} style={isProminent ? {
              background: 'rgba(255, 255, 255, 0.02)',
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
                background: '#000', 
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
                <h3 className="profile-item__title" style={isProminent ? { fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#fff', textTransform: 'uppercase' } : {}}>{service.title}</h3>
                <p className="profile-item__description" style={isProminent ? { fontSize: '0.85rem', color: 'var(--tech-text-dim)', lineHeight: '1.6' } : {}}>{service.description}</p>
                {isProminent && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button style={{
                      background: 'var(--tech-blue)',
                      color: '#000',
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
            backgroundColor: '#000',
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
                background: 'rgba(59, 130, 246, 0.1)',
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
                <span style={{ background: 'var(--tech-blue)', color: '#000', padding: '4px 12px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>MODULE_CATALOG</span>
              </div>
              <h1 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase' }}>Comprehensive_Services</h1>
              <p style={{ color: 'var(--tech-text-dim)', margin: 0, fontSize: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>SCANNING_CAPABILITIES // UPLINK_READY</p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '32px' 
            }}>
              {services.map((service, index) => (
                <div key={index} style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
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
                    background: '#000',
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
                    <h2 style={{ fontSize: '1.4rem', margin: '0 0 16px 0', color: '#fff', fontWeight: 800, textTransform: 'uppercase' }}>{service.title}</h2>
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
                        background: 'var(--tech-blue)',
                        color: '#000',
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
            
            <div style={{ marginTop: '60px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.03)', padding: '40px', border: '1px dashed var(--tech-blue)' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', color: '#fff', textTransform: 'uppercase' }}>Ready_to_Initialize_Protocol?</h3>
              <p style={{ color: 'var(--tech-text-dim)', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px', fontFamily: 'JetBrains Mono, monospace' }}>Our units are on standby to optimize your operational efficiency.</p>
              <button style={{ background: 'var(--tech-blue)', color: '#000', border: 'none', padding: '16px 40px', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
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
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0px', border: '1px solid var(--tech-border)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '0', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid var(--tech-blue)', clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)' }}>
              {person.avatar}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{person.name}</div>
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
        <button className="profile-section__action-btn" onClick={() => navigate('/jobs')} style={{ background: 'var(--tech-blue)', color: '#000', fontWeight: 800 }}>VIEW_ALL_JOBS</button>
      </div>
      <div className="profile-section__items">
        {jobs.map((job, index) => (
          <div key={index} className="profile-section__item" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--tech-border)', borderRadius: '0', padding: '16px', marginBottom: '12px' }}>
            <div className="profile-item__icon" style={{ background: '#000', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}>💼</div>
            <div className="profile-item__content">
              <h3 className="profile-item__title" style={{ color: '#fff', fontSize: '1rem', textTransform: 'uppercase' }}>{job.title}</h3>
              <p className="profile-item__subtitle" style={{ color: 'var(--tech-text-dim)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>{job.location} • {job.type}</p>
            </div>
            <button className="btn-sm-primary" style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}>APPLY_MODULE</button>
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
          <div key={index} className="profile-section__item" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--tech-border)', borderRadius: '0', padding: '16px', marginBottom: '12px' }}>
            <div className="profile-item__icon" style={{ background: '#000', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}>📍</div>
            <div className="profile-item__content">
              <h3 className="profile-item__title" style={{ color: '#fff', fontSize: '1rem', textTransform: 'uppercase' }}>{loc.city} ({loc.type})</h3>
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
        <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--tech-border)', position: 'relative' }}>
          <div className="tech-corner-top-right" style={{ width: '8px', height: '8px' }}></div>
          <div style={{ fontSize: '10px', color: 'var(--tech-blue)', fontWeight: 800, marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}>EMPLOYEE_GROWTH</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{insights.employeeGrowth} <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>+ TRENDING</span></div>
        </div>
        <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--tech-border)', position: 'relative' }}>
          <div className="tech-corner-top-right" style={{ width: '8px', height: '8px' }}></div>
          <div style={{ fontSize: '10px', color: 'var(--tech-blue)', fontWeight: 800, marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}>AVG_TENURE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{insights.avgTenure}</div>
        </div>
      </div>
    </section>
  );
};

// Firm Network Visualization Section
export const FirmNetwork: React.FC<{ team: FirmTeamMember[], firmName: string }> = ({ team, firmName }) => {
  const navigate = useNavigate();
  if (!team || team.length === 0) return null;

  // Determine node size based on role
  const getNodeSize = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes('CEO')) return 90;
    if (r.includes('CFO') || r.includes('CHRO') || r.includes('CTO') || r.includes('COO')) return 80;
    if (r.includes('EXECUTIVE') || r.includes('DIRECTOR')) return 75;
    return 70;
  };

  // Color mapping for roles
  const getRoleColor = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes('CEO')) return '#4c51bf';
    if (r.includes('FINANCE') || r.includes('CFO')) return '#38a169';
    if (r.includes('HUMAN') || r.includes('CHRO')) return '#d53f8c';
    if (r.includes('TECH') || r.includes('CTO')) return '#3182ce';
    return '#718096';
  };

  return (
    <section className="profile-section" style={{ overflow: 'visible' }}>
      <div className="profile-section__header">
        <h2 className="profile-section__title">Company Network</h2>
        <span style={{ fontSize: '12px', color: '#718096', fontWeight: 500 }}>Interactive Org Chart</span>
      </div>
      
      <div className="firm-network-container enhanced-network" style={{ 
        position: 'relative', 
        height: '500px', 
        background: '#f8fafc', 
        borderRadius: '20px', 
        marginTop: '16px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
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
          background: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid #4c51bf',
          boxShadow: '0 0 30px rgba(76, 81, 191, 0.2), 0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 20
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '2px' }}>🏢</div>
            <div style={{ color: '#1a202c', fontWeight: 800, fontSize: '14px', lineHeight: '1.2' }}>{firmName}</div>
          </div>
        </div>

        {/* Connecting Lines (SVG Overlay) */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4c51bf" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#cbd5e0" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {team.map((_, index) => {
            const angle = (index * (360 / team.length) - 90) * (Math.PI / 180);
            const radius = 180;
            const x2 = 50 + (Math.cos(angle) * 35);
            const y2 = 50 + (Math.sin(angle) * 35);
            
            return (
              <g key={index}>
                <line 
                  x1="50%" y1="50%" 
                  x2={`${x2}%`} 
                  y2={`${y2}%`}
                  stroke="url(#lineGradient)" 
                  strokeWidth="2"
                  className="network-line"
                />
                <circle cx={`${x2}%`} cy={`${y2}%`} r="3" fill="#4c51bf" opacity="0.5" />
              </g>
            );
          })}
        </svg>

        {/* Team Bubbles */}
        {team.map((person, index) => {
          const angle = (index * (360 / team.length) - 90) * (Math.PI / 180);
          const radius = 190; 
          const size = getNodeSize(person.role);
          const color = getRoleColor(person.role);
          
          return (
            <div 
              key={index}
              className="network-node person-bubble"
              onClick={() => person.profileSlug && navigate(`/profile?view=${person.profileSlug}`)}
              style={{
                position: 'absolute',
                left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                transform: 'translate(-50%, -50%)',
                width: `${size}px`,
                height: `${size}px`,
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.02)',
                zIndex: 15,
                padding: '10px',
                border: `1.5px solid #edf2f7`,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: person.profileSlug ? 'pointer' : 'default'
              }}
            >
              <div className="bubble-avatar-wrapper" style={{ 
                width: '32px', 
                height: '32px', 
                background: `${color}15`, 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                marginBottom: '6px'
              }}>
                {person.avatar}
              </div>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 800, 
                textAlign: 'center', 
                color: '#2d3748', 
                lineHeight: '1.1',
                marginBottom: '2px'
              }}>
                {person.name.split(' ')[0]}<br/>{person.name.split(' ').slice(1).join(' ')}
              </div>
              <div style={{ 
                fontSize: '9px', 
                color: color, 
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
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
                border: '2px solid white'
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
                background: 'rgba(59, 130, 246, 0.1)', 
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
              background: 'var(--tech-blue)',
              color: '#000',
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
              background: 'rgba(255, 255, 255, 0.02)', 
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
              <h3 style={{ fontSize: '13px', margin: '0 0 4px 0', color: '#fff', textTransform: 'uppercase' }}>{product.name}</h3>
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
            backgroundColor: '#000',
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
                background: 'rgba(59, 130, 246, 0.1)',
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
              <h1 style={{ margin: '0 0 8px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '2px' }}>Inventory_Core_Access</h1>
              <p style={{ color: 'var(--tech-text-dim)', margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem' }}>LINK_ESTABLISHED // SCANNING_CATALOG...</p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '24px' 
            }}>
              {products.map(product => (
                <div key={product.id} style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
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
                    <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', color: '#fff', textTransform: 'uppercase' }}>{product.name}</h2>
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
                        background: 'var(--tech-blue)', 
                        color: '#000', 
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
          <div key={index} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--tech-border)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="tech-corner-top-right" style={{ width: '12px', height: '12px' }}></div>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover', opacity: 0.8, borderBottom: '1px solid var(--tech-border-dim)' }} />
            )}
            <div style={{ padding: '24px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--tech-blue)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{item.category}</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '12px 0', color: '#fff', textTransform: 'uppercase' }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--tech-text-dim)', lineHeight: '1.6', marginBottom: '20px' }}>{item.description}</p>
              {item.result && (
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>OUTCOME_REPORT</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{item.result}</div>
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
          <div key={index} className="profile-section__item" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--tech-border)', padding: '16px', marginBottom: '12px', borderRadius: '0' }}>
            <div className="profile-item__icon" style={{ fontSize: '24px', background: '#000', border: '1px solid var(--tech-blue)', width: '50px', height: '50px' }}>
              {getTypeIcon(resource.type)}
            </div>
            <div className="profile-item__content" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="profile-item__title" style={{ color: '#fff', fontSize: '1rem', textTransform: 'uppercase' }}>{resource.title}</h3>
                  <p className="profile-item__description" style={{ color: 'var(--tech-text-dim)', fontSize: '0.85rem' }}>{resource.description}</p>
                </div>
                <button style={{ 
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
            background: plan.isPopular ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: plan.isPopular ? '2px solid var(--tech-blue)' : '1px solid var(--tech-border)',
            borderRadius: '14px'
          }}>
            {plan.isPopular && (
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '20px',
                background: 'var(--tech-blue)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                Most Popular
              </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>{plan.name}</h3>
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
              color: plan.isPopular ? '#000' : 'var(--tech-blue)',
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
