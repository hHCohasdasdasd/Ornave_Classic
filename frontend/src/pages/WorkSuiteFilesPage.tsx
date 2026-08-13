import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, UserFile } from '@/services/workSuiteService';
import './WorkSuite.css';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
};

const iconForMime = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar')) return '🗜️';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.startsWith('text/')) return '📄';
  return '📦';
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

  const [files, setFiles] = useState<UserFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const load = async () => {
    setIsLoading(true);
    try {
      setFiles(await workSuiteService.listFiles());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const uploadFiles = async (fileList: FileList | File[]) => {
    setError(null);
    const list = Array.from(fileList);
    for (const file of list) {
      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploading((prev) => [...prev, { key, name: file.name, percent: 0 }]);
      try {
        await workSuiteService.uploadFile(file, (percent) => {
          setUploading((prev) => prev.map((u) => (u.key === key ? { ...u, percent } : u)));
        });
        setUploading((prev) => prev.filter((u) => u.key !== key));
        await load();
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
      await load();
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const filtered = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : files;

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
          <div className="files-dropzone__icon">☁️</div>
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

        <div className="worksuite-page__header-row">
          <input
            className="worksuite-select"
            style={{ minWidth: '240px' }}
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="files-storage-total">
            {files.length} file{files.length === 1 ? '' : 's'} · {formatBytes(totalSize)}
          </span>
        </div>

        {isLoading ? (
          <div className="worksuite-empty">Loading files…</div>
        ) : filtered.length === 0 ? (
          <div className="worksuite-empty worksuite-empty--goals">
            <div className="worksuite-empty__icon">☁️</div>
            <p>{search ? 'No files match your search.' : 'Nothing uploaded yet — drop a file above to get started.'}</p>
          </div>
        ) : (
          <div className="files-list">
            {filtered.map((file) => (
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
      </div>
    </div>
  );
};
