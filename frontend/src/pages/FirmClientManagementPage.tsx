import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/ui/PageContainer';
import { erpNavigation } from '@/constants/navigation';
import { firmService } from '@/services/firmService';
import { storeService, Order } from '@/services/storeService';
import '@/pages/NetworkPage.css';

export const FirmClientManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [followers, setFollowers] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, company, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [firmFollowers, allOrders] = await Promise.all([
        firmService.getFirmFollowers(company?.id || ''),
        storeService.getUserOrders() // In real app: storeService.getCompanyOrders()
      ]);
      
      setFollowers(firmFollowers);
      // Filter orders for this company
      setOrders(allOrders.filter(o => o.companyId === company?.id));
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ background: 'var(--color-bg, #18161a)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted, #a8a3ab)' }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <PageContainer
      title="Client & Network HUD"
      subtitle="Monitor your global followers, active subscribers, and service utilization."
      sidebarItems={erpNavigation}
    >
      <div className="network-main fade-in">
        {/* Firm Status Header */}
        <section className="network-section" style={{ 
          border: '1px solid rgba(59, 130, 246, 0.4)',
          background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
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
              width: '80px', 
              height: '80px', 
              background: '#000', 
              border: '1px solid var(--tech-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              position: 'relative'
            }}>
              🏢
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '1.8rem', textTransform: 'uppercase', margin: 0, letterSpacing: '2px', fontWeight: 900, color: '#fff' }}>{company?.name}</h1>
                <div style={{ border: '1px solid var(--tech-blue)', padding: '2px 10px', fontSize: '0.6rem', fontWeight: 800, color: 'var(--tech-blue)' }}>
                  VERIFIED_ENTITY_HUB
                </div>
              </div>
              <div style={{ display: 'flex', gap: '25px' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 800 }}>TOTAL_FOLLOWERS: <span style={{ color: 'var(--tech-blue)' }}>{followers.length}</span></div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 800 }}>ACTIVE_CLIENTS: <span style={{ color: 'var(--tech-blue)' }}>{new Set(orders.map(o => o.userId)).size}</span></div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 800 }}>PENDING_REQUESTS: <span style={{ color: 'var(--tech-blue)' }}>0</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          {/* Followers List */}
          <div style={{ gridColumn: 'span 7' }}>
            <section className="network-section" style={{ height: '100%', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>//</span> NETWORK FOLLOWERS
              </h3>
              <div className="profile-connections-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {followers.map(follower => (
                  <div key={follower.id} className="connection-hud-item" style={{ 
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}>
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      borderRadius: '50%',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      👤
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>{follower.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--tech-text-dim)' }}>{follower.headline}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="tech-tag" style={{ fontSize: '0.6rem', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' }}>CORE_LINK</span>
                      <button 
                        className="btn-sm-primary" 
                        style={{ display: 'block', marginTop: '5px', fontSize: '0.65rem', padding: '4px 12px' }}
                        onClick={() => navigate(`/messages?to=${follower.id}`)}
                      >MESSAGE</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Service Utilization / Orders */}
          <div style={{ gridColumn: 'span 5' }}>
            <section className="network-section" style={{ height: '100%', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>//</span> SERVICE UTILIZATION
              </h3>
              <div className="profile-connections-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.length > 0 ? orders.map(order => (
                  <div key={order.id} style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>{order.items[0]?.product?.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--tech-blue)', fontWeight: 800 }}>{order.currency} {order.totalAmount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>USER: {order.user?.firstName || 'CHUCK'} {order.user?.lastName || 'HARTWIG'}</span>
                      <span style={{ color: order.status === 'COMPLETED' ? '#10b981' : 'var(--tech-blue)' }}>{order.status}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '30px', textAlign: 'center', opacity: 0.3 }}>
                    <p>No active service subscriptions detected.</p>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '24px', padding: '15px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                <h4 style={{ fontSize: '0.8rem', margin: '0 0 10px 0', color: 'var(--tech-blue)' }}>REVENUE_ANALYTICS</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--tech-text-dim)' }}>MONTHLY_RECURRING</span>
                  <span style={{ color: '#fff', fontWeight: 800 }}>USD {orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString()}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Client Analytics Section */}
          <div style={{ gridColumn: 'span 12', marginTop: '10px' }}>
            <section className="network-section" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--tech-blue)', fontWeight: 900 }}>//</span> NETWORK GROWTH & ENGAGEMENT
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {[
                  { label: 'Avg. Retention', value: '94.2%', color: '#10b981' },
                  { label: 'Engagement Rate', value: '12.5%', color: 'var(--tech-blue)' },
                  { label: 'New Followers', value: '+124', color: '#10b981' },
                  { label: 'Churn Risk', value: '0.8%', color: '#b8955f' }
                ].map(stat => (
                  <div key={stat.label} style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    padding: '20px', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--tech-text-dim)', marginBottom: '8px', fontWeight: 800 }}>{stat.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
