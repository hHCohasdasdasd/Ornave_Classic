import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { storeService, Product, getProductMedia } from '@/services/storeService';
import { Navbar } from '@/components/ui/Navbar';
import { IconSearch, IconBag, IconImage, IconCart } from '@/components/ui/Icons';
import './UserStorePage.css';

const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  const formatted = price >= 1000
    ? Math.round(price).toLocaleString('en-US')
    : price.toFixed(2);
  return `${symbol}${formatted}`;
};

export const UserStorePage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { cart, addToCart: addToCartContext, removeFromCart, cartTotal, cartCurrency } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const didHandleDeepLink = useRef(false);

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct]);

  useEffect(() => {
    loadProducts();
    setActiveCategory('All');
    setSearchQuery('');
  }, [companyId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category || 'Other'));
    return ['All', ...Array.from(unique).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'All' || (p.category || 'Other') === activeCategory;
      const matchesSearch = !q
        || p.name.toLowerCase().includes(q)
        || (p.description || '').toLowerCase().includes(q)
        || (p.company?.name || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const companyName = companyId ? products[0]?.company?.name : undefined;

  const addToCart = (product: Product, quantity: number = 1) => {
    if (addToCartContext(product, quantity) === 'added') {
      setIsCartOpen(true);
    }
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setGalleryIndex(0);
  };

  const closeProduct = () => setSelectedProduct(null);

  useEffect(() => {
    if (didHandleDeepLink.current) return;
    didHandleDeepLink.current = true;

    const addToCartId = searchParams.get('addToCart');
    if (addToCartId) {
      const qty = Math.max(1, parseInt(searchParams.get('qty') || '1', 10));
      storeService.getProduct(addToCartId).then((product) => {
        if (product) addToCart(product, qty);
      });
      return;
    }
    const productId = searchParams.get('product');
    if (!productId) return;
    storeService.getProduct(productId).then((product) => {
      if (product) openProduct(product);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToCheckout = () => {
    if (!user || user.id === 'guest') {
      navigate('/login');
      return;
    }
    if (cart.length === 0) return;
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="marketplace">
      <Navbar />
      <div className="marketplace__container">
        <header className="marketplace__header">
          <div>
            <h1 className="marketplace__title">{companyId ? (companyName || 'Company Store') : 'Marketplace'}</h1>
            <p className="marketplace__subtitle">
              {companyId
                ? 'Browsing products and services from this company.'
                : 'Discover products and services from firms across your network.'}
            </p>
          </div>
          <div className="marketplace__header-actions">
            {companyId && (
              <button className="marketplace__back-btn" onClick={() => navigate('/store')}>
                ← All of Marketplace
              </button>
            )}
            <button className="marketplace__purchases-btn" onClick={() => navigate('/purchased-services')}>
              <IconBag size={14} />
              My Purchases
            </button>
            <div className="marketplace__cart-widget" ref={cartRef}>
              <button className="marketplace__cart-btn" onClick={() => setIsCartOpen((prev) => !prev)} aria-label="Cart">
                <IconCart size={16} />
                {cart.length > 0 && <span className="marketplace__cart-count">{cart.length}</span>}
              </button>

              {isCartOpen && (
                <div className="cart-card">
                  <div className="cart-card__header">
                    <IconCart size={16} />
                    <h2 className="cart-card__title">Your Cart</h2>
                    {cart.length > 0 && <span className="cart-card__count">{cart.length}</span>}
                  </div>

                  {cart.length === 0 ? (
                    <div className="cart-card__empty">
                      <IconCart size={28} />
                      <p className="cart-card__empty-text">Your cart is empty</p>
                      <p className="cart-card__empty-sub">Add items from the marketplace to get started.</p>
                    </div>
                  ) : (
                    <>
                      <div className="cart-card__items">
                        {cart.map((item) => (
                          <div key={item.product.id} className="cart-card__item">
                            <div>
                              <div className="cart-card__item-name">{item.product.name}</div>
                              <div className="cart-card__item-qty">Qty: {item.quantity}</div>
                            </div>
                            <div className="cart-card__item-right">
                              <div className="cart-card__item-price">
                                {formatPrice(item.product.price * item.quantity, item.product.currency)}
                              </div>
                              <button className="cart-card__item-remove" onClick={() => removeFromCart(item.product.id)}>
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="cart-card__divider">
                        <div className="cart-card__total-row">
                          <span className="cart-card__total-label">Total</span>
                          <span className="cart-card__total-value">{formatPrice(cartTotal, cartCurrency)}</span>
                        </div>
                      </div>
                      <button className="cart-card__checkout-btn" onClick={goToCheckout}>
                        Checkout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="marketplace__toolbar">
          <div className="marketplace__search">
            <span className="marketplace__search-icon"><IconSearch size={15} /></span>
            <input
              className="marketplace__search-input"
              type="text"
              placeholder="Search products and services…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {categories.length > 1 && (
            <div className="marketplace__categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`marketplace__category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="marketplace__main">
            {!isLoading && (
              <p className="marketplace__result-count">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
              </p>
            )}

            <div className="marketplace__grid">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="product-card product-card--skeleton">
                    <div className="product-card__image-placeholder" />
                    <div className="product-card__body">
                      <div className="skeleton-line" style={{ width: '40%' }} />
                      <div className="skeleton-line" style={{ width: '80%', height: 14 }} />
                      <div className="skeleton-line" style={{ width: '100%' }} />
                      <div className="skeleton-line" style={{ width: '60%' }} />
                    </div>
                  </div>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="marketplace__empty">
                  <div className="marketplace__empty-icon"><IconBag size={36} /></div>
                  <h3 className="marketplace__empty-title">No results found</h3>
                  <p className="marketplace__empty-text">
                    {products.length === 0
                      ? 'There are no items available here yet.'
                      : 'Try a different search term or category.'}
                  </p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const media = getProductMedia(product);
                  const cover = media[0];
                  return (
                  <div key={product.id} className="product-card" onClick={() => openProduct(product)}>
                    <div className="product-card__media">
                      {cover ? (
                        cover.type === 'video' ? (
                          <video className="product-card__image" src={cover.url} muted />
                        ) : (
                          <img className="product-card__image" src={cover.url} alt={product.name} />
                        )
                      ) : (
                        <div className="product-card__image-placeholder"><IconImage size={28} /></div>
                      )}
                      {media.length > 1 && (
                        <span className="product-card__media-count">+{media.length - 1}</span>
                      )}
                    </div>
                    <div className="product-card__body">
                      {product.category && (
                        <span className="product-card__category">{product.category}</span>
                      )}
                      <h3 className="product-card__name">{product.name}</h3>
                      {!companyId && product.company && (
                        <p className="product-card__company">{product.company.name}</p>
                      )}
                      {product.description && (
                        <p className="product-card__description">{product.description}</p>
                      )}
                      <div className="product-card__footer">
                        <span className="product-card__price">{formatPrice(product.price, product.currency)}</span>
                        {product.stock <= 0 ? (
                          <span className="product-card__stock">Out of stock</span>
                        ) : (
                          <button className="product-card__add-btn" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
        </div>
      </div>

      {selectedProduct && (() => {
        const media = getProductMedia(selectedProduct);
        const current = media[galleryIndex];
        const goPrev = () => setGalleryIndex((i) => (i - 1 + media.length) % media.length);
        const goNext = () => setGalleryIndex((i) => (i + 1) % media.length);

        return (
        <div className="product-modal-overlay" onClick={closeProduct}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="product-modal__close" onClick={closeProduct}>×</button>

            <div className="product-modal__media">
              {current ? (
                current.type === 'video' ? (
                  <video className="product-modal__image" src={current.url} controls />
                ) : (
                  <img className="product-modal__image" src={current.url} alt={selectedProduct.name} />
                )
              ) : (
                <div className="product-modal__image-placeholder"><IconImage size={48} /></div>
              )}

              {media.length > 1 && (
                <>
                  <button className="product-modal__nav product-modal__nav--prev" onClick={goPrev} aria-label="Previous">‹</button>
                  <button className="product-modal__nav product-modal__nav--next" onClick={goNext} aria-label="Next">›</button>
                  <div className="product-modal__dots">
                    {media.map((_, i) => (
                      <button
                        key={i}
                        className={`product-modal__dot ${i === galleryIndex ? 'active' : ''}`}
                        onClick={() => setGalleryIndex(i)}
                        aria-label={`Media ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="product-modal__body">
              {selectedProduct.category && (
                <span className="product-card__category">{selectedProduct.category}</span>
              )}
              <h2 className="product-modal__name">{selectedProduct.name}</h2>
              {selectedProduct.company && (
                <button
                  className="product-modal__poster"
                  onClick={() => { closeProduct(); navigate(`/profile?view=${selectedProduct.companyId}`); }}
                >
                  <span className="product-modal__poster-avatar">
                    {selectedProduct.company.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="product-modal__poster-text">
                    <span className="product-modal__poster-label">Posted by</span>
                    <span className="product-modal__poster-name">{selectedProduct.company.name}</span>
                  </span>
                  <span className="product-modal__poster-link">View Profile ›</span>
                </button>
              )}
              {(selectedProduct.detailedDescription || selectedProduct.description) && (
                <div className="product-modal__description">
                  {(selectedProduct.detailedDescription || selectedProduct.description || '')
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                </div>
              )}

              <div className="product-modal__purchase-box">
                <div className="product-modal__purchase-top">
                  <div>
                    <span className="product-modal__price-label">Price</span>
                    <span className="product-modal__price">{formatPrice(selectedProduct.price, selectedProduct.currency)}</span>
                  </div>
                  {selectedProduct.stock <= 0 ? (
                    <span className="product-modal__stock-badge product-modal__stock-badge--out">Out of stock</span>
                  ) : selectedProduct.stock <= 5 ? (
                    <span className="product-modal__stock-badge product-modal__stock-badge--low">Only {selectedProduct.stock} left</span>
                  ) : (
                    <span className="product-modal__stock-badge product-modal__stock-badge--in">In stock</span>
                  )}
                </div>

                {selectedProduct.stock > 0 && (
                  <div className="product-modal__actions">
                    <div className="product-modal__stepper">
                      <button onClick={() => setModalQty((q) => Math.max(1, q - 1))}>−</button>
                      <span>{modalQty}</span>
                      <button onClick={() => setModalQty((q) => Math.min(selectedProduct.stock, q + 1))}>+</button>
                    </div>
                    <button
                      className="product-modal__add-btn"
                      onClick={() => { addToCart(selectedProduct, modalQty); closeProduct(); }}
                    >
                      <IconCart size={16} />
                      Add to Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};
