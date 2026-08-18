import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { storeService } from '@/services/storeService';
import { apiClient } from '@/services/api';
import { billingService, SavedCard, SavedBankAccount, SavedAddress } from '@/services/billingService';
import { stripePromise } from '@/utils/stripe';
import { Navbar } from '@/components/ui/Navbar';
import { IconCart, IconCheck, IconUser } from '@/components/ui/Icons';
import './CheckoutPage.css';

const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${price.toFixed(2)}`;
};

const NEW = '__new__';

interface CheckoutFormState {
  fullName: string;
  email: string;
  billingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  saveBillingAddress: boolean;
  billingAddressLabel: string;
  deliverySameAsBilling: boolean;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  saveDeliveryAddress: boolean;
  deliveryAddressLabel: string;
}

const CheckoutForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const { cart, cartTotal, cartCurrency, updateQuantity, removeFromCart, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: user && user.id !== 'guest' ? `${user.firstName} ${user.lastName}` : '',
    email: user && user.id !== 'guest' ? user.email : '',
    billingAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    saveBillingAddress: false,
    billingAddressLabel: '',
    deliverySameAsBilling: true,
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPostalCode: '',
    deliveryCountry: '',
    saveDeliveryAddress: false,
    deliveryAddressLabel: '',
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [savedBankAccounts, setSavedBankAccounts] = useState<SavedBankAccount[]>([]);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string>(NEW);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<string>(NEW);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>(NEW);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.id === 'guest') return;
    billingService.getSavedAddresses().then((addresses) => {
      setSavedAddresses(addresses);
      const defaultAddress = addresses.find((a) => a.isDefault);
      if (defaultAddress) {
        applyAddressToForm('billing', defaultAddress);
        setSelectedBillingAddressId(defaultAddress.id);
      }
    });
    Promise.all([billingService.getSavedCards(), billingService.getSavedBankAccounts()]).then(([cards, bankAccounts]) => {
      setSavedCards(cards);
      setSavedBankAccounts(bankAccounts);
      const defaultCard = cards.find((c) => c.isDefault);
      const defaultBank = bankAccounts.find((b) => b.isDefault);
      if (defaultCard) setSelectedPaymentMethodId(defaultCard.stripePaymentMethodId);
      else if (defaultBank) setSelectedPaymentMethodId(defaultBank.stripePaymentMethodId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAddressToForm = (target: 'billing' | 'delivery', address: SavedAddress) => {
    setForm((prev) => target === 'billing'
      ? {
          ...prev,
          billingAddress: address.streetAddress,
          city: address.city || '',
          state: address.state || '',
          postalCode: address.postalCode || '',
          country: address.country || '',
        }
      : {
          ...prev,
          deliveryAddress: address.streetAddress,
          deliveryCity: address.city || '',
          deliveryState: address.state || '',
          deliveryPostalCode: address.postalCode || '',
          deliveryCountry: address.country || '',
        });
  };

  const handleSelectAddress = (target: 'billing' | 'delivery', addressId: string) => {
    if (target === 'billing') setSelectedBillingAddressId(addressId);
    else setSelectedDeliveryAddressId(addressId);
    if (addressId !== NEW) {
      const address = savedAddresses.find((a) => a.id === addressId);
      if (address) applyAddressToForm(target, address);
    }
  };

  const handleAutofillFromProfile = async () => {
    if (!user || user.id === 'guest') return;
    try {
      setIsAutofilling(true);
      setAutofillError(null);
      const response = await apiClient.getProfile();
      const data = response?.data;
      if (!data) {
        setAutofillError('Could not load your profile. Try again.');
        return;
      }
      const profile = data.profile || {};
      const fallbackAddress: string = profile.address || '';
      const [fallbackCity] = fallbackAddress.split(',').map((part: string) => part.trim());
      setSelectedBillingAddressId(NEW);
      setForm((prev) => ({
        ...prev,
        fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || prev.fullName,
        email: data.email || prev.email,
        billingAddress: profile.streetAddress || fallbackAddress || prev.billingAddress,
        city: profile.city || fallbackCity || prev.city,
        state: profile.state || prev.state,
        postalCode: profile.postalCode || prev.postalCode,
        country: profile.country || prev.country,
      }));
    } catch (err) {
      console.error('Failed to autofill from profile:', err);
      setAutofillError('Could not load your profile. Try again.');
    } finally {
      setIsAutofilling(false);
    }
  };

  const hasSavedPaymentMethods = savedCards.length > 0 || savedBankAccounts.length > 0;
  const usingNewPaymentMethod = selectedPaymentMethodId === NEW;
  const usingNewDeliveryAddress = form.deliverySameAsBilling ? false : selectedDeliveryAddressId === NEW;

  const canSubmit = cart.length > 0
    && form.fullName.trim().length > 0
    && form.email.trim().length > 0
    && (!usingNewPaymentMethod || (!!stripe && !!elements))
    && (form.deliverySameAsBilling || !usingNewDeliveryAddress || form.deliveryAddress.trim().length > 0);

  const saveSelectedAddresses = () => {
    // Persist any "save for next time" selections — best-effort, doesn't block the order.
    if (selectedBillingAddressId === NEW && form.saveBillingAddress && form.billingAddress.trim()) {
      billingService.addSavedAddress({
        label: form.billingAddressLabel || undefined,
        fullName: form.fullName,
        streetAddress: form.billingAddress,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
      }).catch((err) => console.error('Failed to save address:', err));
    }
    if (!form.deliverySameAsBilling && selectedDeliveryAddressId === NEW && form.saveDeliveryAddress && form.deliveryAddress.trim()) {
      billingService.addSavedAddress({
        label: form.deliveryAddressLabel || undefined,
        fullName: form.fullName,
        streetAddress: form.deliveryAddress,
        city: form.deliveryCity,
        state: form.deliveryState,
        postalCode: form.deliveryPostalCode,
        country: form.deliveryCountry,
      }).catch((err) => console.error('Failed to save address:', err));
    }
  };

  const placeOrder = async (paymentMethodId: string) => {
    const companyId = cart[0].product.companyId;
    const billingAddress = {
      address: form.billingAddress,
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      country: form.country,
    };
    const deliveryAddress = form.deliverySameAsBilling
      ? billingAddress
      : {
          address: form.deliveryAddress,
          city: form.deliveryCity,
          state: form.deliveryState,
          postalCode: form.deliveryPostalCode,
          country: form.deliveryCountry,
        };

    const order = await storeService.createOrder(
      companyId,
      cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      paymentMethodId,
      { billingAddress, deliveryAddress }
    );

    saveSelectedAddresses();
    setPlacedOrderId(order.id);
    clearCart();
  };

  const handlePlaceOrder = async () => {
    if (!canSubmit || cart.length === 0) return;
    setIsPlacingOrder(true);
    setError(null);
    try {
      if (usingNewPaymentMethod) {
        if (!stripe || !elements) return;
        const { error: confirmError, setupIntent } = await stripe.confirmSetup({ elements, redirect: 'if_required' });
        if (confirmError || !setupIntent?.payment_method) {
          setError(confirmError?.message || 'Could not confirm that payment method — try again.');
          return;
        }
        const paymentMethodId = typeof setupIntent.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent.payment_method.id;
        await billingService.savePaymentMethod(paymentMethodId, !hasSavedPaymentMethods);
        await placeOrder(paymentMethodId);
      } else {
        await placeOrder(selectedPaymentMethodId);
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      setError('Something went wrong placing your order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (placedOrderId) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-page__container">
          <div className="checkout-success">
            <div className="checkout-success__icon"><IconCheck size={28} /></div>
            <h1 className="checkout-success__title">Order confirmed</h1>
            <p className="checkout-success__text">
              Your order <span className="checkout-success__order-id">#{placedOrderId.slice(-8).toUpperCase()}</span> has been placed successfully.
              A confirmation has been recorded under My Purchases.
            </p>
            <div className="checkout-success__actions">
              <button className="checkout-success__btn checkout-success__btn--primary" onClick={() => navigate('/purchased-services')}>
                View My Purchases
              </button>
              <button className="checkout-success__btn" onClick={() => navigate('/store')}>
                Back to Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-page__container">
          <div className="checkout-empty">
            <div className="checkout-empty__icon"><IconCart size={32} /></div>
            <h1 className="checkout-empty__title">Your cart is empty</h1>
            <p className="checkout-empty__text">Add items from the marketplace before checking out.</p>
            <button className="checkout-success__btn checkout-success__btn--primary" onClick={() => navigate('/store')}>
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderAddressPicker = (target: 'billing' | 'delivery', selectedId: string) => (
    <div className="checkout-address-list">
      {savedAddresses.map((address) => (
        <label key={address.id} className={`checkout-address-card ${selectedId === address.id ? 'selected' : ''}`}>
          <input
            type="radio"
            name={`${target}-address`}
            checked={selectedId === address.id}
            onChange={() => handleSelectAddress(target, address.id)}
          />
          <div className="checkout-address-card__body">
            <div className="checkout-address-card__top">
              <span className="checkout-address-card__label">{address.label || 'Address'}</span>
              {address.isDefault && <span className="checkout-address-card__default">Default</span>}
            </div>
            <span className="checkout-address-card__text">
              {address.streetAddress}, {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
              {address.country ? `, ${address.country}` : ''}
            </span>
          </div>
        </label>
      ))}
      <label className={`checkout-address-card ${selectedId === NEW ? 'selected' : ''}`}>
        <input
          type="radio"
          name={`${target}-address`}
          checked={selectedId === NEW}
          onChange={() => handleSelectAddress(target, NEW)}
        />
        <div className="checkout-address-card__body">
          <span className="checkout-address-card__label">+ Enter a new address</span>
        </div>
      </label>
    </div>
  );

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="checkout-page__container">
        <header className="checkout-page__header">
          <h1 className="checkout-page__title">Checkout</h1>
          <p className="checkout-page__subtitle">Review your order and complete your purchase.</p>
        </header>

        <div className="checkout-page__layout">
          <div className="checkout-page__form-col">
            <section className="checkout-section">
              <div className="checkout-section__header">
                <h2 className="checkout-section__title">Contact information</h2>
                {user && user.id !== 'guest' && (
                  <button
                    type="button"
                    className="checkout-section__autofill-btn"
                    onClick={handleAutofillFromProfile}
                    disabled={isAutofilling}
                  >
                    <IconUser size={13} />
                    {isAutofilling ? 'Filling…' : 'Fill from my profile'}
                  </button>
                )}
              </div>
              {autofillError && <p className="checkout-summary__error">{autofillError}</p>}
              <div className="checkout-section__row">
                <div className="checkout-field">
                  <label className="checkout-field__label">Full name</label>
                  <input
                    className="checkout-field__input"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div className="checkout-field">
                  <label className="checkout-field__label">Email</label>
                  <input
                    className="checkout-field__input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <h2 className="checkout-section__title">Billing address</h2>

              {savedAddresses.length > 0 && renderAddressPicker('billing', selectedBillingAddressId)}

              {selectedBillingAddressId === NEW && (
                <>
                  <div className="checkout-field">
                    <label className="checkout-field__label">Address</label>
                    <input
                      className="checkout-field__input"
                      type="text"
                      placeholder="Street address"
                      value={form.billingAddress}
                      onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                    />
                  </div>
                  <div className="checkout-section__row">
                    <div className="checkout-field">
                      <label className="checkout-field__label">City</label>
                      <input
                        className="checkout-field__input"
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div className="checkout-field">
                      <label className="checkout-field__label">State / Region</label>
                      <input
                        className="checkout-field__input"
                        type="text"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="checkout-section__row">
                    <div className="checkout-field">
                      <label className="checkout-field__label">Postal code</label>
                      <input
                        className="checkout-field__input"
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      />
                    </div>
                    <div className="checkout-field">
                      <label className="checkout-field__label">Country</label>
                      <input
                        className="checkout-field__input"
                        type="text"
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                      />
                    </div>
                  </div>
                  {user && user.id !== 'guest' && (
                    <>
                      <label className="checkout-checkbox-row">
                        <input
                          type="checkbox"
                          checked={form.saveBillingAddress}
                          onChange={(e) => setForm({ ...form, saveBillingAddress: e.target.checked })}
                        />
                        Save this address for next time
                      </label>
                      {form.saveBillingAddress && (
                        <input
                          className="checkout-field__input checkout-field__input--inline"
                          type="text"
                          placeholder="Label (e.g. Home, Office)"
                          value={form.billingAddressLabel}
                          onChange={(e) => setForm({ ...form, billingAddressLabel: e.target.value })}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </section>

            <section className="checkout-section">
              <h2 className="checkout-section__title">Delivery address</h2>
              <label className="checkout-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.deliverySameAsBilling}
                  onChange={(e) => setForm({ ...form, deliverySameAsBilling: e.target.checked })}
                />
                Same as billing address
              </label>

              {!form.deliverySameAsBilling && (
                <>
                  {savedAddresses.length > 0 && renderAddressPicker('delivery', selectedDeliveryAddressId)}

                  {selectedDeliveryAddressId === NEW && (
                    <>
                      <div className="checkout-field">
                        <label className="checkout-field__label">Address</label>
                        <input
                          className="checkout-field__input"
                          type="text"
                          placeholder="Street address"
                          value={form.deliveryAddress}
                          onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                        />
                      </div>
                      <div className="checkout-section__row">
                        <div className="checkout-field">
                          <label className="checkout-field__label">City</label>
                          <input
                            className="checkout-field__input"
                            type="text"
                            value={form.deliveryCity}
                            onChange={(e) => setForm({ ...form, deliveryCity: e.target.value })}
                          />
                        </div>
                        <div className="checkout-field">
                          <label className="checkout-field__label">State / Region</label>
                          <input
                            className="checkout-field__input"
                            type="text"
                            value={form.deliveryState}
                            onChange={(e) => setForm({ ...form, deliveryState: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="checkout-section__row">
                        <div className="checkout-field">
                          <label className="checkout-field__label">Postal code</label>
                          <input
                            className="checkout-field__input"
                            type="text"
                            value={form.deliveryPostalCode}
                            onChange={(e) => setForm({ ...form, deliveryPostalCode: e.target.value })}
                          />
                        </div>
                        <div className="checkout-field">
                          <label className="checkout-field__label">Country</label>
                          <input
                            className="checkout-field__input"
                            type="text"
                            value={form.deliveryCountry}
                            onChange={(e) => setForm({ ...form, deliveryCountry: e.target.value })}
                          />
                        </div>
                      </div>
                      {user && user.id !== 'guest' && (
                        <>
                          <label className="checkout-checkbox-row">
                            <input
                              type="checkbox"
                              checked={form.saveDeliveryAddress}
                              onChange={(e) => setForm({ ...form, saveDeliveryAddress: e.target.checked })}
                            />
                            Save this address for next time
                          </label>
                          {form.saveDeliveryAddress && (
                            <input
                              className="checkout-field__input checkout-field__input--inline"
                              type="text"
                              placeholder="Label (e.g. Home, Office)"
                              value={form.deliveryAddressLabel}
                              onChange={(e) => setForm({ ...form, deliveryAddressLabel: e.target.value })}
                            />
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </section>

            <section className="checkout-section">
              <h2 className="checkout-section__title">Payment</h2>

              {hasSavedPaymentMethods && (
                <div className="checkout-address-list">
                  {savedCards.map((card) => (
                    <label key={card.id} className={`checkout-address-card ${selectedPaymentMethodId === card.stripePaymentMethodId ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment-method"
                        checked={selectedPaymentMethodId === card.stripePaymentMethodId}
                        onChange={() => setSelectedPaymentMethodId(card.stripePaymentMethodId)}
                      />
                      <div className="checkout-address-card__body">
                        <div className="checkout-address-card__top">
                          <span className="checkout-address-card__label">{card.brand} •••• {card.last4}</span>
                          {card.isDefault && <span className="checkout-address-card__default">Default</span>}
                        </div>
                        <span className="checkout-address-card__text">{card.cardholderName} · exp {card.expiry}</span>
                      </div>
                    </label>
                  ))}
                  {savedBankAccounts.map((account) => (
                    <label key={account.id} className={`checkout-address-card ${selectedPaymentMethodId === account.stripePaymentMethodId ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment-method"
                        checked={selectedPaymentMethodId === account.stripePaymentMethodId}
                        onChange={() => setSelectedPaymentMethodId(account.stripePaymentMethodId)}
                      />
                      <div className="checkout-address-card__body">
                        <div className="checkout-address-card__top">
                          <span className="checkout-address-card__label">{account.bankName || 'Bank account'} •••• {account.last4}</span>
                          {account.isDefault && <span className="checkout-address-card__default">Default</span>}
                        </div>
                        <span className="checkout-address-card__text">Bank transfer (ACH) · {account.accountType || 'checking'}</span>
                      </div>
                    </label>
                  ))}
                  <label className={`checkout-address-card ${usingNewPaymentMethod ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={usingNewPaymentMethod}
                      onChange={() => setSelectedPaymentMethodId(NEW)}
                    />
                    <div className="checkout-address-card__body">
                      <span className="checkout-address-card__label">+ Add a new payment method</span>
                    </div>
                  </label>
                </div>
              )}

              {usingNewPaymentMethod && <PaymentElement />}

              <p className="checkout-page__payment-note">
                Payments are processed securely by Stripe — card and bank details never touch our servers.
              </p>
            </section>
          </div>

          <aside className="checkout-summary">
            <h2 className="checkout-summary__title">Order summary</h2>
            <div className="checkout-summary__items">
              {cart.map((item) => (
                <div key={item.product.id} className="checkout-summary__item">
                  <div className="checkout-summary__item-info">
                    <span className="checkout-summary__item-name">{item.product.name}</span>
                    <div className="checkout-summary__item-stepper">
                      <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <div className="checkout-summary__item-right">
                    <span className="checkout-summary__item-price">
                      {formatPrice(item.product.price * item.quantity, item.product.currency)}
                    </span>
                    <button className="checkout-summary__item-remove" onClick={() => removeFromCart(item.product.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="checkout-summary__total-row">
              <span>Total</span>
              <span className="checkout-summary__total-value">{formatPrice(cartTotal, cartCurrency)}</span>
            </div>
            {error && <p className="checkout-summary__error">{error}</p>}
            <button
              className="checkout-summary__place-order-btn"
              disabled={!canSubmit || isPlacingOrder}
              onClick={handlePlaceOrder}
            >
              {isPlacingOrder ? 'Placing order…' : `Place Order — ${formatPrice(cartTotal, cartCurrency)}`}
            </button>
            <button className="checkout-summary__back-link" onClick={() => navigate('/store')}>
              ← Continue shopping
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { cart } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.id === 'guest') return;
    billingService.createSetupIntent().then((r) => setClientSecret(r.clientSecret)).catch(() => {});
  }, [user]);

  if (!user || user.id === 'guest') {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-page__container">
          <div className="checkout-empty">
            <div className="checkout-empty__icon"><IconUser size={32} /></div>
            <h1 className="checkout-empty__title">Sign in to check out</h1>
            <p className="checkout-empty__text">Placing an order requires an Ornave account.</p>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0 || !clientSecret) {
    // Cart-empty and payment-setup-not-ready both render CheckoutForm's own
    // loading/empty states once mounted — but PaymentElement needs a
    // clientSecret up front, so hold off mounting Elements until it's ready.
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-page__container">
          {cart.length === 0 ? (
            <div className="checkout-empty">
              <div className="checkout-empty__icon"><IconCart size={32} /></div>
              <h1 className="checkout-empty__title">Your cart is empty</h1>
              <p className="checkout-empty__text">Add items from the marketplace before checking out.</p>
            </div>
          ) : (
            <div className="checkout-empty">
              <p className="checkout-empty__text">Loading checkout…</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#c6a15b',
            colorBackground: '#161616',
            colorText: '#f6f3ed',
            colorDanger: '#a2504b',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm />
    </Elements>
  );
};
