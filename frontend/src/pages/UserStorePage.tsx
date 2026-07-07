import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { storeService, Product } from '@/services/storeService';
import { Navbar } from '@/components/ui/Navbar';
import { Card } from '@/components/ui/Card';

export const UserStorePage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [companyId]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = companyId 
        ? await storeService.getCompanyProducts(companyId)
        : await storeService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    // If cart has items from another company, warn or clear?
    // Let's allow only one company at a time for simplicity in this version
    if (cart.length > 0 && cart[0].product.companyId !== product.companyId) {
      if (window.confirm('Adding this item will clear your cart from the previous company. Continue?')) {
        setCart([{ product, quantity: 1 }]);
      }
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = async () => {
    if (!user || user.id === 'guest') {
      navigate('/login');
      return;
    }

    if (cart.length === 0) return;

    try {
      setIsOrdering(true);
      const activeCompanyId = cart[0].product.companyId;
      await storeService.createOrder(activeCompanyId, cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })));
      alert('Order placed successfully!');
      setCart([]);
      loadProducts(); // Refresh stock
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="user-store" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        <div>
          <h1 style={{ color: 'var(--color-text)', marginBottom: '10px' }}>Store</h1>
          <p style={{ color: 'var(--color-muted)', marginBottom: '30px' }}>
            {companyId ? `Browsing items from company store` : 'Discover items from across the network'}
          </p>
          {isLoading ? (
            <p style={{ color: 'var(--color-text)' }}>Loading products...</p>
          ) : (
            <div className="grid">
              {products.map(product => (
                <Card key={product.id} className="card--hover">
                  {product.imageUrl && <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3>{product.name}</h3>
                    {!companyId && product.company && (
                      <span style={{ fontSize: '12px', background: 'rgba(246, 243, 237, 0.08)', color: 'var(--color-text)', padding: '2px 8px', borderRadius: '4px' }}>
                        {product.company.name}
                      </span>
                    )}
                  </div>
                  <p className="muted-text">{product.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>${product.price.toFixed(2)}</span>
                    <button 
                      className="btn btn--primary" 
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <Card style={{ position: 'sticky', top: '100px' }}>
            <h2 style={{ marginBottom: '20px' }}>Your Cart</h2>
            {cart.length === 0 ? (
              <p className="muted-text">Your cart is empty.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                  {cart.map(item => (
                    <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{item.product.name}</div>
                        <div className="muted-text">Qty: {item.quantity}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div>${(item.product.price * item.quantity).toFixed(2)}</div>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--color-border-dark)', paddingTop: '15px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  className="btn btn--primary" 
                  style={{ width: '100%' }}
                  onClick={handleCheckout}
                  disabled={isOrdering}
                >
                  {isOrdering ? 'Processing...' : 'Checkout'}
                </button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
