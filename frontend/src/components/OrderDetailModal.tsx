import React from 'react';
import { Order } from '@/services/storeService';
import { getProductMedia } from '@/services/storeService';
import { IconImage, IconCard } from '@/components/ui/Icons';
import './OrderDetailModal.css';

const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${price.toFixed(2)}`;
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const formatAddress = (address?: string | null, city?: string | null, state?: string | null, postalCode?: string | null, country?: string | null): string | null => {
  const parts = [address, [city, state, postalCode].filter(Boolean).join(', '), country].filter(Boolean);
  return parts.length > 0 ? parts.join('\n') : null;
};

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onViewCompany?: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onViewCompany }) => {
  const billing = formatAddress(order.billingAddress, order.billingCity, order.billingState, order.billingPostalCode, order.billingCountry);
  const delivery = formatAddress(order.deliveryAddress, order.deliveryCity, order.deliveryState, order.deliveryPostalCode, order.deliveryCountry);

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <button className="order-modal__close" onClick={onClose}>×</button>

        <div className="order-modal__header">
          <div>
            <span className="order-modal__order-id">Order #{order.id.slice(-8).toUpperCase()}</span>
            <h2 className="order-modal__company">{order.company?.name || 'Ornave Marketplace'}</h2>
            <span className="order-modal__date">Placed {formatDate(order.createdAt)}</span>
          </div>
          <span className={`order-modal__status order-modal__status--${order.status.toLowerCase()}`}>{order.status}</span>
        </div>

        {onViewCompany && (
          <button className="order-modal__company-link" onClick={onViewCompany}>
            View all orders with this company ›
          </button>
        )}

        <div className="order-modal__section">
          <h3 className="order-modal__section-title">Items</h3>
          <div className="order-modal__items">
            {order.items.map((item) => {
              const media = getProductMedia(item.product);
              const cover = media[0];
              return (
                <div key={item.id} className="order-modal__item">
                  <div className="order-modal__item-media">
                    {cover ? (
                      cover.type === 'video' ? (
                        <video src={cover.url} muted />
                      ) : (
                        <img src={cover.url} alt={item.product.name} />
                      )
                    ) : (
                      <div className="order-modal__item-placeholder"><IconImage size={20} /></div>
                    )}
                  </div>
                  <div className="order-modal__item-info">
                    <span className="order-modal__item-name">{item.product.name}</span>
                    {item.product.category && <span className="order-modal__item-category">{item.product.category}</span>}
                  </div>
                  <div className="order-modal__item-pricing">
                    <span className="order-modal__item-qty">Qty {item.quantity} × {formatPrice(item.price, order.currency)}</span>
                    <span className="order-modal__item-total">{formatPrice(item.price * item.quantity, order.currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="order-modal__section order-modal__section--split">
          {billing && (
            <div className="order-modal__block">
              <h3 className="order-modal__section-title">Billing address</h3>
              <p className="order-modal__block-text">{billing}</p>
            </div>
          )}
          {delivery && (
            <div className="order-modal__block">
              <h3 className="order-modal__section-title">Delivery address</h3>
              <p className="order-modal__block-text">{delivery}</p>
            </div>
          )}
          <div className="order-modal__block">
            <h3 className="order-modal__section-title">Payment</h3>
            <p className="order-modal__block-text order-modal__payment">
              <IconCard size={14} />
              {order.paymentBrand && order.paymentLast4 ? `${order.paymentBrand} •••• ${order.paymentLast4}` : 'Not available'}
            </p>
          </div>
        </div>

        <div className="order-modal__total-row">
          <span>Total</span>
          <span className="order-modal__total-value">{formatPrice(order.totalAmount, order.currency)}</span>
        </div>
      </div>
    </div>
  );
};
