import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { firmService } from '@/services/firmService';
import { storeService, Order } from '@/services/storeService';
import './NetworkPage.css';

export const FirmServiceOverviewPage: React.FC = () => {
  const { firmId } = useParams<{ firmId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firmData, setFirmData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [firmStats, setFirmStats] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [firmId, user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [firm, myOrders, stats] = await Promise.all([
        firmService.getFirmProfile(firmId || ''),
        storeService.getUserOrders(),
        storeService.getFirmStats(firmId || '')
      ]);
      
      setFirmData(firm);
      setOrders(myOrders.filter(o => o.companyId === firmId));
      setFirmStats(stats);
      
      // Fallback mock if data is thin
      if (!firm.name && firmId === 'abibas') {
        setFirmData({
          name: 'Abibas Official',
          industry: 'Athletic Innovation',
          location: 'Herzogenaurach, Germany',
          bio: 'Pushing the boundaries of athletic performance since 1949.',
          followersCount: 1500000
        });
      }
    } catch (error) {
      console.error('Failed to load connection data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ background: 'var(--color-bg)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tech-blue)' }}>
        <span>UPLINKING_TO_FIRM_CORE...</span>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="network-page">
        <div className="network-page__container" style={{ gridTemplateColumns: '1fr' }}>
          <main className="network-main">
            <header className="network-section__header" style={{ borderBottom: 'none', marginBottom: '8px' }}>
              <button className="network-section__link" onClick={() => navigate('/purchased-services')} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ← Back to Services
              </button>
            </header>

            {/* Link Status Header */}
            <section className="network-section" style={{ 
              border: '1px solid rgba(231, 223, 201, 0.3)',
              background: 'linear-gradient(180deg, rgba(231, 223, 201, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
              padding: '24px',
              borderRadius: '4px',
              position: 'relative', 
              overflow: 'hidden',
              marginBottom: '30px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, var(--tech-blue), transparent)' }}></div>
              
              <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                <div style={{ 
                  width: '90px', 
                  height: '90px', 
                  background: 'var(--color-bg)',
                  border: '1px solid var(--tech-blue)',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '10px', height: '10px', borderTop: '2px solid var(--tech-blue)', borderLeft: '2px solid var(--tech-blue)' }}></div>
                  🏢
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(246, 243, 237, 0.15)', paddingBottom: '8px' }}>
                    <h1 style={{ fontSize: '2.2rem', textTransform: 'uppercase', margin: 0, letterSpacing: '3px', fontWeight: 900, color: 'var(--color-text)' }}>{firmData?.name || firmId?.toUpperCase()}</h1>
                    <div style={{ border: '1px solid var(--tech-blue)', padding: '2px 10px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--tech-blue)' }}>
                      ESTABLISHED_PARTNER
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '25px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(246, 243, 237, 0.55)', fontWeight: 800 }}>PROTOCOL: <span style={{ color: 'var(--tech-blue)' }}>B2B_ENCRYPTED</span></div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(246, 243, 237, 0.55)', fontWeight: 800 }}>LINK_AGE: <span style={{ color: 'var(--tech-blue)' }}>ESTABLISHED</span></div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(246, 243, 237, 0.55)', fontWeight: 800 }}>ACTIVE_ITEMS: <span style={{ color: 'var(--tech-blue)' }}>{orders.length}</span></div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(246, 243, 237, 0.55)', fontWeight: 800 }}>LAST_INTERACTION: <span style={{ color: 'var(--tech-blue)' }}>3.5.2026</span></div>
                  </div>
                </div>
              </div>
            </section>

            <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
              {/* Active Contracts / Orders */}
              <div style={{ gridColumn: 'span 8' }}>
                <section className="network-section" style={{ height: '100%', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(246, 243, 237, 0.08)', padding: '24px' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>//</span> ACTIVE SERVICE ITEMS
                  </h3>
                  <div className="profile-connections-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.length > 0 ? orders.map(order => (
                      <div key={order.id} className="connection-hud-item" style={{ 
                        background: 'rgba(231, 223, 201, 0.03)',
                        border: '1px solid rgba(231, 223, 201, 0.08)',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '1.1rem', color: 'var(--color-text)', textTransform: 'uppercase', margin: 0 }}>{order.items[0]?.product?.name || 'SaaS Infrastructure'}</h4>
                            <span style={{ color: 'var(--tech-blue)', fontWeight: 900, fontSize: '1.1rem' }}>{order.currency} {order.totalAmount}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--tech-text-dim)' }}>STATUS: {order.status} // ID: {order.id.toUpperCase()}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(246, 243, 237, 0.4)' }}>LAST_CHECK_IN: {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button 
                          className="btn-sm-primary" 
                          style={{ 
                            background: 'var(--tech-blue)',
                            color: '#14140f',
                            border: 'none', 
                            padding: '8px 24px', 
                            fontWeight: 900,
                            marginLeft: '24px',
                            cursor: 'pointer'
                          }}
                          onClick={() => alert(`Accessing Management Console for ${order.items[0]?.product?.name || 'Service'}...`)}
                        >MANAGE</button>
                      </div>
                    )) : (
                      <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                        <p>No active service orders found in registry.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Entity Analytics */}
              <div style={{ gridColumn: 'span 4' }}>
                <section className="network-section" style={{ 
                  height: '100%', 
                  background: 'rgba(0, 0, 0, 0.4)', 
                  border: '1px solid rgba(246, 243, 237, 0.08)', 
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', textAlign: 'center' }}>
                    <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>//</span> 
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>ENTITY</span>
                      <span>ANALYTICS</span>
                    </div>
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid rgba(246, 243, 237, 0.08)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--tech-text-dim)', fontWeight: 800 }}>Industry</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 900 }}>{firmData?.industry || 'Technology Services'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid rgba(246, 243, 237, 0.08)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--tech-text-dim)', fontWeight: 800 }}>HEADQUARTERS</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 900 }}>{firmData?.location || 'GLOBAL'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid rgba(246, 243, 237, 0.08)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--tech-text-dim)', fontWeight: 800 }}>GLOBAL_REACH</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 900 }}>{(firmData?.followersCount / 1000).toFixed(1)}K NODES</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button className="btn-primary" style={{ 
                      width: '100%', 
                      background: 'rgba(231, 223, 201, 0.15)',
                      border: '1px solid var(--tech-blue)',
                      color: 'var(--tech-blue)',
                      borderRadius: '20px',
                      padding: '12px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }} onClick={() => navigate(`/profile?view=${firmId}`)}>
                      VIEW_FULL_PROFILE
                    </button>
                    <button className="btn-outline-primary" style={{ 
                      width: '100%', 
                      background: 'transparent', 
                      border: '1px solid rgba(231, 223, 201, 0.4)',
                      color: 'var(--tech-blue)',
                      padding: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }} onClick={() => navigate(`/messages?to=${firmId}`)}>
                      SECURE_COMMS
                    </button>
                  </div>
                </section>
              </div>

              {/* Support & Docs */}
              <div style={{ gridColumn: 'span 12', marginTop: '24px' }}>
                <section className="network-section" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(246, 243, 237, 0.08)', padding: '24px' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>//</span> DOCUMENTATION & SUPPORT LINKS
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {[
                      { title: 'SLA Agreement', icon: '📄' },
                      { title: 'API Credentials', icon: '🔑' },
                      { title: 'Invoice History', icon: '🧾' },
                      { title: 'Tech Specs', icon: '⚙️' }
                    ].map(doc => (
                      <div 
                        key={doc.title} 
                        style={{ 
                          background: 'rgba(231, 223, 201, 0.03)', 
                          border: '1px solid rgba(231, 223, 201, 0.08)',
                          padding: '30px', 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => alert(`Decrypting ${doc.title}...`)}
                      >
                        <div style={{ 
                          width: '4px', 
                          height: '4px', 
                          background: 'var(--tech-blue)', 
                          position: 'absolute', 
                          top: '0', 
                          left: '0' 
                        }}></div>
                        <div style={{ fontSize: '2rem', marginBottom: '15px' }}>{doc.icon}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--tech-text-dim)', letterSpacing: '1px' }}>{doc.title}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
