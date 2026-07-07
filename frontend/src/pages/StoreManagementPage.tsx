import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storeService, Product, Order } from '@/services/storeService';
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
    price: 0,
    category: '',
    stock: 0,
    imageUrl: ''
  });

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
      await storeService.createProduct(newProduct);
      setShowAddProduct(false);
      setNewProduct({ name: '', description: '', price: 0, category: '', stock: 0, imageUrl: '' });
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
                  placeholder="Description" 
                  className="textarea"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
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
                <input 
                  type="text" 
                  placeholder="Image URL" 
                  className="input"
                  value={newProduct.imageUrl}
                  onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn--primary">Save Product</button>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowAddProduct(false)}>Cancel</button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid">
            {products.map(product => (
              <Card key={product.id}>
                {product.imageUrl && <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
                <h4>{product.name}</h4>
                <p className="muted-text">{product.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontWeight: 'bold' }}>
                  <span>${product.price.toFixed(2)}</span>
                  <span>Stock: {product.stock}</span>
                </div>
              </Card>
            ))}
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
