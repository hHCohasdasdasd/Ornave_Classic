import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { Transaction } from '@/types';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { erpNavigation } from '@/constants/navigation';

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
      return;
    }

    loadTransactions();
  }, [company, user, navigate]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getReceivedTransactions(company!.id);
      setTransactions(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId: string, newStatus: string) => {
    try {
      await apiClient.updateTransactionStatus(company!.id, transactionId, newStatus);
      await loadTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    }
  };

  return (
    <PageContainer
      title="Transactions"
      subtitle="View and manage incoming transactions."
      sidebarItems={erpNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '1000px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        <h3 style={{ marginBottom: 'var(--space-2)' }}>Received Transactions ({transactions.length})</h3>
        {transactions.length === 0 ? (
          <p className="muted-text">No transactions received yet</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>From Company</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.fromCompanyId}</td>
                  <td>${(txn.data as any)?.amount ?? ''}</td>
                  <td>{txn.type}</td>
                  <td>
                    <span className={`status-badge ${txn.status === 'PENDING' ? 'status-badge--warning' : 'status-badge--success'}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td>{new Date(txn.createdAt).toLocaleDateString()}</td>
                  <td>
                    {txn.status === 'PENDING' && (
                      <Button onClick={() => handleUpdateStatus(txn.id, 'COMPLETED')}>Accept</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageContainer>
  );
};
