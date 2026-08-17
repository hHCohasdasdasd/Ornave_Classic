import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { ThemedSelect } from '@/components/ui/ThemedSelect';
import { ThemedDatePicker } from '@/components/ui/ThemedDatePicker';
import {
  workSuiteService,
  JobApplication,
  JobApplicationStatus,
  WorkProfile,
  WorkExperienceEntry,
  WorkEducationEntry,
  UserFile,
} from '@/services/workSuiteService';
import {
  IconArticle,
  IconImage,
  IconFile,
  IconClipboard,
  IconBookmark,
  IconSend,
  IconMessageCircle,
  IconStar,
  IconClose,
  IconBuilding,
  IconLink,
  IconEdit,
  IconDownload,
  IconBriefcase,
} from '@/components/ui/Icons';
import { downloadResumePdf } from '@/utils/resumePdf';
import './WorkSuite.css';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
};

const iconForMime = (mimeType: string) => {
  if (mimeType === 'application/pdf') return <IconArticle size={18} />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <IconArticle size={18} />;
  if (mimeType.startsWith('image/')) return <IconImage size={18} />;
  return <IconFile size={18} />;
};

const EMPTY_PROFILE: WorkProfile = { headline: null, summary: null, experience: [], education: [], skills: [] };

type SectionFilter = 'ALL' | JobApplicationStatus;

const SECTIONS: { key: SectionFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL', label: 'All', icon: <IconClipboard size={15} /> },
  { key: 'SAVED', label: 'Saved', icon: <IconBookmark size={15} /> },
  { key: 'APPLIED', label: 'Applied', icon: <IconSend size={15} /> },
  { key: 'INTERVIEWING', label: 'Interviewing', icon: <IconMessageCircle size={15} /> },
  { key: 'OFFER', label: 'Offer', icon: <IconStar size={15} /> },
  { key: 'REJECTED', label: 'Rejected', icon: <IconClose size={15} /> },
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

  // ---------------------------------------------------------------------
  // Work Profile (private CV) + CV Documents — right-hand panel
  // ---------------------------------------------------------------------
  const [workProfile, setWorkProfile] = useState<WorkProfile>(EMPTY_PROFILE);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileHeadline, setProfileHeadline] = useState('');
  const [profileSummary, setProfileSummary] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profileExperience, setProfileExperience] = useState<WorkExperienceEntry[]>([]);
  const [profileEducation, setProfileEducation] = useState<WorkEducationEntry[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [cvDocuments, setCvDocuments] = useState<UserFile[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [uploadingDocs, setUploadingDocs] = useState<{ key: string; name: string; error?: boolean }[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);

  const hasProfileContent = !!(workProfile.headline || workProfile.summary || workProfile.experience.length || workProfile.education.length || workProfile.skills.length);

  const handleDownloadResume = () => {
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Resume';
    downloadResumePdf(workProfile, fullName, user?.email || '');
  };

  const loadWorkProfile = async () => {
    setIsLoadingProfile(true);
    try {
      setWorkProfile(await workSuiteService.getWorkProfile());
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadCvDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      setCvDocuments(await workSuiteService.listCvDocuments());
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const openEditProfile = () => {
    setProfileHeadline(workProfile.headline || '');
    setProfileSummary(workProfile.summary || '');
    setProfileSkills(workProfile.skills.join(', '));
    setProfileExperience(workProfile.experience.length ? workProfile.experience : []);
    setProfileEducation(workProfile.education.length ? workProfile.education : []);
    setProfileError(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const saved = await workSuiteService.updateWorkProfile({
        headline: profileHeadline.trim() || undefined,
        summary: profileSummary.trim() || undefined,
        skills: profileSkills.split(',').map((s) => s.trim()).filter(Boolean),
        experience: profileExperience.filter((e) => e.title.trim() || e.company.trim()),
        education: profileEducation.filter((e) => e.school.trim()),
      });
      setWorkProfile(saved);
      setShowProfileModal(false);
    } catch {
      setProfileError('Something went wrong saving your work profile — try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const addExperienceRow = () => setProfileExperience((prev) => [...prev, { title: '', company: '', startDate: '', endDate: '', description: '' }]);
  const removeExperienceRow = (index: number) => setProfileExperience((prev) => prev.filter((_, i) => i !== index));
  const updateExperienceRow = (index: number, patch: Partial<WorkExperienceEntry>) =>
    setProfileExperience((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const addEducationRow = () => setProfileEducation((prev) => [...prev, { school: '', degree: '', startDate: '', endDate: '' }]);
  const removeEducationRow = (index: number) => setProfileEducation((prev) => prev.filter((_, i) => i !== index));
  const updateEducationRow = (index: number, patch: Partial<WorkEducationEntry>) =>
    setProfileEducation((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const uploadDocs = async (fileList: FileList | File[]) => {
    const list = Array.from(fileList);
    for (const file of list) {
      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploadingDocs((prev) => [...prev, { key, name: file.name }]);
      try {
        await workSuiteService.uploadCvDocument(file);
        setUploadingDocs((prev) => prev.filter((u) => u.key !== key));
        await loadCvDocuments();
      } catch {
        setUploadingDocs((prev) => prev.map((u) => (u.key === key ? { ...u, error: true } : u)));
        setTimeout(() => setUploadingDocs((prev) => prev.filter((u) => u.key !== key)), 4000);
      }
    }
  };

  const handleDocPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadDocs(e.target.files);
    e.target.value = '';
  };

  const handleDocDownload = async (file: UserFile) => {
    try {
      const url = await workSuiteService.getFileDownloadUrl(file.id);
      window.open(url, '_blank');
    } catch {
      // Best-effort — a failed download link isn't worth a page-level error banner here.
    }
  };

  const handleDocDelete = async (file: UserFile) => {
    setCvDocuments((prev) => prev.filter((f) => f.id !== file.id));
    try {
      await workSuiteService.deleteFile(file.id);
    } catch {
      await loadCvDocuments();
    }
  };

  const load = async () => {
    setIsLoading(true);
    try {
      setJobApplications(await workSuiteService.listJobApplications());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) {
      load();
      loadWorkProfile();
      loadCvDocuments();
    }
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
                <div className="worksuite-empty__icon"><IconBriefcase size={32} /></div>
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
                        <p className="worksuite-job-post__company"><IconBuilding size={13} /> {job.company}</p>
                      </div>
                      <span className="worksuite-job-post__badge" style={{ background: color, color: '#14140f' }}>
                        {STATUS_LABEL[job.status]}
                      </span>
                    </div>

                    <div className="worksuite-job-post__meta">
                      {job.appliedDate && <span>Applied {new Date(job.appliedDate).toLocaleDateString()}</span>}
                      <span>Added {new Date(job.createdAt).toLocaleDateString()}</span>
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer"><IconLink size={12} /> View posting</a>
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
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => openEdit(job)} title="Edit"><IconEdit size={13} /></button>
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDelete(job)} title="Delete"><IconClose size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <aside className="worksuite-jobs-profile-panel">
            <div className="worksuite-jobs-profile-card">
              <div className="worksuite-jobs-profile-card__header">
                <h4>Work Profile</h4>
                <div className="worksuite-jobs-profile-card__header-actions">
                  {hasProfileContent && (
                    <button className="worksuite-jobs-profile-card__edit-btn" onClick={handleDownloadResume} title="Download as PDF">
                      <IconDownload size={12} /> PDF
                    </button>
                  )}
                  <button className="worksuite-jobs-profile-card__edit-btn" onClick={openEditProfile}>
                    {isLoadingProfile ? '…' : hasProfileContent ? 'Edit' : '+ Build CV'}
                  </button>
                </div>
              </div>

              {isLoadingProfile ? (
                <p className="worksuite-jobs-profile-empty">Loading…</p>
              ) : !hasProfileContent ? (
                <p className="worksuite-jobs-profile-empty">
                  Build a private CV — headline, experience, education, and skills — to have ready when you apply.
                </p>
              ) : (
                <>
                  {workProfile.headline && <p className="worksuite-jobs-profile-headline">{workProfile.headline}</p>}
                  {workProfile.summary && <p className="worksuite-jobs-profile-summary">{workProfile.summary}</p>}

                  {workProfile.experience.length > 0 && (
                    <div className="worksuite-jobs-profile-subsection">
                      <h5>Experience</h5>
                      {workProfile.experience.map((e, i) => (
                        <div key={i} className="worksuite-jobs-profile-entry">
                          <strong>{e.title}</strong>{e.company && ` · ${e.company}`}
                          {(e.startDate || e.endDate) && <span>{e.startDate || '?'} – {e.current ? 'Present' : (e.endDate || '?')}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {workProfile.education.length > 0 && (
                    <div className="worksuite-jobs-profile-subsection">
                      <h5>Education</h5>
                      {workProfile.education.map((e, i) => (
                        <div key={i} className="worksuite-jobs-profile-entry">
                          <strong>{e.school}</strong>{e.degree && ` · ${e.degree}`}
                        </div>
                      ))}
                    </div>
                  )}

                  {workProfile.skills.length > 0 && (
                    <div className="worksuite-jobs-profile-subsection">
                      <h5>Skills</h5>
                      <div className="worksuite-jobs-skill-tags">
                        {workProfile.skills.map((s) => <span key={s} className="worksuite-jobs-skill-tag">{s}</span>)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="worksuite-jobs-profile-card">
              <div className="worksuite-jobs-profile-card__header">
                <h4>CV & Documents</h4>
              </div>

              {isLoadingDocs ? (
                <p className="worksuite-jobs-profile-empty">Loading…</p>
              ) : (
                <div className="worksuite-jobs-doc-list">
                  {cvDocuments.map((doc) => (
                    <div key={doc.id} className="worksuite-jobs-doc-row">
                      <span>{iconForMime(doc.mimeType)}</span>
                      <div className="worksuite-jobs-doc-row__info">
                        <div className="worksuite-jobs-doc-row__name">{doc.name}</div>
                        <div className="worksuite-jobs-doc-row__meta">{formatBytes(doc.size)}</div>
                      </div>
                      <div className="worksuite-jobs-doc-row__actions">
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDocDownload(doc)} title="Download"><IconDownload size={13} /></button>
                        <button className="worksuite-kanban-card__icon-btn" onClick={() => handleDocDelete(doc)} title="Delete"><IconClose size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {uploadingDocs.map((u) => (
                    <div key={u.key} className="worksuite-jobs-doc-row">
                      <span><IconSend size={16} /></span>
                      <div className="worksuite-jobs-doc-row__info">
                        <div className="worksuite-jobs-doc-row__name">{u.name}</div>
                        <div className="worksuite-jobs-doc-row__meta">{u.error ? 'Upload failed' : 'Uploading…'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="worksuite-jobs-upload-btn" onClick={() => docInputRef.current?.click()}>
                + Upload resume, cover letter…
              </button>
              <input
                ref={docInputRef}
                type="file"
                multiple
                onChange={handleDocPick}
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}
              />
            </div>
          </aside>
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

      {showProfileModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="worksuite-modal worksuite-modal--large" onClick={(e) => e.stopPropagation()}>
            <h2>Work Profile</h2>
            <label>Headline</label>
            <input value={profileHeadline} onChange={(e) => setProfileHeadline(e.target.value)} placeholder="Senior Product Designer" maxLength={160} />
            <label>Summary</label>
            <textarea value={profileSummary} onChange={(e) => setProfileSummary(e.target.value)} rows={3} placeholder="A short summary of who you are and what you're looking for…" maxLength={1000} />
            <label>Skills (comma-separated)</label>
            <input value={profileSkills} onChange={(e) => setProfileSkills(e.target.value)} placeholder="Figma, TypeScript, Leadership…" maxLength={500} />

            <label>Experience</label>
            {profileExperience.map((exp, i) => (
              <div key={i} className="worksuite-jobs-cv-entry-block">
                <button type="button" className="worksuite-jobs-cv-entry-block__remove" onClick={() => removeExperienceRow(i)} title="Remove"><IconClose size={12} /></button>
                <div className="worksuite-jobs-cv-form-row">
                  <input value={exp.title} onChange={(e) => updateExperienceRow(i, { title: e.target.value })} placeholder="Title" maxLength={160} />
                  <input value={exp.company} onChange={(e) => updateExperienceRow(i, { company: e.target.value })} placeholder="Company" maxLength={160} />
                </div>
                <div className="worksuite-jobs-cv-form-row" style={{ marginTop: '8px' }}>
                  <input value={exp.startDate || ''} onChange={(e) => updateExperienceRow(i, { startDate: e.target.value })} placeholder="Start (e.g. 2022)" maxLength={40} />
                  <input value={exp.endDate || ''} onChange={(e) => updateExperienceRow(i, { endDate: e.target.value })} placeholder="End (e.g. 2024, or blank)" maxLength={40} disabled={exp.current} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem' }}>
                  <input type="checkbox" checked={!!exp.current} onChange={(e) => updateExperienceRow(i, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })} style={{ width: 'auto' }} />
                  Current role
                </label>
                <textarea
                  value={exp.description || ''}
                  onChange={(e) => updateExperienceRow(i, { description: e.target.value })}
                  rows={2}
                  placeholder="What you did…"
                  maxLength={500}
                  style={{ marginTop: '8px' }}
                />
              </div>
            ))}
            <button type="button" className="worksuite-jobs-cv-add-btn" onClick={addExperienceRow}>+ Add experience</button>

            <label style={{ marginTop: '16px' }}>Education</label>
            {profileEducation.map((edu, i) => (
              <div key={i} className="worksuite-jobs-cv-entry-block">
                <button type="button" className="worksuite-jobs-cv-entry-block__remove" onClick={() => removeEducationRow(i)} title="Remove"><IconClose size={12} /></button>
                <div className="worksuite-jobs-cv-form-row">
                  <input value={edu.school} onChange={(e) => updateEducationRow(i, { school: e.target.value })} placeholder="School" maxLength={160} />
                  <input value={edu.degree || ''} onChange={(e) => updateEducationRow(i, { degree: e.target.value })} placeholder="Degree" maxLength={160} />
                </div>
                <div className="worksuite-jobs-cv-form-row" style={{ marginTop: '8px' }}>
                  <input value={edu.startDate || ''} onChange={(e) => updateEducationRow(i, { startDate: e.target.value })} placeholder="Start (e.g. 2018)" maxLength={40} />
                  <input value={edu.endDate || ''} onChange={(e) => updateEducationRow(i, { endDate: e.target.value })} placeholder="End (e.g. 2022)" maxLength={40} />
                </div>
              </div>
            ))}
            <button type="button" className="worksuite-jobs-cv-add-btn" onClick={addEducationRow}>+ Add education</button>

            {profileError && <p className="worksuite-modal__error">{profileError}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowProfileModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving…' : 'Save Work Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
