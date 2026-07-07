import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { globalNavigation } from '@/constants/navigation';

export const GlobalPaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [form, setForm] = useState({ companyId: '', erpInvoiceId: '', amount: 0, paymentMethod: 'bank_transfer' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadPayments = async () => {
      try {
        const response = await apiClient.getGlobalPayments();
        setPayments(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load payments');
      }
    };

    loadPayments();
  }, [user, navigate]);

  const handleCreate = async () => {
    try {
      await apiClient.createGlobalPayment(form);
      const response = await apiClient.getGlobalPayments();
      setPayments(response.data || []);
      setForm({ companyId: '', erpInvoiceId: '', amount: 0, paymentMethod: 'bank_transfer' });
    } catch (err: any) {
      setError(err.message || 'Failed to create payment');
    }
  };

  return (
    <PageContainer
      title="Payments"
      subtitle="Record and track payments to companies."
      sidebarItems={globalNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '700px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        <Card style={{ marginBottom: 'var(--space-3)' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Record Payment</h3>
          <div className="form">
            <input
              className="input"
              placeholder="Company ID"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            />
            <input
              className="input"
              placeholder="ERP Invoice ID"
              value={form.erpInvoiceId}
              onChange={(e) => setForm({ ...form, erpInvoiceId: e.target.value })}
            />
            <input
              className="input"
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
            <input
              className="input"
              placeholder="Payment Method"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            />
            <Button onClick={handleCreate}>Save Payment</Button>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Payment History</h3>
          {payments.length === 0 ? (
            <p className="muted-text">No payments yet.</p>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {payments.map((payment) => (
                <li key={payment.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
                  <strong>${payment.amount}</strong> — {payment.status}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
