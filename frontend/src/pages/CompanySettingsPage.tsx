import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { ValidationUtils } from '@/utils/storage';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, PaymentsStatus, TerminalReader, ReceiptSettings } from '@/services/workSuiteService';
import { BUSINESS_TYPE_OPTIONS } from '@/utils/businessType';
import './WorkSuite.css';

export const CompanySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, company } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Receipt Design — custom header/footer lines printed on every ticket
  // and receipt across Kitchen/Bar/Reservations/Server Orders.
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({ headerText: '', footerText: '' });
  const [isLoadingReceiptSettings, setIsLoadingReceiptSettings] = useState(true);
  const [isSavingReceiptSettings, setIsSavingReceiptSettings] = useState(false);
  const [receiptError, setReceiptError] = useState('');
  const [receiptSuccess, setReceiptSuccess] = useState('');

  // Payments — Stripe Connect (bank account for real charges to settle
  // to) + Stripe Terminal (physical card readers), for guests who won't
  // pay via Automatic Check-In.
  const [paymentsStatus, setPaymentsStatus] = useState<PaymentsStatus | null>(null);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpeningDashboard, setIsOpeningDashboard] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');

  const [readers, setReaders] = useState<TerminalReader[]>([]);
  const [isLoadingReaders, setIsLoadingReaders] = useState(false);
  const [locationAddress, setLocationAddress] = useState({ line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US' });
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [readerCode, setReaderCode] = useState('');
  const [readerLabel, setReaderLabel] = useState('');
  const [isRegisteringReader, setIsRegisteringReader] = useState(false);
  const [removingReaderId, setRemovingReaderId] = useState<string | null>(null);

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const status = await workSuiteService.getPaymentsStatus();
      setPaymentsStatus(status);
      if (status.hasTerminalLocation) {
        setIsLoadingReaders(true);
        workSuiteService.listTerminalReaders().then(setReaders).finally(() => setIsLoadingReaders(false));
      }
    } catch {
      setPaymentsStatus(null);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (user?.userType !== 'COMPANY_USER') return;
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('stripe')]);

  const handleConnectPayments = async () => {
    setPaymentsError('');
    setIsConnecting(true);
    try {
      const { url } = await workSuiteService.connectPayments();
      window.location.href = url;
    } catch (err: any) {
      setPaymentsError(err.message || 'Could not start onboarding — try again.');
      setIsConnecting(false);
    }
  };

  const handleOpenDashboard = async () => {
    setPaymentsError('');
    setIsOpeningDashboard(true);
    try {
      const { url } = await workSuiteService.openPaymentsDashboard();
      window.open(url, '_blank', 'noopener');
    } catch (err: any) {
      setPaymentsError(err.message || 'Could not open the dashboard — try again.');
    } finally {
      setIsOpeningDashboard(false);
    }
  };

  const handleDisconnectPayments = async () => {
    if (!window.confirm('Disconnect payments? Card readers will stop working until you reconnect.')) return;
    setIsDisconnecting(true);
    try {
      await workSuiteService.disconnectPayments();
      setReaders([]);
      await loadPayments();
    } catch (err: any) {
      setPaymentsError(err.message || 'Could not disconnect — try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentsError('');
    setIsSavingLocation(true);
    try {
      await workSuiteService.setupTerminalLocation(locationAddress);
      await loadPayments();
    } catch (err: any) {
      setPaymentsError(err.message || 'Could not save that address — try again.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleRegisterReader = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentsError('');
    setIsRegisteringReader(true);
    try {
      const reader = await workSuiteService.registerTerminalReader(readerCode.trim(), readerLabel.trim());
      setReaders((prev) => [...prev, reader]);
      setReaderCode('');
      setReaderLabel('');
    } catch (err: any) {
      setPaymentsError(err.message || 'Could not register that reader — check the code and try again.');
    } finally {
      setIsRegisteringReader(false);
    }
  };

  const handleRemoveReader = async (readerId: string) => {
    if (!window.confirm('Remove this reader?')) return;
    setRemovingReaderId(readerId);
    try {
      await workSuiteService.removeTerminalReader(readerId);
      setReaders((prev) => prev.filter((r) => r.id !== readerId));
    } catch (err: any) {
      setPaymentsError(err.message || 'Could not remove that reader — try again.');
    } finally {
      setRemovingReaderId(null);
    }
  };

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
      return;
    }

    setCompanyName(company.name);
    setSlug(company.slug);
    setDescription(company.description || '');

    // The auth-context company object doesn't reliably carry website/logo/
    // industry (website in particular lives on a separate profile table) —
    // fetch the authoritative record once so the form starts pre-filled.
    apiClient.getCompany(company.id).then((res) => {
      const full = res?.data;
      if (!full) return;
      setWebsite(full.website || '');
      setLogo(full.logo || '');
      setIndustry(full.industry || '');
    });
  }, [company, user, navigate]);

  useEffect(() => {
    if (user?.userType !== 'COMPANY_USER') return;
    setIsLoadingReceiptSettings(true);
    workSuiteService.getReceiptSettings().then(setReceiptSettings).finally(() => setIsLoadingReceiptSettings(false));
  }, [user]);

  const handleSaveReceiptSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceiptError('');
    setReceiptSuccess('');
    setIsSavingReceiptSettings(true);
    try {
      const saved = await workSuiteService.updateReceiptSettings(receiptSettings);
      setReceiptSettings(saved);
      setReceiptSuccess('Receipt design saved!');
    } catch (err: any) {
      setReceiptError(err.message || 'Could not save your receipt design — try again.');
    } finally {
      setIsSavingReceiptSettings(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (!ValidationUtils.isValidSlug(slug)) {
      setError('Company slug is invalid (use lowercase letters, numbers, and hyphens)');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.updateCompanySettings(company!.id, {
        name: companyName,
        slug,
        website,
        description,
        industry,
      });
      if (logo.trim()) {
        await apiClient.updateCompanyLogo(company!.id, logo.trim());
      }
      setSuccess('Company settings updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update company settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Company Settings</h1>
          <p className="worksuite-page__subtitle">Manage your company information, payments, and preferences.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-settings">
          {/* Company Information */}
          <div className="worksuite-settings-section">
            <h3 className="worksuite-settings-section__title">Company Information</h3>
            <p className="worksuite-settings-section__subtitle">
              Your public name, URL, and description — shown wherever your company appears on Ornave.
            </p>

            {error && <p className="worksuite-error">{error}</p>}
            {success && <p className="worksuite-success">{success}</p>}

            <form onSubmit={handleSubmit}>
              <div className="worksuite-field">
                <label>Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isLoading} />
              </div>

              <div className="worksuite-field">
                <label>Company Slug</label>
                <input type="text" value={slug} onChange={handleSlugChange} disabled={isLoading} />
                <span className="worksuite-field-hint">URL-friendly identifier (lowercase letters, numbers, hyphens)</span>
              </div>

              <div className="worksuite-field">
                <label>Website (Optional)</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" disabled={isLoading} />
              </div>

              <div className="worksuite-field">
                <label>Logo URL (Optional)</label>
                <input type="url" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://example.com/logo.png" disabled={isLoading} />
              </div>

              <div className="worksuite-field">
                <label>Industry</label>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)} disabled={isLoading}>
                  <option value="">— Select —</option>
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.value}</option>
                  ))}
                </select>
                <span className="worksuite-field-hint">Drives which profile layout your company gets (e.g. a Menu for restaurants).</span>
              </div>

              <div className="worksuite-field">
                <label>Description (Optional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} rows={4} />
              </div>

              <div className="worksuite-form-actions">
                <button type="submit" className="worksuite-create-btn" disabled={isLoading}>
                  {isLoading ? 'Updating…' : 'Update Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Payments — Stripe Connect + Terminal */}
          {user?.userType === 'COMPANY_USER' && (
            <div className="worksuite-settings-section">
              <h3 className="worksuite-settings-section__title">Payments</h3>
              <p className="worksuite-settings-section__subtitle">
                Connect a bank account to take real card payments — for guests who won't be paying via Automatic Check-In.
              </p>

              {paymentsError && <p className="worksuite-error">{paymentsError}</p>}

              {isLoadingPayments ? (
                <p className="worksuite-page__subtitle" style={{ margin: 0 }}>Loading…</p>
              ) : !paymentsStatus?.connected ? (
                <div className="worksuite-form-actions">
                  <button className="worksuite-create-btn" onClick={handleConnectPayments} disabled={isConnecting}>
                    {isConnecting ? 'Redirecting to Stripe…' : 'Connect with Stripe'}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 18 }}>
                    <div className={`worksuite-status-row ${paymentsStatus.detailsSubmitted ? 'worksuite-status-row--ok' : 'worksuite-status-row--warn'}`}>
                      <span className="worksuite-status-row__label">Onboarding</span>
                      <span className="worksuite-status-row__value">{paymentsStatus.detailsSubmitted ? 'Complete' : 'Incomplete'}</span>
                    </div>
                    <div className={`worksuite-status-row ${paymentsStatus.chargesEnabled ? 'worksuite-status-row--ok' : 'worksuite-status-row--warn'}`}>
                      <span className="worksuite-status-row__label">Can accept charges</span>
                      <span className="worksuite-status-row__value">{paymentsStatus.chargesEnabled ? 'Yes' : 'Not yet'}</span>
                    </div>
                    <div className={`worksuite-status-row ${paymentsStatus.payoutsEnabled ? 'worksuite-status-row--ok' : 'worksuite-status-row--warn'}`}>
                      <span className="worksuite-status-row__label">Payouts to bank account</span>
                      <span className="worksuite-status-row__value">{paymentsStatus.payoutsEnabled ? 'Enabled' : 'Not yet'}</span>
                    </div>
                  </div>

                  <div className="worksuite-form-actions">
                    {!paymentsStatus.detailsSubmitted && (
                      <button className="worksuite-create-btn" onClick={handleConnectPayments} disabled={isConnecting}>
                        {isConnecting ? 'Redirecting to Stripe…' : 'Finish Onboarding'}
                      </button>
                    )}
                    {paymentsStatus.detailsSubmitted && (
                      <button className="worksuite-create-btn" onClick={handleOpenDashboard} disabled={isOpeningDashboard}>
                        {isOpeningDashboard ? 'Opening…' : 'Open Stripe Dashboard'}
                      </button>
                    )}
                    <button className="worksuite-btn worksuite-btn--danger" onClick={handleDisconnectPayments} disabled={isDisconnecting}>
                      {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                  </div>

                  {/* Card Readers — only meaningful once charges are actually enabled */}
                  {paymentsStatus.chargesEnabled && (
                    <>
                      <hr className="worksuite-settings-divider" />
                      <h3 className="worksuite-settings-section__title" style={{ fontSize: '0.9rem' }}>Card Readers</h3>

                      {!paymentsStatus.hasTerminalLocation ? (
                        <form onSubmit={handleSaveLocation}>
                          <p className="worksuite-settings-section__subtitle">
                            Set the address where your readers will be used — Stripe requires this once, before any reader can be registered.
                          </p>
                          <div className="worksuite-field">
                            <label>Address line 1</label>
                            <input value={locationAddress.line1} onChange={(e) => setLocationAddress((a) => ({ ...a, line1: e.target.value }))} required />
                          </div>
                          <div className="worksuite-field">
                            <label>Address line 2 (optional)</label>
                            <input value={locationAddress.line2} onChange={(e) => setLocationAddress((a) => ({ ...a, line2: e.target.value }))} />
                          </div>
                          <div className="worksuite-field-row">
                            <div className="worksuite-field">
                              <label>City</label>
                              <input value={locationAddress.city} onChange={(e) => setLocationAddress((a) => ({ ...a, city: e.target.value }))} required />
                            </div>
                            <div className="worksuite-field">
                              <label>State</label>
                              <input value={locationAddress.state} onChange={(e) => setLocationAddress((a) => ({ ...a, state: e.target.value }))} />
                            </div>
                          </div>
                          <div className="worksuite-field-row">
                            <div className="worksuite-field">
                              <label>Postal code</label>
                              <input value={locationAddress.postalCode} onChange={(e) => setLocationAddress((a) => ({ ...a, postalCode: e.target.value }))} required />
                            </div>
                            <div className="worksuite-field">
                              <label>Country (2-letter code)</label>
                              <input value={locationAddress.country} onChange={(e) => setLocationAddress((a) => ({ ...a, country: e.target.value.toUpperCase() }))} maxLength={2} required />
                            </div>
                          </div>
                          <div className="worksuite-form-actions">
                            <button type="submit" className="worksuite-create-btn" disabled={isSavingLocation}>
                              {isSavingLocation ? 'Saving…' : 'Save Address'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {isLoadingReaders ? (
                            <p className="worksuite-settings-section__subtitle">Loading readers…</p>
                          ) : readers.length === 0 ? (
                            <p className="worksuite-settings-section__subtitle">No readers registered yet.</p>
                          ) : (
                            <div style={{ marginBottom: 16 }}>
                              {readers.map((r) => (
                                <div key={r.id} className="worksuite-reader-row">
                                  <div>
                                    <div className="worksuite-reader-row__name">{r.label}</div>
                                    <div className="worksuite-reader-row__meta">{r.deviceType} — {r.status === 'online' ? 'Online' : 'Offline'}</div>
                                  </div>
                                  <button className="worksuite-btn worksuite-btn--danger" onClick={() => handleRemoveReader(r.id)} disabled={removingReaderId === r.id}>
                                    {removingReaderId === r.id ? 'Removing…' : 'Remove'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <form onSubmit={handleRegisterReader}>
                            <p className="worksuite-settings-section__subtitle">
                              Enter the registration code shown on the reader's screen. In test mode, use <code>simulated-wpe</code> to try the flow without physical hardware.
                            </p>
                            <div className="worksuite-field-row">
                              <div className="worksuite-field">
                                <label>Registration code</label>
                                <input value={readerCode} onChange={(e) => setReaderCode(e.target.value)} required />
                              </div>
                              <div className="worksuite-field">
                                <label>Label</label>
                                <input value={readerLabel} onChange={(e) => setReaderLabel(e.target.value)} placeholder="e.g. Front Counter" required />
                              </div>
                            </div>
                            <div className="worksuite-form-actions">
                              <button type="submit" className="worksuite-create-btn" disabled={isRegisteringReader}>
                                {isRegisteringReader ? 'Registering…' : 'Register Reader'}
                              </button>
                            </div>
                          </form>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Receipt Design */}
          {user?.userType === 'COMPANY_USER' && (
            <div className="worksuite-settings-section">
              <h3 className="worksuite-settings-section__title">Receipt Design</h3>
              <p className="worksuite-settings-section__subtitle">
                Custom lines printed on every receipt and ticket — one per line. Shown above your order details in Reservations, Server Orders, and Bar Orders.
              </p>

              {receiptError && <p className="worksuite-error">{receiptError}</p>}
              {receiptSuccess && <p className="worksuite-success">{receiptSuccess}</p>}

              {isLoadingReceiptSettings ? (
                <p className="worksuite-settings-section__subtitle">Loading…</p>
              ) : (
                <form onSubmit={handleSaveReceiptSettings}>
                  <div className="worksuite-field">
                    <label>Header (Optional)</label>
                    <textarea
                      value={receiptSettings.headerText}
                      onChange={(e) => setReceiptSettings((s) => ({ ...s, headerText: e.target.value }))}
                      placeholder={'123 Main St\nPhone: (555) 123-4567'}
                      disabled={isSavingReceiptSettings}
                      rows={3}
                    />
                  </div>
                  <div className="worksuite-field">
                    <label>Footer (Optional)</label>
                    <textarea
                      value={receiptSettings.footerText}
                      onChange={(e) => setReceiptSettings((s) => ({ ...s, footerText: e.target.value }))}
                      placeholder={'Thank you for dining with us!\nFollow us @yourrestaurant'}
                      disabled={isSavingReceiptSettings}
                      rows={3}
                    />
                  </div>
                  <div className="worksuite-form-actions">
                    <button type="submit" className="worksuite-create-btn" disabled={isSavingReceiptSettings}>
                      {isSavingReceiptSettings ? 'Saving…' : 'Save Receipt Design'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Account Details */}
          <div className="worksuite-settings-section">
            <h3 className="worksuite-settings-section__title">Account Details</h3>
            <div className="worksuite-status-row">
              <span className="worksuite-status-row__label">Company ID</span>
              <span>{company?.id}</span>
            </div>
            <div className="worksuite-status-row">
              <span className="worksuite-status-row__label">Created</span>
              <span>{company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : '—'}</span>
            </div>
            <div className={`worksuite-status-row ${company?.isActive ? 'worksuite-status-row--ok' : ''}`}>
              <span className="worksuite-status-row__label">Status</span>
              <span className="worksuite-status-row__value">{company?.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
