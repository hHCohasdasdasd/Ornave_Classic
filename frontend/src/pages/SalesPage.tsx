import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { salesService } from '@/services/salesService';
import './SalesPage.css';
import '@/pages/WorkSuite.css';

interface Deal {
  id: string;
  name: string;
  clientCompany: string;
  value: number;
  stage: 'Prospect' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  owner: string;
  closeDate: string;
}

const stageColors: Record<Deal['stage'], string> = {
  'Prospect': 'stage--prospect',
  'Qualified': 'stage--qualified',
  'Proposal': 'stage--proposal',
  'Negotiation': 'stage--negotiation',
  'Closed Won': 'stage--won',
  'Closed Lost': 'stage--lost',
};

const pipelineStages: Deal['stage'][] = ['Prospect', 'Qualified', 'Proposal', 'Negotiation'];
const allStages: Deal['stage'][] = ['Prospect', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

export const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'contacts' | 'activity'>('pipeline');
  const [keyword, setKeyword] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<Deal['stage']>('Prospect');
  const [owner, setOwner] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId;

  const load = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await salesService.listDeals(companyId);
      setDeals(data.map(d => ({
        id: d.id,
        name: d.name,
        clientCompany: d.clientCompany || '',
        value: d.value,
        stage: d.stage,
        owner: d.owner || '',
        closeDate: d.closeDate || '',
      })));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) load();
    else setIsLoading(false);
  }, [companyId]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const openCreate = () => {
    setName('');
    setClientCompany('');
    setValue('');
    setStage('Prospect');
    setOwner('');
    setCloseDate('');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !companyId) return;
    setIsSaving(true);
    setError(null);
    try {
      await salesService.createDeal(companyId, {
        name: name.trim(),
        clientCompany: clientCompany.trim() || undefined,
        value: parseFloat(value) || 0,
        stage,
        owner: owner.trim() || undefined,
        closeDate: closeDate || undefined,
      });
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that deal — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (deal: Deal) => {
    if (!companyId) return;
    await salesService.deleteDeal(companyId, deal.id);
    await load();
  };

  const handleStageChange = async (deal: Deal, newStage: Deal['stage']) => {
    if (!companyId) return;
    await salesService.updateDeal(companyId, deal.id, { stage: newStage });
    await load();
  };

  const filtered = deals.filter(d =>
    keyword === '' ||
    d.name.toLowerCase().includes(keyword.toLowerCase()) ||
    d.clientCompany.toLowerCase().includes(keyword.toLowerCase())
  );

  const totalPipeline = deals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="sales-page">
      <Navbar />

      {/* Search Banner */}
      <div className="sales-page__search-banner">
        <div className="sales-page__search-container">
          <div className="sales-search">
            <div className="sales-search__field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#a79e8c" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#a79e8c" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="text"
                placeholder="Search deals or companies..."
                className="sales-search__input"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <button className="sales-search__btn" onClick={openCreate}>+ New Deal</button>
          </div>
        </div>
      </div>

      <div className="sales-page__container">
        {/* Stats */}
        <div className="sales-stats">
          <div className="sales-stat">
            <div className="sales-stat__label">Total Pipeline</div>
            <div className="sales-stat__value">€{totalPipeline.toLocaleString()}</div>
          </div>
          <div className="sales-stat">
            <div className="sales-stat__label">Deals in Progress</div>
            <div className="sales-stat__value">{deals.filter(d => !d.stage.startsWith('Closed')).length}</div>
          </div>
          <div className="sales-stat">
            <div className="sales-stat__label">Won This Month</div>
            <div className="sales-stat__value sales-stat__value--green">{deals.filter(d => d.stage === 'Closed Won').length}</div>
          </div>
          <div className="sales-stat">
            <div className="sales-stat__label">Win Rate</div>
            <div className="sales-stat__value sales-stat__value--green">
              {(() => {
                const closed = deals.filter(d => d.stage.startsWith('Closed'));
                if (closed.length === 0) return '0%';
                return `${Math.round((deals.filter(d => d.stage === 'Closed Won').length / closed.length) * 100)}%`;
              })()}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sales-page__tabs">
          {(['pipeline', 'contacts', 'activity'] as const).map(tab => (
            <button
              key={tab}
              className={`sales-page__tab${activeTab === tab ? ' sales-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div>
            {isLoading ? (
              <div className="worksuite-empty">Loading deals…</div>
            ) : (
              <>
                {/* Kanban by Stage */}
                <div className="sales-kanban">
                  {pipelineStages.map(stage => (
                    <div key={stage} className="sales-kanban__column">
                      <div className="sales-kanban__col-header">
                        <span>{stage}</span>
                        <span className="sales-kanban__col-count">
                          {filtered.filter(d => d.stage === stage).length}
                        </span>
                      </div>
                      <div className="sales-kanban__cards">
                        {filtered.filter(d => d.stage === stage).map(deal => (
                          <div key={deal.id} className="sales-deal-card">
                            <div className="sales-deal-card__name">{deal.name}</div>
                            <div className="sales-deal-card__company">{deal.clientCompany}</div>
                            <div className="sales-deal-card__value">€{deal.value.toLocaleString()}</div>
                            <div className="sales-deal-card__footer">
                              <span className="sales-deal-card__owner">{deal.owner}</span>
                              <span className="sales-deal-card__close">{deal.closeDate}</span>
                            </div>
                            <div className="sales-deal-card__footer" style={{ marginTop: 8, gap: 6 }}>
                              <select
                                value={deal.stage}
                                onChange={e => handleStageChange(deal, e.target.value as Deal['stage'])}
                                style={{ fontSize: 12 }}
                              >
                                {allStages.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(deal)}>Delete</button>
                            </div>
                          </div>
                        ))}
                        {filtered.filter(d => d.stage === stage).length === 0 && (
                          <div className="sales-kanban__empty">No deals</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Closed deals */}
                <div className="sales-closed-section">
                  <h2 className="sales-section-title">Closed Deals</h2>
                  <div className="sales-closed-list">
                    {filtered.filter(d => d.stage.startsWith('Closed')).map(deal => (
                      <div key={deal.id} className="sales-closed-item">
                        <div>
                          <div className="sales-closed-item__name">{deal.name}</div>
                          <div className="sales-closed-item__company">{deal.clientCompany}</div>
                        </div>
                        <div className="sales-closed-item__right">
                          <div className="sales-closed-item__value">€{deal.value.toLocaleString()}</div>
                          <span className={`deal-stage ${stageColors[deal.stage]}`}>{deal.stage}</span>
                          <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(deal)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Contacts placeholder */}
        {activeTab === 'contacts' && (
          <div className="sales-placeholder">
            <div className="sales-placeholder__icon">👤</div>
            <div className="sales-placeholder__title">CRM Contacts</div>
            <p className="sales-placeholder__text">Manage your client and prospect contacts, track interactions, and build relationships.</p>
            <button className="sales-placeholder__btn">Import Contacts</button>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="sales-placeholder">
            <div className="sales-placeholder__icon">📈</div>
            <div className="sales-placeholder__title">Sales Activity</div>
            <p className="sales-placeholder__text">Track calls, emails, meetings and follow-ups across your entire pipeline.</p>
            <button className="sales-placeholder__btn">Log Activity</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Deal</h2>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Deal name" maxLength={120} />
            <label>Client Company</label>
            <input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Value (€)</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
            <label>Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value as Deal['stage'])}>
              {allStages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label>Owner</label>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Optional" maxLength={120} />
            <label>Close Date</label>
            <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!name.trim() || isSaving}>
                {isSaving ? 'Saving…' : 'Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
