import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import './BillingPage.css';

interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

const mockInvoices: Invoice[] = [
  { id: 'INV-2026-003', date: 'Mar 1, 2026', description: 'Ornave Business Premium – March 2026', amount: '€89.00', status: 'Paid' },
  { id: 'INV-2026-002', date: 'Feb 1, 2026', description: 'Ornave Business Premium – February 2026', amount: '€89.00', status: 'Paid' },
  { id: 'INV-2026-001', date: 'Jan 1, 2026', description: 'Ornave Business Premium – January 2026', amount: '€89.00', status: 'Paid' },
  { id: 'INV-2025-012', date: 'Dec 1, 2025', description: 'Ornave Business Premium – December 2025', amount: '€89.00', status: 'Paid' },
];

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payment'>('overview');

  return (
    <>
      <ProtectedPageOverlay isVisible={!user} />
      <div className="billing-page">
        <Navbar />

      <div className="billing-page__container">
        <div className="billing-page__header">
          <h1 className="billing-page__title">Manage Billing</h1>
          <p className="billing-page__subtitle">Manage your plan, payment methods, and billing history.</p>
        </div>

        {/* Tabs */}
        <div className="billing-page__tabs">
          {(['overview', 'invoices', 'payment'] as const).map(tab => (
            <button
              key={tab}
              className={`billing-page__tab${activeTab === tab ? ' billing-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'payment' ? 'Payment Methods' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="billing-overview">
            {/* Current Plan */}
            <div className="billing-plan-card">
              <div className="billing-plan-card__badge">Current Plan</div>
              <div className="billing-plan-card__name">Ornave Business Premium</div>
              <div className="billing-plan-card__price">€89<span>/month</span></div>
              <div className="billing-plan-card__renews">Renews April 1, 2026</div>
              <div className="billing-plan-card__features">
                <div className="billing-feature">✓ Unlimited lead searches</div>
                <div className="billing-feature">✓ Advanced talent insights</div>
                <div className="billing-feature">✓ AI-powered hiring tools</div>
                <div className="billing-feature">✓ Priority support</div>
                <div className="billing-feature">✓ Unlimited group membership</div>
              </div>
              <div className="billing-plan-card__actions">
                <button className="billing-btn billing-btn--secondary">Change Plan</button>
                <button className="billing-btn billing-btn--danger">Cancel Subscription</button>
              </div>
            </div>

            {/* Usage */}
            <div className="billing-usage">
              <h2 className="billing-section-title">Usage This Month</h2>
              <div className="billing-usage-grid">
                <div className="billing-usage-item">
                  <div className="billing-usage-item__label">Lead Searches</div>
                  <div className="billing-usage-item__bar-wrap">
                    <div className="billing-usage-item__bar" style={{ width: '62%' }} />
                  </div>
                  <div className="billing-usage-item__count">186 / ∞</div>
                </div>
                <div className="billing-usage-item">
                  <div className="billing-usage-item__label">Messages Sent</div>
                  <div className="billing-usage-item__bar-wrap">
                    <div className="billing-usage-item__bar" style={{ width: '40%' }} />
                  </div>
                  <div className="billing-usage-item__count">82 / 200</div>
                </div>
                <div className="billing-usage-item">
                  <div className="billing-usage-item__label">Job Postings</div>
                  <div className="billing-usage-item__bar-wrap">
                    <div className="billing-usage-item__bar" style={{ width: '30%' }} />
                  </div>
                  <div className="billing-usage-item__count">3 / 10</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="billing-invoices">
            <h2 className="billing-section-title">Invoice History</h2>
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="billing-table__id">{inv.id}</td>
                    <td>{inv.date}</td>
                    <td>{inv.description}</td>
                    <td className="billing-table__amount">{inv.amount}</td>
                    <td>
                      <span className={`billing-status billing-status--${inv.status.toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <button className="billing-download-btn">↓ PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="billing-payment">
            <h2 className="billing-section-title">Payment Methods</h2>
            <div className="billing-card-list">
              <div className="billing-payment-card billing-payment-card--default">
                <div className="billing-payment-card__icon">💳</div>
                <div className="billing-payment-card__details">
                  <div className="billing-payment-card__name">Visa ending in 4242</div>
                  <div className="billing-payment-card__expiry">Expires 12/2028</div>
                </div>
                <span className="billing-payment-card__badge">Default</span>
              </div>
            </div>
            <button className="billing-btn billing-btn--primary" style={{ marginTop: '16px' }}>
              + Add Payment Method
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
