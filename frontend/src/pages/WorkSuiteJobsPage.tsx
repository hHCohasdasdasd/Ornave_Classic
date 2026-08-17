import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { ThemedSelect } from '@/components/ui/ThemedSelect';
import { ThemedDatePicker } from '@/components/ui/ThemedDatePicker';
import { workSuiteService, JobApplication, JobApplicationStatus } from '@/services/workSuiteService';
import './WorkSuite.css';

type SectionFilter = 'ALL' | JobApplicationStatus;

const SECTIONS: { key: SectionFilter; label: string; icon: string }[] = [
  { key: 'ALL', label: 'All', icon: '📋' },
  { key: 'SAVED', label: 'Saved', icon: '🔖' },
  { key: 'APPLIED', label: 'Applied', icon: '📤' },
  { key: 'INTERVIEWING', label: 'Interviewing', icon: '🗣️' },
  { key: 'OFFER', label: 'Offer', icon: '🎉' },
  { key: 'REJECTED', label: 'Rejected', icon: '✕' },
];

const STATUS_LABEL: Record<JobApplicationStatus, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
};

const STATUS_COLOR: Record<JobApplicationStatus, string> = {
  SAVED: '#7d8694',
  APPLIED: '#6b8cae',
  INTERVIEWING: '#c6a15b',
  OFFER: '#3f6f47',
  REJECTED: '#a2504b',
};

type SortOrder = 'newest' | 'oldest' | 'company';

export const WorkSuiteJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState<SectionFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setJobApplications(await workSuiteService.listJobApplications());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const openCreate = () => {
    setEditingJob(null);
    setCompany('');
    setRole('');
    setUrl('');
    setNotes('');
    setAppliedDate('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (job: JobApplication) => {
    setEditingJob(job);
    setCompany(job.company);
    setRole(job.role);
    setUrl(job.url || '');
    setNotes(job.notes || '');
    setAppliedDate(job.appliedDate ? job.appliedDate.slice(0, 10) : '');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!company.trim() || !role.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        company: company.trim(),
        role: role.trim(),
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        appliedDate: appliedDate || undefined,
      };
      if (editingJob) {
        await workSuiteService.updateJobApplication(editingJob.id, payload);
      } else {
        const created = await workSuiteService.createJobApplication(payload);
        const initialStatus = section !== 'ALL' ? section : 'SAVED';
        if (initialStatus !== 'SAVED') {
          await workSuiteService.updateJobApplicationStatus(created.id, initialStatus);
        }
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that application — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const moveJob = async (job: JobApplication, status: JobApplicationStatus) => {
    if (job.status === status) return;
    setJobApplications((prev) => prev.map((j) => (j.id === job.id ? { ...j, status } : j)));
    try {
      await workSuiteService.updateJobApplicationStatus(job.id, status);
    } catch {
      await load();
    }
  };

  const handleDelete = async (job: JobApplication) => {
    setJobApplications((prev) => prev.filter((j) => j.id !== job.id));
    try {
      await workSuiteService.deleteJobApplication(job.id);
    } catch {
      await load();
    }
  };

  const counts = useMemo(() => {
    const c: Record<SectionFilter, number> = { ALL: jobApplications.length, SAVED: 0, APPLIED: 0, INTERVIEWING: 0, OFFER: 0, REJECTED: 0 };
    for (const j of jobApplications) c[j.status] += 1;
    return c;
  }, [jobApplications]);

  const visibleJobs = useMemo(() => {
    let list = section === 'ALL' ? jobApplications : jobApplications.filter((j) => j.status === section);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((j) => j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q));
    }

    const sorted = [...list];
    if (sortOrder === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      sorted.sort((a, b) => a.company.localeCompare(b.company));
    }
    return sorted;
  }, [jobApplications, section, search, sortOrder]);

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Jobs</h1>
          <p className="worksuite-page__subtitle">Track the roles you're pursuing, from saved to offer.</p>
        </div>
      </div>

      <div className="worksuite-page__container worksuite-page__container--wide">
        <div className="worksuite-page__header-row">
          <div />
          <button className="worksuite-create-btn" onClick={openCreate}>+ New Application</button>
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
                  <span className="worksuite-jobs-nav-item__left">
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </span>
                  <span className="worksuite-jobs-nav-item__count">{counts[s.key]}</span>
                </button>
              ))}
            </nav>

            <div className="worksuite-jobs-filters">
              <h4>Filter</h4>
              <input
                className="input"
                placeholder="Search company or role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ThemedSelect
                value={sortOrder}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'company', label: 'Company A–Z' },
                ]}
                onChange={(v) => setSortOrder(v as SortOrder)}
              />
            </div>
          </aside>

          <div className="worksuite-jobs-feed">
            {isLoading ? (
              <div className="worksuite-empty">Loading applications…</div>
            ) : visibleJobs.length === 0 ? (
              <div className="worksuite-empty worksuite-empty--goals">
                <div className="worksuite-empty__icon">💼</div>
                <p>{search.trim() ? 'No applications match your search.' : 'Nothing here yet — add a role you\'re pursuing.'}</p>
                <button className="worksuite-create-btn" onClick={openCreate}>+ New Application</button>
              </div>
            ) : (
              visibleJobs.map((job) => {
                const color = STATUS_COLOR[job.status];
                return (
                  <div key={job.id} className="worksuite-job-post" style={{ borderLeft: `4px solid ${color}` }}>
                    <div className="worksuite-job-post__top">
                      <div>
                        <h3 className="worksuite-job-post__role">{job.role}</h3>
                        <p className="worksuite-job-post__company">🏢 {job.company}</p>
                      </div>
                      <span className="worksuite-job-post__badge" style={{ background: color, color: '#14140f' }}>
                        {STATUS_LABEL[job.status]}
                      </span>
                    </div>

                    <div className="worksuite-job-post__meta">
                      {job.appliedDate && <span>Applied {new Date(job.appliedDate).toLocaleDateString()}</span>}
                      <span>Added {new Date(job.createdAt).toLocaleDateString()}</span>
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer">🔗 View posting</a>
                      )}
                    </div>

                    {job.notes && <p className="worksuite-job-post__notes">{job.notes}</p>}

                    <div className="worksuite-job-post__footer">
                      <ThemedSelect
                        value={job.status}
                        options={SECTIONS.filter((s) => s.key !== 'ALL').map((s) => ({ value: s.key, label: s.label }))}
                        onChange={(v) => moveJob(job, v as JobApplicationStatus)}
                        title="Move to another stage"
                      />
                      <div className="worksuite-job-post__actions">
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => openEdit(job)} title="Edit">✎</button>
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDelete(job)} title="Delete">✕</button>
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
            <h2>{editingJob ? 'Edit Application' : 'New Application'}</h2>
            <label>Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" maxLength={160} />
            <label>Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Product Designer" maxLength={160} />
            <label>Posting URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" maxLength={500} />
            <label>Applied Date</label>
            <ThemedDatePicker value={appliedDate} onChange={setAppliedDate} />
            <label>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Recruiter contact, interview prep, salary range…" maxLength={1000} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!company.trim() || !role.trim() || isSaving}>
                {isSaving ? 'Saving…' : editingJob ? 'Save Changes' : 'Create Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
