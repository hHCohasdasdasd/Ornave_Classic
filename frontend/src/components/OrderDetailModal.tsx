import React, { useEffect, useRef, useState } from 'react';
import { Order, OrderDocument, storeService } from '@/services/storeService';
import { getProductMedia } from '@/services/storeService';
import { IconImage, IconCard } from '@/components/ui/Icons';
import './OrderDetailModal.css';

const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${price.toFixed(2)}`;
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
};

const formatAddress = (address?: string | null, city?: string | null, state?: string | null, postalCode?: string | null, country?: string | null): string | null => {
  const parts = [address, [city, state, postalCode].filter(Boolean).join(', '), country].filter(Boolean);
  return parts.length > 0 ? parts.join('\n') : null;
};

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onViewCompany?: () => void;
  /** The selling company viewing one of ITS OWN orders — enables editing
   * status/tracking and uploading documents, rather than the read-only
   * buyer view. */
  isCompanyView?: boolean;
  onOrderUpdated?: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order: initialOrder, onClose, onViewCompany, isCompanyView, onOrderUpdated }) => {
  const [order, setOrder] = useState(initialOrder);
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<{ key: string; name: string; percent: number }[]>([]);
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const billing = formatAddress(order.billingAddress, order.billingCity, order.billingState, order.billingPostalCode, order.billingCountry);
  const delivery = formatAddress(order.deliveryAddress, order.deliveryCity, order.deliveryState, order.deliveryPostalCode, order.deliveryCountry);

  useEffect(() => {
    setIsLoadingDocs(true);
    storeService.getOrderDocuments(order.id)
      .then(setDocuments)
      .finally(() => setIsLoadingDocs(false));
  }, [order.id]);

  const handleSaveStatus = async () => {
    setIsSavingStatus(true);
    setError(null);
    try {
      const updated = await storeService.updateOrderStatus(order.id, { status, trackingNumber: trackingNumber || undefined });
      setOrder(updated);
      onOrderUpdated?.(updated);
    } catch {
      setError('Could not update the order — try again.');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!picked.length) return;
    for (const file of picked) {
      const key = `${file.name}-${Date.now()}`;
      setUploadingFiles((prev) => [...prev, { key, name: file.name, percent: 0 }]);
      try {
        await storeService.uploadOrderDocument(order.id, file, (percent) => {
          setUploadingFiles((prev) => prev.map((u) => (u.key === key ? { ...u, percent } : u)));
        });
        setUploadingFiles((prev) => prev.filter((u) => u.key !== key));
        setDocuments(await storeService.getOrderDocuments(order.id));
      } catch {
        setUploadingFiles((prev) => prev.filter((u) => u.key !== key));
        setError('Upload failed — try again.');
      }
    }
  };

  const handleDownload = async (doc: OrderDocument) => {
    try {
      const url = await storeService.getOrderDocumentDownloadUrl(order.id, doc.id);
      window.open(url, '_blank');
    } catch {
      setError('Could not generate a download link — try again.');
    }
  };

  const handleDeleteDoc = async (doc: OrderDocument) => {
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    await storeService.deleteOrderDocument(order.id, doc.id);
  };

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <button className="order-modal__close" onClick={onClose}>×</button>

        <div className="order-modal__header">
          <div>
            <span className="order-modal__order-id">Order #{order.id.slice(-8).toUpperCase()}</span>
            <h2 className="order-modal__company">{isCompanyView ? `${order.user?.firstName} ${order.user?.lastName}` : (order.company?.name || 'Ornave Marketplace')}</h2>
            <span className="order-modal__date">Placed {formatDate(order.createdAt)}</span>
          </div>
          <span className={`order-modal__status order-modal__status--${order.status.toLowerCase()}`}>{order.status}</span>
        </div>

        {onViewCompany && (
          <button className="order-modal__company-link" onClick={onViewCompany}>
            View all orders with this company ›
          </button>
        )}

        {!isCompanyView && order.trackingNumber && (
          <p className="order-modal__tracking">Tracking: <strong>{order.trackingNumber}</strong></p>
        )}

        {isCompanyView && (
          <div className="order-modal__section order-modal__status-editor">
            <h3 className="order-modal__section-title">Update Order</h3>
            <div className="order-modal__status-editor-row">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </select>
              <input
                placeholder="Tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
              <button className="order-modal__save-btn" onClick={handleSaveStatus} disabled={isSavingStatus}>
                {isSavingStatus ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="order-modal__error">{error}</p>}

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

        <div className="order-modal__section">
          <div className="order-modal__section-header-row">
            <h3 className="order-modal__section-title" style={{ margin: 0 }}>Receipts &amp; Documents</h3>
            {isCompanyView && (
              <button className="order-modal__upload-btn" onClick={() => fileInputRef.current?.click()}>+ Upload</button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFilePick}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
            />
          </div>

          {uploadingFiles.length > 0 && (
            <div className="order-modal__uploading">
              {uploadingFiles.map((u) => (
                <div key={u.key} className="order-modal__uploading-row">
                  <span>{u.name}</span>
                  <div className="order-modal__uploading-bar">
                    <div className="order-modal__uploading-bar-fill" style={{ width: `${u.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoadingDocs ? (
            <p className="order-modal__block-text">Loading…</p>
          ) : documents.length === 0 ? (
            <p className="order-modal__block-text">
              {isCompanyView ? 'No documents attached yet.' : "The seller hasn't attached anything for this order yet."}
            </p>
          ) : (
            <div className="order-modal__documents">
              {documents.map((doc) => (
                <div key={doc.id} className="order-modal__document">
                  <div>
                    <span className="order-modal__document-name">{doc.name}</span>
                    <span className="order-modal__document-meta">{formatBytes(doc.size)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="order-modal__doc-btn" onClick={() => handleDownload(doc)}>Download</button>
                    {isCompanyView && (
                      <button className="order-modal__doc-btn order-modal__doc-btn--danger" onClick={() => handleDeleteDoc(doc)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
