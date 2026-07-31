import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { firmService } from '@/services/firmService';
import { storeService, Order } from '@/services/storeService';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { IconChevronDown, IconMail } from '@/components/ui/Icons';
import './FirmServiceOverviewPage.css';

const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${price.toFixed(2)}`;
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export const FirmServiceOverviewPage: React.FC = () => {
  const { firmId } = useParams<{ firmId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firmData, setFirmData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user || user.id === 'guest') {
      navigate('/login');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmId, user]);

  useEffect(() => {
    document.body.style.overflow = selectedOrder ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedOrder]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [firm, myOrders] = await Promise.all([
        firmService.getFirmProfile(firmId || ''),
        storeService.getUserOrders(),
      ]);
      setFirmData(firm);
      setOrders(myOrders.filter((o) => o.companyId === firmId));
    } catch (error) {
      console.error('Failed to load firm service overview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const currency = orders[0]?.currency || 'USD';
  const location = firmData?.locations?.[0]
    ? [firmData.locations[0].city, firmData.locations[0].country].filter(Boolean).join(', ')
    : null;

  if (isLoading) {
    return (
      <div className="firm-overview-page">
        <Navbar />
        <div className="firm-overview-page__loading">Loading…</div>
      </div>
    );
  }

  return (
    <div className="firm-overview-page">
      <Navbar />
      <div className="firm-overview-page__container">
        <button className="firm-overview-page__back" onClick={() => navigate('/purchased-services')}>
          ← Back to Orders &amp; Invoices
        </button>

        <header className="firm-overview-page__header">
          <div className="firm-overview-page__avatar">
            {(firmData?.name || firmId || '?').charAt(0).toUpperCase()}
          </div>
          <div className="firm-overview-page__header-text">
            <h1 className="firm-overview-page__name">{firmData?.name || firmId}</h1>
            <div className="firm-overview-page__meta">
              {firmData?.industry && <span>{firmData.industry}</span>}
              {location && <span>{location}</span>}
              <span>{orders.length} order{orders.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div className="firm-overview-page__header-actions">
            <button className="firm-overview-page__btn firm-overview-page__btn--primary" onClick={() => navigate(`/profile?view=${firmId}`)}>
              View Company Profile
            </button>
            <button className="firm-overview-page__btn" onClick={() => navigate(`/messages?to=${firmId}`)}>
              <IconMail size={14} />
              Message
            </button>
          </div>
        </header>

        <div className="firm-overview-page__stats">
          <div className="firm-overview-page__stat">
            <span className="firm-overview-page__stat-label">Orders placed</span>
            <span className="firm-overview-page__stat-value">{orders.length}</span>
          </div>
          <div className="firm-overview-page__stat">
            <span className="firm-overview-page__stat-label">Total spent</span>
            <span className="firm-overview-page__stat-value">{formatPrice(totalSpent, currency)}</span>
          </div>
          <div className="firm-overview-page__stat">
            <span className="firm-overview-page__stat-label">Last order</span>
            <span className="firm-overview-page__stat-value">{orders[0] ? formatDate(orders[0].createdAt) : '—'}</span>
          </div>
        </div>

        <h2 className="firm-overview-page__section-title">Orders with this company</h2>

        {orders.length === 0 ? (
          <div className="firm-overview-page__empty">You haven't placed any orders with this company yet.</div>
        ) : (
          <div className="firm-overview-page__list">
            {orders.map((order) => (
              <div key={order.id} className="invoice-card">
                <button className="invoice-card__summary" onClick={() => setSelectedOrder(order)}>
                  <div className="invoice-card__summary-left">
                    <span className="invoice-card__order-id">#{order.id.slice(-8).toUpperCase()}</span>
                    <span className="invoice-card__date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="invoice-card__summary-right">
                    <span className={`invoice-card__status invoice-card__status--${order.status.toLowerCase()}`}>{order.status}</span>
                    <span className="invoice-card__total">{formatPrice(order.totalAmount, order.currency)}</span>
                    <IconChevronDown size={14} className="invoice-card__chevron invoice-card__chevron--link" />
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};
