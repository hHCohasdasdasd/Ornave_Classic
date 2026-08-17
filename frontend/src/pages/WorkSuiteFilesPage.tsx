import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, UserFile, UserFolder } from '@/services/workSuiteService';
import { IconCloud, IconFolder, IconImage, IconVideo, IconMusic, IconArticle, IconArchive, IconChart, IconFile, IconClose } from '@/components/ui/Icons';
import './WorkSuite.css';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
};

const iconForMime = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <IconImage size={18} />;
  if (mimeType.startsWith('video/')) return <IconVideo size={18} />;
  if (mimeType.startsWith('audio/')) return <IconMusic size={18} />;
  if (mimeType === 'application/pdf') return <IconArticle size={18} />;
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar')) return <IconArchive size={18} />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <IconChart size={18} />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <IconArticle size={18} />;
  if (mimeType.startsWith('text/')) return <IconFile size={18} />;
  return <IconFile size={18} />;
};

interface UploadingFile {
  key: string;
  name: string;
  percent: number;
  error?: string;
}

export const WorkSuiteFilesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [path, setPath] = useState<UserFolder[]>([]);
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const load = async (folderId: string | null) => {
    setIsLoading(true);
    try {
      const [folderList, fileList] = await Promise.all([
        workSuiteService.listFolders(folderId),
        workSuiteService.listFiles(folderId),
      ]);
      setFolders(folderList);
      setFiles(fileList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load(currentFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, currentFolderId]);

  const openFolder = (folder: UserFolder) => {
    setPath((prev) => [...prev, folder]);
    setCurrentFolderId(folder.id);
  };

  const jumpToBreadcrumb = (index: number) => {
    // index -1 means "My Files" (root)
    if (index < 0) {
      setPath([]);
      setCurrentFolderId(null);
      return;
    }
    setPath((prev) => prev.slice(0, index + 1));
    setCurrentFolderId(path[index].id);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    setError(null);
    try {
      await workSuiteService.createFolder(newFolderName.trim(), currentFolderId);
      setShowNewFolderModal(false);
      setNewFolderName('');
      await load(currentFolderId);
    } catch {
      setError('Could not create that folder — try again.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: UserFolder) => {
    if (!window.confirm(`Delete "${folder.name}" and everything inside it? This can't be undone.`)) return;
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    try {
      await workSuiteService.deleteFolder(folder.id);
    } catch {
      await load(currentFolderId);
    }
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    setError(null);
    const list = Array.from(fileList);
    for (const file of list) {
      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploading((prev) => [...prev, { key, name: file.name, percent: 0 }]);
      try {
        await workSuiteService.uploadFile(file, currentFolderId, (percent) => {
          setUploading((prev) => prev.map((u) => (u.key === key ? { ...u, percent } : u)));
        });
        setUploading((prev) => prev.filter((u) => u.key !== key));
        await load(currentFolderId);
      } catch {
        setUploading((prev) => prev.map((u) => (u.key === key ? { ...u, error: 'Upload failed' } : u)));
        setTimeout(() => setUploading((prev) => prev.filter((u) => u.key !== key)), 4000);
      }
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) setIsDragOver(false);
  };

  const handleDownload = async (file: UserFile) => {
    try {
      const url = await workSuiteService.getFileDownloadUrl(file.id);
      window.open(url, '_blank');
    } catch {
      setError('Could not generate a download link — try again.');
    }
  };

  const handleDelete = async (file: UserFile) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    try {
      await workSuiteService.deleteFile(file.id);
    } catch {
      await load(currentFolderId);
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const q = search.trim().toLowerCase();
  const filteredFolders = q ? folders.filter((f) => f.name.toLowerCase().includes(q)) : folders;
  const filteredFiles = q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Files</h1>
          <p className="worksuite-page__subtitle">Your own cloud — upload, store, and get back anything, anytime.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div
          className={`files-dropzone${isDragOver ? ' files-dropzone--active' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFilePick}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}
          />
          <div className="files-dropzone__icon"><IconCloud size={28} /></div>
          <p className="files-dropzone__text">
            <strong>Drop files here</strong> or click to browse
          </p>
          <p className="files-dropzone__hint">Up to 50MB per file</p>
        </div>

        {uploading.length > 0 && (
          <div className="files-uploading">
            {uploading.map((u) => (
              <div key={u.key} className="files-uploading__row">
                <span className="files-uploading__name">{u.name}</span>
                {u.error ? (
                  <span className="files-uploading__error">{u.error}</span>
                ) : (
                  <div className="files-uploading__bar">
                    <div className="files-uploading__bar-fill" style={{ width: `${u.percent}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <p className="worksuite-modal__error">{error}</p>}

        <div className="files-breadcrumbs">
          <button className="files-breadcrumbs__item" onClick={() => jumpToBreadcrumb(-1)} disabled={path.length === 0}>
            My Files
          </button>
          {path.map((folder, i) => (
            <React.Fragment key={folder.id}>
              <span className="files-breadcrumbs__sep">/</span>
              <button
                className="files-breadcrumbs__item"
                onClick={() => jumpToBreadcrumb(i)}
                disabled={i === path.length - 1}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="worksuite-page__header-row">
          <input
            className="worksuite-select"
            style={{ minWidth: '240px' }}
            placeholder="Search this folder…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="files-storage-total">
              {files.length} file{files.length === 1 ? '' : 's'} · {formatBytes(totalSize)}
            </span>
            <button className="worksuite-create-btn" onClick={() => { setNewFolderName(''); setError(null); setShowNewFolderModal(true); }}>
              + New Folder
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="worksuite-empty">Loading…</div>
        ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
          <div className="worksuite-empty worksuite-empty--goals">
            <div className="worksuite-empty__icon"><IconCloud size={32} /></div>
            <p>{search ? 'Nothing here matches your search.' : 'Nothing here yet — drop a file or make a folder to get started.'}</p>
          </div>
        ) : (
          <>
            {filteredFolders.length > 0 && (
              <div className="files-folder-grid">
                {filteredFolders.map((folder) => (
                  <div key={folder.id} className="files-folder" onClick={() => openFolder(folder)}>
                    <span className="files-folder__icon"><IconFolder size={18} /></span>
                    <span className="files-folder__name">{folder.name}</span>
                    <button
                      className="files-folder__delete"
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                      title="Delete folder"
                    >
                      <IconClose size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {filteredFiles.length > 0 && (
              <div className="files-list">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="files-row">
                    <span className="files-row__icon">{iconForMime(file.mimeType)}</span>
                    <div className="files-row__main">
                      <div className="files-row__name">{file.name}</div>
                      <div className="files-row__meta">
                        {formatBytes(file.size)} · {new Date(file.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="files-row__actions">
                      <button className="worksuite-btn" onClick={() => handleDownload(file)}>Download</button>
                      <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(file)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showNewFolderModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Folder</h2>
            <label>Name</label>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Tax Documents"
              maxLength={120}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
            />
            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowNewFolderModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleCreateFolder} disabled={!newFolderName.trim() || isCreatingFolder}>
                {isCreatingFolder ? 'Creating…' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
