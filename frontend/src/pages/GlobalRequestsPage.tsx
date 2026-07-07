import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { globalNavigation } from '@/constants/navigation';

export const GlobalRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ companyId: '', type: 'maintenance', title: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadRequests = async () => {
      try {
        const response = await apiClient.getGlobalRequests();
        setRequests(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load requests');
      }
    };

    loadRequests();
  }, [user]);

  const handleSubmit = async () => {
    try {
      await apiClient.createGlobalRequest(form);
      const response = await apiClient.getGlobalRequests();
      setRequests(response.data || []);
      setForm({ companyId: '', type: 'maintenance', title: '', description: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to create request');
    }
  };

  return (
    <PageContainer
      title="Requests"
      subtitle="Submit and track requests to companies."
      sidebarItems={globalNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '700px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        <Card style={{ marginBottom: 'var(--space-3)' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Create Request</h3>
          <div className="form">
            <input
              className="input"
              placeholder="Company ID"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            />
            <input
              className="input"
              placeholder="Type (maintenance, payment_question)"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <input
              className="input"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="textarea"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Button onClick={handleSubmit}>Submit Request</Button>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Your Requests</h3>
          {requests.length === 0 ? (
            <p className="muted-text">No requests yet.</p>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {requests.map((req) => (
                <li key={req.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
                  <strong>{req.title}</strong> — {req.status}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
