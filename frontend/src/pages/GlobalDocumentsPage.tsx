import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { globalNavigation } from '@/constants/navigation';

export const GlobalDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [form, setForm] = useState({ companyId: '', fileUrl: '', type: 'invoice' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadDocuments = async () => {
      try {
        const response = await apiClient.getGlobalDocuments();
        setDocuments(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load documents');
      }
    };

    loadDocuments();
  }, [user, navigate]);

  const handleUpload = async () => {
    try {
      await apiClient.uploadGlobalDocument(form);
      const response = await apiClient.getGlobalDocuments();
      setDocuments(response.data || []);
      setForm({ companyId: '', fileUrl: '', type: 'invoice' });
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    }
  };

  return (
    <PageContainer
      title="Documents"
      subtitle="Upload and manage documents with companies."
      sidebarItems={globalNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '700px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        <Card style={{ marginBottom: 'var(--space-3)' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Upload Document</h3>
          <div className="form">
            <input
              className="input"
              placeholder="Company ID"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            />
            <input
              className="input"
              placeholder="File URL"
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            />
            <input
              className="input"
              placeholder="Document type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <Button onClick={handleUpload}>Upload</Button>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Document Vault</h3>
          {documents.length === 0 ? (
            <p className="muted-text">No documents yet.</p>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {documents.map((doc) => (
                <li key={doc.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
                  <strong>{doc.type}</strong> — {doc.fileUrl}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
