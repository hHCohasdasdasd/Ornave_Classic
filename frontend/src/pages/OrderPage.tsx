import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { firmService } from '@/services/firmService';
import { FirmMenuItem, FirmTableOrder } from '@/types/firm';
import './OrderPage.css';

// Reached via the QR code printed for a physical table (see the "Table
// Order QR Code" section in the Floor Plan editor) — fully public, no
// login, since whoever's actually sitting at the table may not be the
// account that made the reservation. Polls the order every few seconds so
// everyone at the table sees the same running tab as different people add
// to it from their own phones.
const POLL_INTERVAL_MS = 5000;

export const OrderPage: React.FC = () => {
  const { companyId, tableId } = useParams<{ companyId: string; tableId: string }>();

  const [companyName, setCompanyName] = useState('');
  const [menuItems, setMenuItems] = useState<FirmMenuItem[]>([]);
  const [order, setOrder] = useState<FirmTableOrder | null | undefined>(undefined);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async () => {
    if (!companyId || !tableId) return;
    setOrder(await firmService.getTableOrder(companyId, tableId));
  };

  useEffect(() => {
    if (!companyId || !tableId) return;
    firmService.getCompanyBasicInfo(companyId).then((c) => setCompanyName(c?.name || ''));
    firmService.getMenuItems(companyId, { includeUnavailable: true }).then(setMenuItems);
    loadOrder();

    const interval = setInterval(loadOrder, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, tableId]);

  const handleAddItem = async (menuItemId: string) => {
    if (!companyId || !tableId) return;
    setAddingId(menuItemId);
    setError(null);
    try {
      await firmService.addOrderItem(companyId, tableId, { menuItemId, quantity: 1 });
      await loadOrder();
    } catch (err: any) {
      setError(err.message || 'Could not add that item — try again.');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!companyId || !tableId) return;
    setOrder((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev));
    try {
      await firmService.removeOrderItem(companyId, tableId, itemId);
      await loadOrder();
    } catch {
      await loadOrder();
    }
  };

  const categories = Array.from(new Set(menuItems.map((i) => i.category)));

  if (order === undefined) {
    return <div className="order-page order-page--center"><p>Loading…</p></div>;
  }

  if (order === null) {
    return (
      <div className="order-page order-page--center">
        <h1>{companyName || 'Order'}</h1>
        <p className="order-page__hint">
          No active reservation found for this table right now — please ask a staff member for help.
        </p>
      </div>
    );
  }

  return (
    <div className="order-page">
      <header className="order-page__header">
        <h1>{companyName}</h1>
        <p className="order-page__hint">Party of {order.partySize} — add items below, order as many rounds as you like.</p>
      </header>

      {error && <p className="order-page__error">{error}</p>}

      <main className="order-page__menu">
        {categories.map((category) => (
          <section key={category} className="order-page__category">
            <h2>{category}</h2>
            {menuItems.filter((i) => i.category === category).map((item) => (
              <div key={item.id} className={`order-page__item${item.isAvailable === false ? ' order-page__item--unavailable' : ''}`}>
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="order-page__item-image" />}
                <div className="order-page__item-info">
                  <div className="order-page__item-name">
                    {item.name}
                    {item.isAvailable === false && <span className="order-page__unavailable-tag">Currently unavailable</span>}
                  </div>
                  {item.description && <div className="order-page__item-desc">{item.description}</div>}
                </div>
                <div className="order-page__item-price">{item.price}</div>
                <button
                  className="order-page__add-btn"
                  onClick={() => handleAddItem(item.id)}
                  disabled={addingId === item.id || item.isAvailable === false}
                >
                  {item.isAvailable === false ? 'Unavailable' : addingId === item.id ? '…' : '+ Add'}
                </button>
              </div>
            ))}
          </section>
        ))}
        {menuItems.length === 0 && <p className="order-page__hint">No menu items available right now.</p>}
      </main>

      <footer className="order-page__cart">
        <h2>Your Order</h2>
        {order.items.length === 0 ? (
          <p className="order-page__hint">Nothing ordered yet.</p>
        ) : (
          <>
            <div className="order-page__cart-list">
              {order.items.map((item) => (
                <div key={item.id} className="order-page__cart-row">
                  <span>{item.quantity}× {item.name}</span>
                  <span className="order-page__cart-row-right">
                    {item.price}
                    <button className="order-page__remove-btn" onClick={() => handleRemoveItem(item.id)} title="Remove">×</button>
                  </span>
                </div>
              ))}
            </div>
            <div className="order-page__total">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </>
        )}
      </footer>
    </div>
  );
};
