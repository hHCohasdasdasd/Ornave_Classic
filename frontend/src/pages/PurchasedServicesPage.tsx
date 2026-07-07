import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { storeService, Order } from '@/services/storeService';
import './NetworkPage.css'; // Reusing network styles for consistency

export const PurchasedServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const myOrders = await storeService.getUserOrders();
      setOrders(myOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="network-page">
        <div className="network-page__container" style={{ gridTemplateColumns: '1fr' }}>
          <main className="network-main">
            <header className="network-section__header" style={{ borderBottom: 'none', marginBottom: '8px' }}>
              <button className="network-section__link" onClick={() => navigate('/profile')} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ← Back to Profile
              </button>
            </header>

            <section className="network-section fade-in">
              <div className="network-section__header">
                <div>
                  <h2 style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    <span style={{ color: 'var(--tech-blue)' }}>//</span> Connected Services
                  </h2>
                  <p style={{ color: 'var(--tech-text-dim)', marginTop: '4px' }}>Firms you are doing business with</p>
                </div>
                <div className="network-stat__value" style={{ background: 'var(--tech-blue)', color: '#14140f' }}>
                  {orders.length} ENTITIES
                </div>
              </div>

              {isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--tech-blue)' }}>
                  <div className="tech-scan-line"></div>
                  <p>DECRYPTING TRANSACTION HISTORY...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="invite-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))' }}>
                  {orders.map(order => (
                    <div key={order.id} className="invite-card" style={{ borderLeft: '4px solid var(--tech-blue)', position: 'relative' }}>
                      <div className="tech-corner-top-right"></div>
                      <div className="invite-card__avatar" style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--tech-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)'
                      }}>
                        🏢
                      </div>
                      <div className="invite-card__content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 className="invite-card__name" style={{ color: 'var(--color-text)' }}>{order.company?.name}</h3>
                          <span className="tech-tag" style={{ background: order.status === 'COMPLETED' ? 'rgba(139, 163, 120, 0.15)' : 'rgba(198, 161, 91, 0.15)', color: order.status === 'COMPLETED' ? '#8ba378' : '#c6a15b', borderColor: 'currentColor' }}>
                            {order.status}
                          </span>
                        </div>
                        <p className="invite-card__headline">
                          {order.items.map(item => item.product.name).join(', ')}
                        </p>
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="tech-label" style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                            TRANSACTION_ID: {order.id.toUpperCase()}
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--tech-blue)' }}>
                            {order.currency} {order.totalAmount.toLocaleString()}
                          </div>
                        </div>
                        <div className="invite-card__actions" style={{ marginTop: '16px' }}>
                          <button className="btn-accept" onClick={() => navigate(`/purchased-services/${order.companyId}`)}>
                            SERVICE_OVERVIEW
                          </button>
                          <button className="btn-ignore" onClick={() => navigate(`/messages`)}>
                            SUPPORT
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '80px', textAlign: 'center', border: '1px dashed var(--tech-border)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.3 }}>∅</div>
                  <h3>No Active Service Connections</h3>
                  <p style={{ color: 'var(--tech-text-dim)', marginBottom: '24px' }}>Explore the marketplace to connect with top-tier firms.</p>
                  <button className="btn-primary" onClick={() => navigate('/store')}>
                    EXPLORE_MARKETPLACE
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
