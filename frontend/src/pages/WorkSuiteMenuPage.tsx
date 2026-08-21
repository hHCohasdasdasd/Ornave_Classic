import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, MenuItem, MenuItemStation } from '@/services/workSuiteService';
import './WorkSuite.css';

export const WorkSuiteMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [station, setStation] = useState<MenuItemStation>('KITCHEN');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setItems(await workSuiteService.listMenuItems());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setStation('KITCHEN');
    setImageUrl(null);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price);
    setCategory(item.category);
    setStation(item.station);
    setImageUrl(item.imageUrl || null);
    setError(null);
    setShowModal(true);
  };

  // Only available once the item exists (the upload endpoint needs an id to
  // attach to) — for a brand-new item, save it first, then reopen it to add
  // a photo.
  const handleUploadImage = () => {
    if (!editingId) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsUploadingImage(true);
      setError(null);
      try {
        const item = await workSuiteService.uploadMenuItemImage(editingId, file);
        setImageUrl(item.imageUrl || null);
        setItems((prev) => prev.map((i) => (i.id === editingId ? item : i)));
      } catch {
        setError('Could not upload that photo — try again.');
      } finally {
        setIsUploadingImage(false);
      }
    };
    input.click();
  };

  const handleRemoveImage = async () => {
    if (!editingId) return;
    setIsUploadingImage(true);
    setError(null);
    try {
      const item = await workSuiteService.removeMenuItemImage(editingId);
      setImageUrl(null);
      setItems((prev) => prev.map((i) => (i.id === editingId ? item : i)));
    } catch {
      setError('Could not remove that photo — try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      if (editingId) {
        await workSuiteService.updateMenuItem(editingId, {
          name: name.trim(),
          description: description.trim(),
          price: price.trim(),
          category: category.trim() || 'Mains',
          station,
        });
      } else {
        await workSuiteService.createMenuItem({
          name: name.trim(),
          description: description.trim() || undefined,
          price: price.trim(),
          category: category.trim() || undefined,
          station,
        });
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that item — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)));
    try {
      await workSuiteService.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
    } catch {
      await load();
    }
  };

  const handleDelete = async (item: MenuItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await workSuiteService.deleteMenuItem(item.id);
    } catch {
      await load();
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="worksuite-page__title">Menu</h1>
          <p className="worksuite-page__subtitle">What you manage here is exactly what shows on your public profile's Menu tab.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-page__header-row">
          <button className="worksuite-create-btn" onClick={openCreate}>+ Add Item</button>
        </div>

        {isLoading ? (
          <div className="worksuite-empty">Loading menu…</div>
        ) : items.length === 0 ? (
          <div className="worksuite-empty worksuite-empty--goals">
            <p>No menu items yet — add your first dish.</p>
            <button className="worksuite-create-btn" onClick={openCreate}>+ Add Item</button>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat} style={{ marginBottom: '28px' }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted, #a79e8c)', margin: '0 0 12px' }}>
                {cat}
              </h3>
              {items.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className="worksuite-achievement" style={{ opacity: item.isAvailable ? 1 : 0.55 }}>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                  )}
                  <div className="worksuite-achievement__main">
                    <div className="worksuite-achievement__title">
                      {item.name} <span style={{ fontWeight: 400, opacity: 0.8 }}>— {item.price}</span>
                      {!item.isAvailable && <span style={{ marginLeft: '10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Unavailable</span>}
                    </div>
                    {item.description && (
                      <p className="worksuite-achievement__description">{item.description}</p>
                    )}
                  </div>
                  <button className="worksuite-btn" onClick={() => handleToggleAvailable(item)}>
                    {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  <button className="worksuite-btn" onClick={() => openEdit(item)}>Edit</button>
                  <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleDelete(item)}>Delete</button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Item' : 'Add Item'}</h2>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Wood-Fired Pizza" maxLength={120} />
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="San Marzano tomato, fresh mozzarella, basil." maxLength={400} />
            <label>Price</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$18" maxLength={30} />
            <label>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Starters, Mains, Desserts…" maxLength={60} />
            <label>Station</label>
            <select value={station} onChange={(e) => setStation(e.target.value as MenuItemStation)}>
              <option value="KITCHEN">Kitchen</option>
              <option value="BAR">Bar</option>
            </select>

            <label>Photo (optional)</label>
            {editingId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                {imageUrl ? (
                  <img src={imageUrl} alt={name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--tech-border-dim, #232319)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', color: 'var(--color-muted, #a79e8c)' }}>
                    No photo
                  </div>
                )}
                <button type="button" className="worksuite-btn" onClick={handleUploadImage} disabled={isUploadingImage}>
                  {isUploadingImage ? '…' : imageUrl ? 'Replace' : 'Upload'}
                </button>
                {imageUrl && (
                  <button type="button" className="worksuite-btn" onClick={handleRemoveImage} disabled={isUploadingImage}>Remove</button>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-muted, #a79e8c)', margin: '0 0 8px' }}>Save the item first, then reopen it to add a photo.</p>
            )}

            {error && <p className="worksuite-modal__error">{error}</p>}
            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!name.trim() || !price.trim() || isSaving}>
                {isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
