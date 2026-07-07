import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FirmProfile } from '@/types/discovery';
import { storeService, Product } from '@/services/storeService';
import { useAuth } from '@/context/AuthContext';

interface FirmCardProps {
  firm: FirmProfile;
  onConnect: (firmId: string) => void;
  isLoading?: boolean;
}

export const FirmCard: React.FC<FirmCardProps> = ({ firm, onConnect, isLoading }) => {
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [requestedId, setRequestedId] = useState<string | null>(null);

  const handleViewProfile = () => navigate(`/profile?view=${firm.id}`);

  const fallbackServices = (firmId: string, firmName: string): Product[] => [
    {
      id: `${firmId}-svc-1`,
      companyId: firmId,
      name: 'Discovery Consultation',
      description: `Strategy session with the ${firmName} team to assess your needs and outline a path forward.`,
      price: 250,
      currency: 'USD',
      imageUrl: null,
      category: 'Consulting',
      stock: 99,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: `${firmId}-svc-2`,
      companyId: firmId,
      name: 'Project Engagement',
      description: 'Scoped project delivery from kickoff through handover, with clear milestones.',
      price: 2500,
      currency: 'USD',
      imageUrl: null,
      category: 'Project',
      stock: 99,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: `${firmId}-svc-3`,
      companyId: firmId,
      name: 'Monthly Retainer',
      description: 'Ongoing advisory and execution support on a flexible monthly basis.',
      price: 1200,
      currency: 'USD',
      imageUrl: null,
      category: 'Retainer',
      stock: 99,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const openRequestModal = async () => {
    if (!user || user.id === 'guest') {
      triggerAuthModal('Please log in to request a service.');
      return;
    }
    setShowModal(true);
    setLoadingProducts(true);
    try {
      const result = await storeService.getCompanyProducts(firm.id);
      setProducts(result.length > 0 ? result : fallbackServices(firm.id, firm.name));
    } catch {
      setProducts(fallbackServices(firm.id, firm.name));
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleRequest = (product: Product) => {
    if (!user) return;
    setRequestedId(product.id);
    try {
      const ORDERS_KEY = 'ornave_orders';
      const raw = localStorage.getItem(ORDERS_KEY);
      const existing: unknown[] = raw ? JSON.parse(raw) : [];
      const newOrder = {
        id: `ord-${Date.now()}`,
        userId: user.id,
        companyId: firm.id,
        status: 'PENDING',
        totalAmount: product.price,
        currency: product.currency,
        createdAt: new Date().toISOString(),
        company: { name: firm.name, id: firm.id },
        items: [{ id: `i-${Date.now()}`, productId: product.id, productName: product.name, quantity: 1, price: product.price }],
      };
      localStorage.setItem(ORDERS_KEY, JSON.stringify([newOrder, ...existing]));
    } catch (e) {
      console.warn('Failed to save order:', e);
    }
  };

  return (
    <>
      <div className="discovery-card">
        <div className="discovery-card__header">
          <div className="discovery-card__avatar" onClick={handleViewProfile} style={{ cursor: 'pointer' }}>
            {firm.logo ? (
              <img src={firm.logo} alt={firm.name} />
            ) : (
              <div className="discovery-card__avatar-placeholder firm">
                {firm.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="discovery-card__content">
            <h3 className="discovery-card__name" onClick={handleViewProfile} style={{ cursor: 'pointer' }}>{firm.name}</h3>
            {firm.description && <p className="discovery-card__description">{firm.description}</p>}
            {firm.industry && <span className="discovery-card__tag">{firm.industry}</span>}
          </div>
        </div>

        <div className="discovery-card__actions">
          {firm.isConnected ? (
            <button className="discovery-card__action-btn" disabled>✓ Following</button>
          ) : (
            <button
              className="discovery-card__action-btn discovery-card__action-btn--primary"
              onClick={() => onConnect(firm.id)}
              disabled={isLoading}
            >
              + Follow
            </button>
          )}
          <button className="discovery-card__action-btn discovery-card__action-btn--service" onClick={openRequestModal}>
            Request Service
          </button>
        </div>
      </div>

      {showModal && createPortal(
        <div className="service-request-overlay" onClick={() => { setShowModal(false); setRequestedId(null); }}>
          <div className="service-request-modal" onClick={e => e.stopPropagation()}>
            <div className="service-request-modal__header">
              <div>
                <h3>Services by {firm.name}</h3>
                <p>Select a service to send a request</p>
              </div>
              <button className="service-request-modal__close" onClick={() => { setShowModal(false); setRequestedId(null); }}>×</button>
            </div>

            <div className="service-request-modal__body">
              {loadingProducts ? (
                <div className="service-request-modal__empty">Loading services...</div>
              ) : products.length === 0 ? (
                <div className="service-request-modal__empty">No services listed yet.</div>
              ) : (
                <div className="service-request-modal__grid">
                  {products.map(product => (
                    <div key={product.id} className="service-request-card">
                      {product.imageUrl && (
                        <div className="service-request-card__img">
                          <img src={product.imageUrl} alt={product.name} />
                        </div>
                      )}
                      <div className="service-request-card__info">
                        <div className="service-request-card__name">{product.name}</div>
                        {product.description && (
                          <div className="service-request-card__desc">{product.description}</div>
                        )}
                        <div className="service-request-card__price">
                          {product.currency} {product.price.toFixed(2)}
                        </div>
                      </div>
                      <button
                        className={`service-request-card__btn ${requestedId === product.id ? 'service-request-card__btn--sent' : ''}`}
                        onClick={() => handleRequest(product)}
                        disabled={requestedId === product.id}
                      >
                        {requestedId === product.id ? '✓ Requested' : 'Request'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
