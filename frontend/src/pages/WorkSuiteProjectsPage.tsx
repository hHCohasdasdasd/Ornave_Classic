import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, Project } from '@/services/workSuiteService';
import './WorkSuite.css';

type StatusFilter = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ALL';

export const WorkSuiteProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ACTIVE');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setProjects(await workSuiteService.listProjects());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setName(project.name);
    setDescription(project.description || '');
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      if (editing) {
        await workSuiteService.updateProject(editing.id, { name: name.trim(), description: description.trim() || undefined });
      } else {
        await workSuiteService.createProject({ name: name.trim(), description: description.trim() || undefined });
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that project — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const setStatus = async (project: Project, status: Project['status']) => {
    await workSuiteService.updateProject(project.id, { status });
    await load();
  };

  const handleDelete = async (project: Project) => {
    await workSuiteService.deleteProject(project.id);
    await load();
  };

  const filtered = filter === 'ALL' ? projects : projects.filter((p) => p.status === filter);

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Projects</h1>
          <p className="worksuite-page__subtitle">Track initiatives from kickoff to completion.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-page__header-row">
          <div className="worksuite-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
            {(['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ALL'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                className={`worksuite-tab${filter === s ? ' worksuite-tab--active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <button className="worksuite-create-btn" onClick={openCreate}>+ New Project</button>
        </div>

        <div className="worksuite-grid">
          {isLoading ? (
            <div className="worksuite-empty">Loading projects…</div>
          ) : filtered.length === 0 ? (
            <div className="worksuite-empty">No projects here yet — create one to get started.</div>
          ) : (
            filtered.map((project) => (
              <div key={project.id} className="worksuite-card">
                <div className="worksuite-card__header">
                  <div>
                    <div className="worksuite-card__title">{project.name}</div>
                    <div className="worksuite-card__meta">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`worksuite-badge worksuite-badge--${project.status.toLowerCase()}`}>
                    {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <p className="worksuite-card__description">{project.description || 'No description yet.'}</p>
                <div className="worksuite-card__actions">
                  <button className="worksuite-btn" onClick={() => navigate(`/work-suite/personal?tab=board&projectId=${project.id}`)}>
                    View Tasks
                  </button>
                  <button className="worksuite-btn" onClick={() => openEdit(project)}>Edit</button>
                  {project.status !== 'COMPLETED' && (
                    <button className="worksuite-btn" onClick={() => setStatus(project, 'COMPLETED')}>Mark Complete</button>
                  )}
                  {project.status !== 'ARCHIVED' && (
                    <button className="worksuite-btn" onClick={() => setStatus(project, 'ARCHIVED')}>Archive</button>
                  )}
                  <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(project)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Project' : 'New Project'}</h2>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Website Redesign" maxLength={120} />
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's this project about? (optional)" maxLength={500} />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!name.trim() || isSaving}>
                {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
