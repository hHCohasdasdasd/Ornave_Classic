import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storeService, Product, Order, ProductMediaItem, getProductMedia } from '@/services/storeService';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { globalNavigation } from '@/constants/navigation';

export const StoreManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    detailedDescription: '',
    price: 0,
    category: '',
    stock: 0,
  });
  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');

  const addMediaItem = () => {
    if (!mediaUrl.trim()) return;
    setMediaItems((prev) => [...prev, { type: mediaType, url: mediaUrl.trim() }]);
    setMediaUrl('');
  };

  const removeMediaItem = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (user?.companyId) {
      loadStoreData();
    }
  }, [user]);

  const loadStoreData = async () => {
    try {
      setIsLoading(true);
      const [productsData, ordersData] = await Promise.all([
        storeService.getCompanyProducts(user!.companyId!),
        storeService.getCompanyOrders()
      ]);
      setProducts(productsData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load store data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storeService.createProduct({ ...newProduct, media: mediaItems });
      setShowAddProduct(false);
      setNewProduct({ name: '', description: '', detailedDescription: '', price: 0, category: '', stock: 0 });
      setMediaItems([]);
      setMediaUrl('');
      loadStoreData();
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  return (
    <PageContainer
      title="Store Management"
      subtitle="Manage your products and view customer orders."
      sidebarItems={globalNavigation}
    >
      <div className="store-management">
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <Card style={{ flex: 1 }}>
            <h3>Total Sales</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
              ${orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
            </p>
          </Card>
          <Card style={{ flex: 1 }}>
            <h3>Active Products</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{products.length}</p>
          </Card>
          <Card style={{ flex: 1 }}>
            <h3>Total Orders</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{orders.length}</p>
          </Card>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Products</h2>
            <button className="btn btn--primary" onClick={() => setShowAddProduct(true)}>Add Product</button>
          </div>

          {showAddProduct && (
            <Card style={{ marginBottom: '20px' }}>
              <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                  type="text" 
                  placeholder="Product Name" 
                  className="input"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Short description (shown on the product card)"
                  className="textarea"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  rows={2}
                />
                <textarea
                  placeholder="Detailed description (shown when a buyer opens the full listing — feel free to write as much as you'd like)"
                  className="textarea"
                  value={newProduct.detailedDescription}
                  onChange={e => setNewProduct({...newProduct, detailedDescription: e.target.value})}
                  rows={6}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number" 
                    placeholder="Price" 
                    className="input"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="Stock" 
                    className="input"
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Category" 
                  className="input"
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                />
                <div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      className="input"
                      style={{ maxWidth: '110px' }}
                      value={mediaType}
                      onChange={e => setMediaType(e.target.value as 'image' | 'video')}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                    <input
                      type="text"
                      placeholder={mediaType === 'video' ? 'Video URL' : 'Image URL'}
                      className="input"
                      style={{ flex: 1 }}
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addMediaItem(); } }}
                    />
                    <button type="button" className="btn btn--secondary" onClick={addMediaItem}>Add</button>
                  </div>
                  {mediaItems.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      {mediaItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)' }}>{item.type}</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</span>
                          <button type="button" onClick={() => removeMediaItem(i)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn--primary">Save Product</button>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowAddProduct(false)}>Cancel</button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid">
            {products.map(product => {
              const media = getProductMedia(product);
              return (
                <Card key={product.id}>
                  {media[0] && (
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                      {media[0].type === 'video' ? (
                        <video src={media[0].url} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} muted />
                      ) : (
                        <img src={media[0].url} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                      )}
                      {media.length > 1 && (
                        <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                          +{media.length - 1}
                        </span>
                      )}
                    </div>
                  )}
                  <h4>{product.name}</h4>
                  <p className="muted-text">{product.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontWeight: 'bold' }}>
                    <span>${product.price.toFixed(2)}</span>
                    <span>Stock: {product.stock}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2>Recent Orders</h2>
          <Card>
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id.slice(-6)}</td>
                    <td>{order.user?.firstName} {order.user?.lastName}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>${order.totalAmount.toFixed(2)}</td>
                    <td><span className="status-badge">{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
