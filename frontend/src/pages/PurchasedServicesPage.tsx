import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { storeService, Order } from '@/services/storeService';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { IconBag, IconChevronDown } from '@/components/ui/Icons';
import './PurchasedServicesPage.css';

const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${price.toFixed(2)}`;
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export const PurchasedServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user || user.id === 'guest') {
      navigate('/login');
      return;
    }
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = selectedOrder ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedOrder]);

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
    <div className="purchases-page">
      <Navbar />
      <div className="purchases-page__container">
        <header className="purchases-page__header">
          <h1 className="purchases-page__title">Orders &amp; Invoices</h1>
          <p className="purchases-page__subtitle">Every purchase and event ticket you've bought through Ornave.</p>
        </header>

        {isLoading ? (
          <div className="purchases-page__loading">Loading your orders…</div>
        ) : orders.length === 0 ? (
          <div className="purchases-page__empty">
            <div className="purchases-page__empty-icon"><IconBag size={32} /></div>
            <h3 className="purchases-page__empty-title">No orders yet</h3>
            <p className="purchases-page__empty-text">Purchases you make on the Marketplace, including event tickets, will show up here.</p>
            <button className="purchases-page__empty-btn" onClick={() => navigate('/store')}>
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="purchases-page__list">
            {orders.map((order) => (
              <div key={order.id} className="invoice-card">
                <button className="invoice-card__summary" onClick={() => setSelectedOrder(order)}>
                  <div className="invoice-card__summary-left">
                    <span className="invoice-card__order-id">#{order.id.slice(-8).toUpperCase()}</span>
                    <span className="invoice-card__company">{order.company?.name || 'Ornave Marketplace'}</span>
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
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onViewCompany={() => navigate(`/purchased-services/${selectedOrder.companyId}`)}
        />
      )}
    </div>
  );
};
