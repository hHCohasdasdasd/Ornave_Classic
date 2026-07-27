import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { jobService, Job } from '@/services/jobService';

interface CompanyJobsTabProps {
  companySlug: string;
  companyName?: string;
  companyLogo?: string;
  canManage: boolean;
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const SALARY_PERIODS = [
  { value: 'year', label: 'a year' },
  { value: 'month', label: 'a month' },
  { value: 'hour', label: 'an hour' },
];

const fieldStyle: React.CSSProperties = {
  padding: '10px',
  background: 'var(--color-bg)',
  border: '1px solid var(--tech-border)',
  color: 'var(--color-text)',
};

const formatSalary = (job: Job): string | null => {
  if (!job.salaryMin && !job.salaryMax) return null;
  const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;
  const periodLabel = SALARY_PERIODS.find((p) => p.value === job.salaryPeriod)?.label || job.salaryPeriod;
  if (job.salaryMin && job.salaryMax && job.salaryMin !== job.salaryMax) {
    return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)} ${periodLabel}`;
  }
  return `${fmt(job.salaryMin || job.salaryMax || 0)} ${periodLabel}`;
};

export const CompanyJobsTab: React.FC<CompanyJobsTabProps> = ({ companySlug, companyName, companyLogo, canManage }) => {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Create-job form fields
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState(JOB_TYPES[0]);
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('year');
  const [benefitsInput, setBenefitsInput] = useState('');
  const [qualificationsInput, setQualificationsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const [expandedJob, setExpandedJob] = useState<Job | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!expandedJob) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expandedJob]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const id = await jobService.getCompanyIdBySlug(companySlug);
      if (cancelled) return;
      setCompanyId(id);
      if (id) {
        const list = await jobService.listJobs(id);
        if (!cancelled) setJobs(list);
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [companySlug]);

  const availableTypes = useMemo(() => Array.from(new Set(jobs.map((j) => j.type).filter(Boolean))), [jobs]);
  const availableLocations = useMemo(() => Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))) as string[], [jobs]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      if (typeFilter !== 'all' && job.type !== typeFilter) return false;
      if (locationFilter !== 'all' && job.location !== locationFilter) return false;
      if (q) {
        const haystack = `${job.title} ${job.location || ''} ${job.description || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, searchQuery, typeFilter, locationFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || locationFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setLocationFilter('all');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !title.trim()) return;
    setIsSubmitting(true);
    try {
      const job = await jobService.createJob(companyId, {
        title: title.trim(),
        location: location.trim() || undefined,
        type,
        description: description.trim() || undefined,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        salaryPeriod,
        benefits: benefitsInput.split(',').map((b) => b.trim()).filter(Boolean),
        qualifications: qualificationsInput.split('\n').map((q) => q.trim()).filter(Boolean),
      });
      setJobs((prev) => [job, ...prev]);
      setTitle('');
      setLocation('');
      setType(JOB_TYPES[0]);
      setDescription('');
      setSalaryMin('');
      setSalaryMax('');
      setSalaryPeriod('year');
      setBenefitsInput('');
      setQualificationsInput('');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!companyId) return;
    try {
      await jobService.deleteJob(companyId, jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setExpandedJob((prev) => (prev?.id === jobId ? null : prev));
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const formatPostedDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const openJob = (job: Job) => {
    setIsSaved(false);
    setExpandedJob(job);
  };

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Job Listings</h2>
        {canManage && (
          <button
            className="profile-section__action-btn"
            style={{ background: 'var(--color-primary)', color: '#14140f', fontWeight: 800 }}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'CANCEL' : '+ POST_A_JOB'}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', padding: '16px', border: '1px solid var(--tech-border)', background: 'rgba(246, 243, 237, 0.02)' }}>
          <input
            type="text"
            placeholder="Job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={fieldStyle}
          />
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Location (e.g. Remote, New York)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ ...fieldStyle, flex: '1 1 200px' }}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ ...fieldStyle, flex: '0 0 160px' }}
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="number"
              placeholder="Salary min (optional)"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              style={{ ...fieldStyle, flex: '1 1 140px' }}
            />
            <input
              type="number"
              placeholder="Salary max (optional)"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              style={{ ...fieldStyle, flex: '1 1 140px' }}
            />
            <select
              value={salaryPeriod}
              onChange={(e) => setSalaryPeriod(e.target.value)}
              style={{ ...fieldStyle, flex: '0 0 140px' }}
            >
              {SALARY_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>Per {p.value}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Full job description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
          <input
            type="text"
            placeholder="Benefits, comma separated (e.g. Health insurance, 401(k), Paid time off)"
            value={benefitsInput}
            onChange={(e) => setBenefitsInput(e.target.value)}
            style={fieldStyle}
          />
          <textarea
            placeholder="Qualifications, one per line (e.g. Bachelor's degree, 3+ years experience)"
            value={qualificationsInput}
            onChange={(e) => setQualificationsInput(e.target.value)}
            rows={3}
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            style={{ alignSelf: 'flex-start', padding: '10px 20px', background: 'var(--color-primary)', color: '#14140f', fontWeight: 800, border: 'none', cursor: 'pointer' }}
          >
            {isSubmitting ? 'POSTING...' : 'POST_JOB'}
          </button>
        </form>
      )}

      {!isLoading && jobs.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <input
            type="text"
            placeholder="Search job title, location, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...fieldStyle, flex: '2 1 240px' }}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ ...fieldStyle, flex: '1 1 150px' }}
          >
            <option value="all">All types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{ ...fieldStyle, flex: '1 1 150px' }}
          >
            <option value="all">All locations</option>
            {availableLocations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{ ...fieldStyle, flex: '0 0 auto', cursor: 'pointer', fontWeight: 700 }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--color-text)', opacity: 0.7 }}>Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p style={{ color: 'var(--color-text)', opacity: 0.7 }}>No open positions right now.</p>
      ) : filteredJobs.length === 0 ? (
        <p style={{ color: 'var(--color-text)', opacity: 0.7 }}>No jobs match your filters.</p>
      ) : (
        <div className="profile-section__items">
          {filteredJobs.map((job) => {
            const salary = formatSalary(job);
            return (
              <div
                key={job.id}
                className="profile-section__item"
                onClick={() => openJob(job)}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: 'rgba(246, 243, 237, 0.02)', border: '1px solid var(--tech-border)', borderRadius: '0', padding: '16px', marginBottom: '12px', cursor: 'pointer' }}
              >
                <div className="profile-item__icon" style={{ position: 'static', flexShrink: 0, background: 'var(--color-bg)', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}>💼</div>
                <div className="profile-item__content" style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <h3 style={{ color: '#14140f', fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px 0' }}>{job.title}</h3>
                  <p style={{ color: '#4a4335', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'var(--font-body)', margin: 0 }}>
                    {[job.location, job.type].filter(Boolean).join(' • ')}
                  </p>
                  {salary && (
                    <p style={{ color: '#1c6b3f', fontWeight: 700, fontSize: '0.82rem', margin: '4px 0 0 0' }}>{salary}</p>
                  )}
                  {job.description && (
                    <p style={{ color: '#4a4335', fontSize: '0.88rem', marginTop: '6px', marginBottom: 0 }}>{job.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    className="btn-sm-primary"
                    style={{ background: 'transparent', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}
                    onClick={(e) => { e.stopPropagation(); openJob(job); }}
                  >
                    VIEW_DETAILS
                  </button>
                  {canManage ? (
                    <button
                      className="btn-sm-primary"
                      style={{ background: 'transparent', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                    >
                      REMOVE
                    </button>
                  ) : (
                    <button
                      className="btn-sm-primary"
                      style={{ background: 'transparent', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      APPLY_MODULE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {expandedJob && createPortal(
        <div
          onClick={() => setExpandedJob(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20, 20, 15, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '40px 20px', overflowY: 'auto' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#ffffff', maxWidth: '820px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--tech-border)', position: 'relative' }}
          >
            <button
              onClick={() => setExpandedJob(null)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'transparent', border: 'none', color: '#14140f', fontSize: '1.6rem', cursor: 'pointer', lineHeight: 1 }}
              aria-label="Close"
            >
              ×
            </button>

            {/* Header */}
            <div style={{ padding: '32px 32px 20px 32px', borderBottom: '1px solid var(--tech-border)' }}>
              <h2 style={{ color: '#14140f', fontFamily: 'var(--font-body)', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px 0', paddingRight: '30px' }}>{expandedJob.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                {companyLogo ? (
                  <img src={companyLogo} alt={companyName} style={{ width: '32px', height: '32px', objectFit: 'cover', border: '1px solid var(--tech-border)' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', color: '#14140f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                    {(companyName || 'CO').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span style={{ color: '#14140f', fontWeight: 700, fontSize: '0.95rem' }}>{companyName || 'This company'}</span>
                <span style={{ color: '#4a4335', fontSize: '0.95rem' }}>· {expandedJob.location || 'Location not specified'}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {formatSalary(expandedJob) && (
                  <span style={{ padding: '5px 12px', background: 'rgba(28, 107, 63, 0.1)', color: '#1c6b3f', fontWeight: 700, fontSize: '0.82rem' }}>
                    {formatSalary(expandedJob)}
                  </span>
                )}
                <span style={{ padding: '5px 12px', background: 'rgba(198, 161, 91, 0.12)', color: '#8a6d2f', fontWeight: 700, fontSize: '0.82rem' }}>
                  {expandedJob.type}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {canManage ? (
                  <button
                    onClick={() => handleDelete(expandedJob.id)}
                    style={{ padding: '11px 24px', background: 'transparent', border: '1px solid var(--tech-blue)', color: 'var(--tech-blue)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    REMOVE_LISTING
                  </button>
                ) : (
                  <>
                    <button
                      style={{ padding: '11px 28px', background: 'var(--color-primary)', color: '#14140f', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                    >
                      Apply now
                    </button>
                    <button
                      onClick={() => setIsSaved((v) => !v)}
                      style={{ padding: '11px 20px', background: isSaved ? 'var(--color-primary)' : 'transparent', border: '1px solid var(--tech-blue)', color: isSaved ? '#14140f' : 'var(--tech-blue)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {isSaved ? '✓ Saved' : 'Save'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Body: two columns */}
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 420px', padding: '28px 32px', borderRight: '1px solid var(--tech-border)' }}>
                <h3 style={{ color: '#14140f', fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>Full Job Description</h3>
                <p style={{ color: '#2b2820', fontSize: '0.95rem', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {expandedJob.description || 'No further description was provided for this role.'}
                </p>

                {expandedJob.qualifications.length > 0 && (
                  <div style={{ marginTop: '26px' }}>
                    <h3 style={{ color: '#14140f', fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>Qualifications</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#2b2820', fontSize: '0.92rem', lineHeight: 1.8 }}>
                      {expandedJob.qualifications.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p style={{ color: '#756c5d', fontSize: '0.8rem', marginTop: '26px' }}>Posted {formatPostedDate(expandedJob.createdAt)}</p>
              </div>

              <div style={{ flex: '1 1 240px', padding: '28px 32px', background: '#faf8f2' }}>
                <h3 style={{ color: '#14140f', fontSize: '0.95rem', fontWeight: 800, marginBottom: '14px' }}>Job details</h3>

                {formatSalary(expandedJob) && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: '#756c5d', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px 0' }}>Pay</p>
                    <p style={{ color: '#2b2820', fontSize: '0.9rem', margin: 0 }}>{formatSalary(expandedJob)}</p>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ color: '#756c5d', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px 0' }}>Job type</p>
                  <p style={{ color: '#2b2820', fontSize: '0.9rem', margin: 0 }}>{expandedJob.type}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ color: '#756c5d', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px 0' }}>Location</p>
                  <p style={{ color: '#2b2820', fontSize: '0.9rem', margin: 0 }}>{expandedJob.location || 'Not specified'}</p>
                </div>

                {expandedJob.benefits.length > 0 && (
                  <div>
                    <p style={{ color: '#756c5d', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px 0' }}>Benefits</p>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: '#2b2820', fontSize: '0.88rem', lineHeight: 1.7 }}>
                      {expandedJob.benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};
