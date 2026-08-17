import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { ThemedSelect } from '@/components/ui/ThemedSelect';
import { ThemedDatePicker } from '@/components/ui/ThemedDatePicker';
import { workSuiteService, FinanceEntry, FinanceEntryType } from '@/services/workSuiteService';
import { IconEdit, IconClose } from '@/components/ui/Icons';
import './WorkSuite.css';

type SectionFilter = 'ALL' | FinanceEntryType;

const SECTIONS: { key: SectionFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'INCOME', label: 'Income' },
  { key: 'EXPENSE', label: 'Expenses' },
];

type SortOrder = 'newest' | 'oldest' | 'amount';

function formatMoney(amount: number): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const WorkSuiteFinancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState<SectionFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [entryType, setEntryType] = useState<FinanceEntryType>('INCOME');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryCategory, setEntryCategory] = useState('');
  const [entryStatus, setEntryStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [entryDate, setEntryDate] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setEntries(await workSuiteService.listFinanceEntries());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const openCreate = () => {
    setEditingEntry(null);
    setEntryType(section === 'EXPENSE' ? 'EXPENSE' : 'INCOME');
    setEntryAmount('');
    setEntryDescription('');
    setEntryCategory('');
    setEntryStatus('PAID');
    setEntryDate(new Date().toISOString().slice(0, 10));
    setEntryNotes('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (entry: FinanceEntry) => {
    setEditingEntry(entry);
    setEntryType(entry.type);
    setEntryAmount(String(entry.amount));
    setEntryDescription(entry.description);
    setEntryCategory(entry.category || '');
    setEntryStatus(entry.status);
    setEntryDate(entry.date.slice(0, 10));
    setEntryNotes(entry.notes || '');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    const amountNum = parseFloat(entryAmount);
    if (!entryDescription.trim() || !entryDate || Number.isNaN(amountNum) || amountNum <= 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        type: entryType,
        amount: amountNum,
        description: entryDescription.trim(),
        category: entryCategory.trim() || undefined,
        status: entryType === 'INCOME' ? entryStatus : 'PAID' as const,
        date: entryDate,
        notes: entryNotes.trim() || undefined,
      };
      if (editingEntry) {
        await workSuiteService.updateFinanceEntry(editingEntry.id, payload);
      } else {
        await workSuiteService.createFinanceEntry(payload);
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that entry — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entry: FinanceEntry) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await workSuiteService.deleteFinanceEntry(entry.id);
    } catch {
      await load();
    }
  };

  const totals = useMemo(() => {
    const now = new Date();
    const monthEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const income = monthEntries.filter((e) => e.type === 'INCOME').reduce((sum, e) => sum + e.amount, 0);
    const expense = monthEntries.filter((e) => e.type === 'EXPENSE').reduce((sum, e) => sum + e.amount, 0);
    return { income, expense, net: income - expense };
  }, [entries]);

  const counts = useMemo(() => {
    const c: Record<SectionFilter, number> = { ALL: entries.length, INCOME: 0, EXPENSE: 0 };
    for (const e of entries) c[e.type] += 1;
    return c;
  }, [entries]);

  const visibleEntries = useMemo(() => {
    let list = section === 'ALL' ? entries : entries.filter((e) => e.type === section);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => e.description.toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sortOrder === 'newest') sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else if (sortOrder === 'oldest') sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    else sorted.sort((a, b) => b.amount - a.amount);
    return sorted;
  }, [entries, section, search, sortOrder]);

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Finance</h1>
          <p className="worksuite-page__subtitle">Track what you're earning and spending.</p>
        </div>
      </div>

      <div className="worksuite-page__container worksuite-page__container--wide">
        {!isLoading && (
          <div className="goal-stats-strip">
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value" style={{ color: '#3f6f47' }}>${formatMoney(totals.income)}</span>
              <span className="goal-stats-strip__label">Income this month</span>
            </div>
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value" style={{ color: '#a2504b' }}>${formatMoney(totals.expense)}</span>
              <span className="goal-stats-strip__label">Expenses this month</span>
            </div>
            <div className="goal-stats-strip__item">
              <span className="goal-stats-strip__value">${formatMoney(totals.net)}</span>
              <span className="goal-stats-strip__label">Net this month</span>
            </div>
          </div>
        )}

        <div className="worksuite-page__header-row">
          <div />
          <button className="worksuite-create-btn" onClick={openCreate}>+ New Entry</button>
        </div>

        <div className="worksuite-jobs-layout">
          <aside className="worksuite-jobs-sidebar">
            <nav className="worksuite-jobs-nav">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  className={`worksuite-jobs-nav-item${section === s.key ? ' worksuite-jobs-nav-item--active' : ''}`}
                  onClick={() => setSection(s.key)}
                >
                  <span className="worksuite-jobs-nav-item__left"><span>{s.label}</span></span>
                  <span className="worksuite-jobs-nav-item__count">{counts[s.key]}</span>
                </button>
              ))}
            </nav>

            <div className="worksuite-jobs-filters">
              <h4>Filter</h4>
              <input
                className="input"
                placeholder="Search description or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ThemedSelect
                value={sortOrder}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'amount', label: 'Highest amount' },
                ]}
                onChange={(v) => setSortOrder(v as SortOrder)}
              />
            </div>
          </aside>

          <div className="worksuite-jobs-feed">
            {isLoading ? (
              <div className="worksuite-empty">Loading entries…</div>
            ) : visibleEntries.length === 0 ? (
              <div className="worksuite-empty worksuite-empty--goals">
                <p>{search.trim() ? 'No entries match your search.' : 'Nothing logged yet — add your first entry.'}</p>
                <button className="worksuite-create-btn" onClick={openCreate}>+ New Entry</button>
              </div>
            ) : (
              visibleEntries.map((entry) => {
                const isIncome = entry.type === 'INCOME';
                const color = isIncome ? '#3f6f47' : '#a2504b';
                return (
                  <div key={entry.id} className="worksuite-job-post" style={{ borderLeft: `4px solid ${color}` }}>
                    <div className="worksuite-job-post__top">
                      <div>
                        <h3 className="worksuite-job-post__role">{entry.description}</h3>
                        {entry.category && <p className="worksuite-job-post__company">{entry.category}</p>}
                      </div>
                      <span className="worksuite-job-post__badge" style={{ background: color, color: '#14140f' }}>
                        {isIncome ? '+' : '−'}${formatMoney(entry.amount)}
                      </span>
                    </div>

                    <div className="worksuite-job-post__meta">
                      <span>{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {isIncome && <span>{entry.status === 'PAID' ? 'Paid' : 'Pending'}</span>}
                    </div>

                    {entry.notes && <p className="worksuite-job-post__notes">{entry.notes}</p>}

                    <div className="worksuite-job-post__footer">
                      <div />
                      <div className="worksuite-job-post__actions">
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => openEdit(entry)} title="Edit"><IconEdit size={13} /></button>
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDelete(entry)} title="Delete"><IconClose size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEntry ? 'Edit Entry' : 'New Entry'}</h2>

            <label>Type</label>
            <ThemedSelect
              value={entryType}
              options={[
                { value: 'INCOME', label: 'Income' },
                { value: 'EXPENSE', label: 'Expense' },
              ]}
              onChange={(v) => setEntryType(v as FinanceEntryType)}
            />

            <label>Description</label>
            <input value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} placeholder="Freelance invoice — Acme Corp" maxLength={200} />

            <div className="worksuite-jobs-cv-form-row">
              <div>
                <label>Amount ($)</label>
                <input type="number" min="0" step="0.01" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label>Category</label>
                <input value={entryCategory} onChange={(e) => setEntryCategory(e.target.value)} placeholder="Freelance, Rent…" maxLength={80} />
              </div>
            </div>

            <label>Date</label>
            <ThemedDatePicker value={entryDate} onChange={setEntryDate} />

            {entryType === 'INCOME' && (
              <>
                <label>Status</label>
                <ThemedSelect
                  value={entryStatus}
                  options={[
                    { value: 'PAID', label: 'Paid' },
                    { value: 'PENDING', label: 'Pending' },
                  ]}
                  onChange={(v) => setEntryStatus(v as 'PAID' | 'PENDING')}
                />
              </>
            )}

            <label>Notes</label>
            <textarea value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)} rows={2} placeholder="Optional details" maxLength={500} />

            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              {editingEntry && (
                <button
                  className="worksuite-modal__cancel"
                  style={{ color: 'var(--color-danger)', marginRight: 'auto' }}
                  onClick={async () => { await handleDelete(editingEntry); setShowModal(false); }}
                >
                  Delete
                </button>
              )}
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="worksuite-modal__submit"
                onClick={handleSave}
                disabled={!entryDescription.trim() || !entryDate || !entryAmount || Number(entryAmount) <= 0 || isSaving}
              >
                {isSaving ? 'Saving…' : editingEntry ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
