import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import { Navbar } from '@/components/ui/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { billingService, MemberTier } from '@/services/billingService';
import { workSuiteService, CheckInProfile, BankConnection } from '@/services/workSuiteService';
import { IconClose, IconCard } from '@/components/ui/Icons';
import { TokenStorage, scopedKey } from '@/utils/storage';
import './ProfileEditPage.css';
// Reused here for the bank connection/verification section's styling
// (.worksuite-bank-*) rather than duplicating it — same classes the Work
// Suite Finance page uses for the identical UI.
import '@/pages/WorkSuite.css';

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface Certification {
  id: string;
  name: string;
  organization: string;
  issueDate: string;
  credentialId: string;
  credentialUrl: string;
}

interface Language {
  id: string;
  name: string;
  proficiency: 'Elementary' | 'Limited Working' | 'Professional Working' | 'Full Professional' | 'Native';
}

interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

const MODAL_TITLES: Record<string, string> = {
  experience: 'Add Experience',
  education: 'Add Education',
  skills: 'Add Skill',
  certifications: 'Add Certification',
  languages: 'Add Language',
  projects: 'Add Project',
  featured: 'Featured Section',
  cancel: 'Cancel Ornave Status',
};

const MEMBER_TIER_KEY = 'ornave_member_tier';
const VERIFIED_ADDON_KEY = 'ornave_verified_addon';

interface StatusTier {
  id: string;
  code?: MemberTier;
  name: string;
  price: string;
  // Silver and above only — a one-time payment covering 12 months, no
  // auto-renewal. Undefined for tiers without an annual option.
  annualPrice?: string;
  tagline: string;
  perks: string[];
}

// code is what the backend/Stripe actually know about; id/name stay the
// display strings already used everywhere else (localStorage cache, sidebar).
const STATUS_TIERS: StatusTier[] = [
  {
    id: 'Basic',
    code: 'BASIC',
    name: 'Basic',
    price: 'Free',
    tagline: 'The essentials, on us',
    perks: ['Full profile visibility', 'Standard support', 'Standard placement in Discover'],
  },
  {
    id: 'Bronze Member',
    code: 'BRONZE',
    name: 'Bronze Member',
    price: '$4.99/mo',
    tagline: 'A little extra shine',
    perks: ['Bronze member badge everywhere you appear', 'Slightly boosted placement in Discover', 'Basic profile analytics'],
  },
  {
    id: 'Silver Member',
    code: 'SILVER',
    name: 'Silver Member',
    price: '$9.99/mo',
    annualPrice: '$99.99/yr',
    tagline: 'Stand out in Discover and search',
    perks: ['Everything in Bronze', 'Silver member badge everywhere you appear', 'Priority placement in Discover', 'Advanced profile analytics'],
  },
  {
    id: 'Gold Member',
    code: 'GOLD',
    name: 'Gold Member',
    price: '$19.99/mo',
    annualPrice: '$199.99/yr',
    tagline: 'For power networkers and dealmakers',
    perks: ['Everything in Silver', 'Gold member badge everywhere you appear', 'Top placement in Discover', 'Unlimited saved searches', 'Direct-message any member'],
  },
  {
    id: 'Diamond Member',
    code: 'DIAMOND',
    name: 'Diamond Member',
    price: '$49.99/mo',
    annualPrice: '$499.99/yr',
    tagline: 'The absolute top — gold, with flare',
    perks: ['Everything in Gold', 'Animated shimmering Diamond badge', 'Featured placement across Ornave', 'Dedicated account concierge', 'Exclusive Diamond-only sectors'],
  },
];

const VERIFIED_ADDON: StatusTier = {
  id: 'Verified',
  name: 'Verified',
  price: '$2.99 one-time',
  tagline: 'A small extra — a verified checkmark next to your name',
  perks: ['Verified checkmark badge on your name', 'Stacks with any status above'],
};

export const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get('section');
  const tab = searchParams.get('tab');
  // Scoped by user id — these are client-side-only fields with no backend
  // model yet, so without scoping, one account's edits would bleed into any
  // other account that shares this browser.
  const PROFILE_OVERRIDES_KEY = scopedKey('ornave_profile_overrides', user?.id);
  const PROFILE_SECTIONS_KEY = scopedKey('ornave_profile_sections', user?.id);

  const [activeTab, setActiveTab] = useState<'info' | 'enhance' | 'sections'>('info');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  // When set, the modal for that same section id is in "edit" mode instead
  // of "add" mode — the form saves back into this entry instead of
  // appending a new one.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string>(() => localStorage.getItem(scopedKey(MEMBER_TIER_KEY, user?.id)) || 'Basic');
  const [hasVerified, setHasVerified] = useState<boolean>(() => localStorage.getItem(scopedKey(VERIFIED_ADDON_KEY, user?.id)) === 'true');
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [canDowngradeAt, setCanDowngradeAt] = useState<string | null>(null);
  const [lockedBillingPeriod, setLockedBillingPeriod] = useState<'MONTHLY' | 'ANNUAL' | null>(null);
  const [cancelAt, setCancelAt] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  // Photo states
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [backgroundPhoto, setBackgroundPhoto] = useState<string>('');

  // Check-In Profile — a small, separate profile (legal name + phone) used
  // only to gate Automatic Check-In. Its own load/save cycle since it's a
  // different backend model from the rest of this page's formData.
  const [checkInFirstName, setCheckInFirstName] = useState('');
  const [checkInLastName, setCheckInLastName] = useState('');
  const [checkInPhone, setCheckInPhone] = useState('');
  const [checkInEmail, setCheckInEmail] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkInPhotoUrl, setCheckInPhotoUrl] = useState('');
  const [isUploadingCheckInPhoto, setIsUploadingCheckInPhoto] = useState(false);
  const [isSavingCheckIn, setIsSavingCheckIn] = useState(false);
  const [checkInSavedAt, setCheckInSavedAt] = useState<number | null>(null);

  useEffect(() => {
    workSuiteService.getCheckInProfile().then((profile) => {
      if (!profile) return;
      setCheckInFirstName(profile.legalFirstName || '');
      setCheckInLastName(profile.legalLastName || '');
      setCheckInPhone(profile.phone || '');
      setCheckInEmail(profile.email || '');
      setCheckInNotes(profile.notes || '');
      setCheckInPhotoUrl(profile.photoUrl || '');
    }).catch(() => {});
  }, []);

  const handleUploadCheckInPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsUploadingCheckInPhoto(true);
      try {
        const profile = await workSuiteService.uploadCheckInPhoto(file);
        setCheckInPhotoUrl(profile.photoUrl || '');
      } catch {
        setError('Could not upload that photo — try again.');
      } finally {
        setIsUploadingCheckInPhoto(false);
      }
    };
    input.click();
  };

  // Web NFC — Chrome on Android only, nothing else. Feature-detected so
  // every other browser just sees an explanatory note instead of a button
  // that can't work. Writes a fresh backend-issued token onto whatever tag
  // is tapped; the token itself carries no guest info, it's just a lookup
  // key the kiosk reads back later.
  const isNfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;
  const [isWritingNfcCard, setIsWritingNfcCard] = useState(false);
  const [nfcCardStatus, setNfcCardStatus] = useState<string | null>(null);

  const handleWriteNfcCard = async () => {
    setIsWritingNfcCard(true);
    setNfcCardStatus('Requesting a card token…');
    try {
      const token = await workSuiteService.generateNfcCard();
      setNfcCardStatus('Hold a blank NFC tag against the back of this device…');
      const ndef = new (window as any).NDEFReader();
      await ndef.write({ records: [{ recordType: 'text', data: token }] });
      setNfcCardStatus('Card written — it\'s ready to tap at check-in.');
    } catch (err: any) {
      setNfcCardStatus(err?.name === 'NotAllowedError'
        ? 'NFC permission was denied — try again and allow it.'
        : 'Could not write the card — make sure a tag is held against the device and try again.');
    } finally {
      setIsWritingNfcCard(false);
    }
  };

  const handleSaveCheckInProfile = async () => {
    setIsSavingCheckIn(true);
    try {
      await workSuiteService.updateCheckInProfile({
        legalFirstName: checkInFirstName.trim() || undefined,
        legalLastName: checkInLastName.trim() || undefined,
        phone: checkInPhone.trim() || undefined,
        email: checkInEmail.trim() || undefined,
        notes: checkInNotes.trim() || undefined,
      });
      setCheckInSavedAt(Date.now());
      setTimeout(() => setCheckInSavedAt(null), 4000);
    } finally {
      setIsSavingCheckIn(false);
    }
  };

  // Bank Account — connect + verify, right alongside the Check-In Profile
  // since together with membership tier they're the three Automatic
  // Check-In requirements. Same Plaid Link flow as Work Suite → Finance
  // (which remains the place to view balances/transactions); this is just
  // the connect/verify actions surfaced where the rest of check-in setup
  // already lives, so nothing sends the user hunting across pages.
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(true);
  const [plaidConfigured, setPlaidConfigured] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isConnectingBank, setIsConnectingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [verifyingAccountId, setVerifyingAccountId] = useState<string | null>(null);

  const loadBank = async () => {
    setIsLoadingBank(true);
    try {
      const [connections, status] = await Promise.all([
        workSuiteService.listBankConnections(),
        workSuiteService.getPlaidStatus(),
      ]);
      setBankConnections(connections);
      setPlaidConfigured(status.configured);
    } finally {
      setIsLoadingBank(false);
    }
  };

  useEffect(() => {
    loadBank();
  }, []);

  const onPlaidSuccess = useCallback(async (publicToken: string | null) => {
    if (!publicToken) return;
    setIsConnectingBank(true);
    setBankError(null);
    try {
      await workSuiteService.exchangePlaidPublicToken(publicToken);
      localStorage.removeItem('plaid_oauth_link_token');
      setLinkToken(null);
      await loadBank();
    } catch {
      setBankError('Could not link that account — try again.');
    } finally {
      setIsConnectingBank(false);
    }
  }, []);

  const { open: openPlaidLink, ready: plaidLinkReady } = usePlaidLink({
    token: linkToken || '',
    onSuccess: onPlaidSuccess,
    onExit: () => {
      localStorage.removeItem('plaid_oauth_link_token');
      setLinkToken(null);
    },
  });

  useEffect(() => {
    if (linkToken && plaidLinkReady) {
      openPlaidLink();
    }
  }, [linkToken, plaidLinkReady, openPlaidLink]);

  const handleConnectBank = async () => {
    setBankError(null);
    setIsConnectingBank(true);
    try {
      const token = await workSuiteService.createPlaidLinkToken();
      localStorage.setItem('plaid_oauth_link_token', token);
      setLinkToken(token);
    } catch {
      setBankError('Could not start bank connection — try again later.');
      setIsConnectingBank(false);
    }
  };

  const handleDisconnectBank = async (connection: BankConnection) => {
    setBankConnections((prev) => prev.filter((c) => c.id !== connection.id));
    try {
      await workSuiteService.removeBankConnection(connection.id);
    } catch {
      await loadBank();
    }
  };

  const handleVerifyBankAccount = async (accountId: string) => {
    setVerifyingAccountId(accountId);
    try {
      const updated = await workSuiteService.verifyBankAccount(accountId);
      setBankConnections((prev) =>
        prev.map((c) => ({ ...c, accounts: c.accounts.map((a) => (a.id === accountId ? { ...a, verificationStatus: updated.verificationStatus, verifiedAt: updated.verifiedAt } : a)) }))
      );
    } catch {
      // Leave the row as-is — the badge already reflects the last known
      // state, and the button stays available to retry.
    } finally {
      setVerifyingAccountId(null);
    }
  };

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    headline: '',
    location: '',
    about: '',
    website: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  // Section data states
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Form states for modals
  const [experienceForm, setExperienceForm] = useState<Partial<Experience>>({});
  const [educationForm, setEducationForm] = useState<Partial<Education>>({});
  const [skillForm, setSkillForm] = useState<Partial<Skill>>({});
  const [certificationForm, setCertificationForm] = useState<Partial<Certification>>({});
  const [languageForm, setLanguageForm] = useState<Partial<Language>>({});
  const [projectForm, setProjectForm] = useState<Partial<Project>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (tab === 'enhance' || tab === 'info' || tab === 'sections') {
      setActiveTab(tab);
    } else if (section === 'add') {
      setActiveTab('sections');
    }
  }, [tab, section]);

  useEffect(() => {
    // Load basic profile data
    try {
      const raw = localStorage.getItem(PROFILE_OVERRIDES_KEY);
      if (raw) {
        const overrides = JSON.parse(raw) as Partial<typeof formData>;
        setFormData(prev => ({
          ...prev,
          headline: overrides.headline ?? prev.headline,
          location: overrides.location ?? prev.location,
          about: overrides.about ?? prev.about,
          website: overrides.website ?? prev.website,
          phone: overrides.phone ?? prev.phone,
        }));
      }

      // Load sections data
      const sectionsRaw = localStorage.getItem(PROFILE_SECTIONS_KEY);
      if (sectionsRaw) {
        const sectionsData = JSON.parse(sectionsRaw);
        setExperiences(sectionsData.experiences || []);
        setEducations(sectionsData.educations || []);
        setSkills(sectionsData.skills || []);
        setCertifications(sectionsData.certifications || []);
        setLanguages(sectionsData.languages || []);
        setProjects(sectionsData.projects || []);
      }
      
      // Load photos
      setProfilePhoto(localStorage.getItem(scopedKey('ornave_profile_photo', user?.id)) || '');
      setBackgroundPhoto(localStorage.getItem(scopedKey('ornave_background_photo', user?.id)) || '');
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    apiClient.getProfile().then((response) => {
      const profile = response?.data?.profile;
      if (!profile) return;
      setFormData((prev) => ({
        ...prev,
        streetAddress: profile.streetAddress || prev.streetAddress,
        city: profile.city || prev.city,
        state: profile.state || prev.state,
        postalCode: profile.postalCode || prev.postalCode,
        country: profile.country || prev.country,
      }));
    }).catch(() => {
      // Not logged in yet or request failed — leave fields blank.
    });
  }, []);

  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    if (!user?.email) {
      setError('Email is missing. Please log in again.');
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: user.email,
        phone: formData.phone,
        bio: formData.about,
        website: formData.website,
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      });
      localStorage.setItem(
        PROFILE_OVERRIDES_KEY,
        JSON.stringify({
          headline: formData.headline,
          location: formData.location,
          about: formData.about,
          website: formData.website,
          phone: formData.phone,
        })
      );
      TokenStorage.setUser({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setSuccess('Profile updated successfully.');
      setTimeout(() => {
        window.location.href = '/profile';
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const saveSectionsData = () => {
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({
      experiences,
      educations,
      skills,
      certifications,
      languages,
      projects,
    }));
  };

  // Photo upload handlers
  const handlePhotoUpload = (type: 'profile' | 'background') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (type === 'profile') {
            setProfilePhoto(result);
            localStorage.setItem(scopedKey('ornave_profile_photo', user?.id), result);
          } else {
            setBackgroundPhoto(result);
            localStorage.setItem(scopedKey('ornave_background_photo', user?.id), result);
          }
          setSuccess(`${type === 'profile' ? 'Profile' : 'Background'} photo uploaded successfully!`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Silver and above include Verified status for free — Basic and Bronze
  // still need to buy the Verified add-on separately.
  const AUTO_VERIFIED_TIERS = ['Silver Member', 'Gold Member', 'Diamond Member'];

  const formatLockDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // Each paid tier gets its own metal-toned card treatment so the ladder
  // reads visually rather than just by price.
  const tierCardClass = (tierId: string): string => {
    switch (tierId) {
      case 'Bronze Member': return 'status-tier-card--bronze';
      case 'Silver Member': return 'status-tier-card--silver';
      case 'Gold Member': return 'status-tier-card--gold';
      case 'Diamond Member': return 'status-tier-card--diamond';
      default: return '';
    }
  };

  const applyMembershipStatus = (status: { memberTier: MemberTier; isVerified: boolean; canDowngradeAt?: string | null; billingPeriod?: 'MONTHLY' | 'ANNUAL' | null; cancelAt?: string | null }) => {
    const tierId = STATUS_TIERS.find((t) => t.code === status.memberTier)?.id || 'Basic';
    localStorage.setItem(scopedKey(MEMBER_TIER_KEY, user?.id), tierId);
    localStorage.setItem(scopedKey(VERIFIED_ADDON_KEY, user?.id), status.isVerified ? 'true' : 'false');
    setCurrentTier(tierId);
    setHasVerified(status.isVerified);
    setCanDowngradeAt(status.canDowngradeAt ?? null);
    setLockedBillingPeriod(status.billingPeriod ?? null);
    setCancelAt(status.cancelAt ?? null);
    window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'member_tier', tier: tierId } }));
  };

  // Real purchases now happen on Stripe's hosted Checkout page (subscriptions
  // need proper SCA/proration/renewal handling we don't want to reimplement).
  // Landing back here from a successful checkout is handled below, on mount.
  useEffect(() => {
    if (!user || user.id === 'guest') return;
    const membershipResult = searchParams.get('membership');
    const sessionId = searchParams.get('session_id');

    const sync = async () => {
      if (membershipResult === 'success' && sessionId) {
        try {
          const status = await billingService.reconcileMembershipCheckout(sessionId);
          applyMembershipStatus(status);
          const terms = status.billingPeriod === 'ANNUAL'
            ? ` Valid through ${formatLockDate(status.canDowngradeAt)} — this is a one-time payment and won't auto-renew, so mark your calendar if you want to keep it.`
            : status.billingPeriod === 'MONTHLY' && status.canDowngradeAt
              ? ` It renews monthly and has a minimum commitment until ${formatLockDate(status.canDowngradeAt)}.`
              : '';
          setSuccess(`You're all set — your new status is active!${terms}`);
        } catch {
          setError('We received your payment but could not confirm your new status yet — refresh in a moment.');
        }
      } else {
        // Not returning from checkout — still worth a background refresh in
        // case a renewal/cancellation happened via the Stripe portal or a
        // webhook since the last time this page loaded.
        billingService.getMembershipStatus().then(applyMembershipStatus).catch(() => {});
      }
      if (membershipResult) {
        searchParams.delete('membership');
        searchParams.delete('session_id');
        setSearchParams(searchParams, { replace: true });
      }
    };
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handlePurchaseTier = async (tier: StatusTier, billingPeriod: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') => {
    setIsPurchasing(billingPeriod === 'ANNUAL' ? `${tier.id}-annual` : tier.id);
    setError('');
    try {
      if (tier.code === 'BASIC') {
        // Immediate, in-app downgrade — cancels the paid subscription right
        // now rather than sending them through the portal's "keep benefits
        // until period end" cancel flow, matching how every other tier
        // change here is instant.
        const status = await billingService.downgradeToBasic();
        applyMembershipStatus(status);
        setSuccess("You're now on the Basic tier!");
        setIsPurchasing(null);
        return;
      }
      const url = await billingService.createTierCheckout(tier.code as Exclude<MemberTier, 'BASIC'>, billingPeriod);
      window.location.href = url;
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || (tier.code === 'BASIC'
        ? 'Could not switch to Basic — try again.'
        : 'Could not start checkout — try again.'));
      setIsPurchasing(null);
    }
  };

  const handlePurchaseVerified = async () => {
    setIsPurchasing('Verified');
    setError('');
    try {
      const url = await billingService.createVerifiedCheckout();
      window.location.href = url;
    } catch {
      setError('Could not start checkout — try again.');
      setIsPurchasing(null);
    }
  };

  const handleCancelMembership = async () => {
    setIsCancelling(true);
    setError('');
    try {
      const status = await billingService.cancelMembership();
      applyMembershipStatus(status);
      const message = status.effective === 'immediate'
        ? "Your subscription has been canceled and you're now on the Basic tier. A confirmation has been sent to your email."
        : status.effective === 'scheduled'
          ? `Your cancellation is confirmed — you'll keep your status until ${formatLockDate(status.cancelAt)}, then automatically switch to Basic. A confirmation has been sent to your email.`
          : 'Your annual status is one-time and already set not to renew — nothing further to cancel. A confirmation has been sent to your email.';
      setSuccess(message);
      setActiveModal(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not process the cancellation — try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUndoCancellation = async () => {
    setIsCancelling(true);
    setError('');
    try {
      const status = await billingService.undoCancelMembership();
      applyMembershipStatus(status);
      setSuccess('Cancellation undone — your subscription will continue as normal.');
      setActiveModal(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not undo the cancellation — try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingId(null);
  };

  // Experience handlers
  const handleAddExperience = () => {
    if (!experienceForm.title || !experienceForm.company) {
      setError('Title and company are required');
      return;
    }
    const isEditing = !!editingId;
    const entry: Experience = {
      id: editingId || Date.now().toString(),
      title: experienceForm.title!,
      company: experienceForm.company!,
      location: experienceForm.location || '',
      startDate: experienceForm.startDate || '',
      endDate: experienceForm.endDate || '',
      current: experienceForm.current || false,
      description: experienceForm.description || '',
    };
    const updated = isEditing ? experiences.map(e => e.id === editingId ? entry : e) : [...experiences, entry];
    setExperiences(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), experiences: updated }));
    setExperienceForm({});
    setEditingId(null);
    setActiveModal(null);
    setSuccess(isEditing ? 'Experience updated successfully!' : 'Experience added successfully!');
  };

  // Education handlers
  const handleAddEducation = () => {
    if (!educationForm.school || !educationForm.degree) {
      setError('School and degree are required');
      return;
    }
    const isEditing = !!editingId;
    const entry: Education = {
      id: editingId || Date.now().toString(),
      school: educationForm.school!,
      degree: educationForm.degree!,
      field: educationForm.field || '',
      startDate: educationForm.startDate || '',
      endDate: educationForm.endDate || '',
      current: educationForm.current || false,
      description: educationForm.description || '',
    };
    const updated = isEditing ? educations.map(e => e.id === editingId ? entry : e) : [...educations, entry];
    setEducations(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), educations: updated }));
    setEducationForm({});
    setEditingId(null);
    setActiveModal(null);
    setSuccess(isEditing ? 'Education updated successfully!' : 'Education added successfully!');
  };

  // Skill handlers
  const handleAddSkill = () => {
    if (!skillForm.name) {
      setError('Skill name is required');
      return;
    }
    const isEditing = !!editingId;
    const entry: Skill = {
      id: editingId || Date.now().toString(),
      name: skillForm.name!,
      level: skillForm.level || 'Intermediate',
    };
    const updated = isEditing ? skills.map(s => s.id === editingId ? entry : s) : [...skills, entry];
    setSkills(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), skills: updated }));
    setSkillForm({});
    setEditingId(null);
    setActiveModal(null);
    setSuccess(isEditing ? 'Skill updated successfully!' : 'Skill added successfully!');
  };

  // Certification handlers
  const handleAddCertification = () => {
    if (!certificationForm.name || !certificationForm.organization) {
      setError('Certification name and organization are required');
      return;
    }
    const isEditing = !!editingId;
    const entry: Certification = {
      id: editingId || Date.now().toString(),
      name: certificationForm.name!,
      organization: certificationForm.organization!,
      issueDate: certificationForm.issueDate || '',
      credentialId: certificationForm.credentialId || '',
      credentialUrl: certificationForm.credentialUrl || '',
    };
    const updated = isEditing ? certifications.map(c => c.id === editingId ? entry : c) : [...certifications, entry];
    setCertifications(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), certifications: updated }));
    setCertificationForm({});
    setEditingId(null);
    setActiveModal(null);
    setSuccess(isEditing ? 'Certification updated successfully!' : 'Certification added successfully!');
  };

  // Language handlers
  const handleAddLanguage = () => {
    if (!languageForm.name) {
      setError('Language name is required');
      return;
    }
    const isEditing = !!editingId;
    const entry: Language = {
      id: editingId || Date.now().toString(),
      name: languageForm.name!,
      proficiency: languageForm.proficiency || 'Professional Working',
    };
    const updated = isEditing ? languages.map(l => l.id === editingId ? entry : l) : [...languages, entry];
    setLanguages(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), languages: updated }));
    setLanguageForm({});
    setEditingId(null);
    setActiveModal(null);
    setSuccess(isEditing ? 'Language updated successfully!' : 'Language added successfully!');
  };

  // Project handlers
  const handleAddProject = () => {
    if (!projectForm.name) {
      setError('Project name is required');
      return;
    }
    const isEditing = !!editingId;
    const entry: Project = {
      id: editingId || Date.now().toString(),
      name: projectForm.name!,
      description: projectForm.description || '',
      url: projectForm.url || '',
      startDate: projectForm.startDate || '',
      endDate: projectForm.endDate || '',
      current: projectForm.current || false,
    };
    const updated = isEditing ? projects.map(p => p.id === editingId ? entry : p) : [...projects, entry];
    setProjects(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), projects: updated }));
    setProjectForm({});
    setEditingId(null);
    setActiveModal(null);
    setSuccess(isEditing ? 'Project updated successfully!' : 'Project added successfully!');
  };

  const sections = [
    { id: 'experience', title: 'Experience', description: 'Add your work history' },
    { id: 'education', title: 'Education', description: 'Add your education background' },
    { id: 'skills', title: 'Skills', description: 'Highlight your key skills' },
    { id: 'certifications', title: 'Certifications', description: 'Add professional certifications' },
    { id: 'languages', title: 'Languages', description: 'Add languages you speak' },
    { id: 'projects', title: 'Projects', description: 'Showcase your projects' },
  ];

  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="profile-edit-page">
      <Navbar />

      <div className="profile-edit-shell">
        <button className="profile-edit-backlink" onClick={() => navigate('/profile')}>
          ← Back to Profile
        </button>

        <div className="profile-edit-layout">
          <aside className="profile-edit-preview">
            <div
              className="profile-edit-preview__banner"
              style={backgroundPhoto ? { backgroundImage: `url(${backgroundPhoto})` } : undefined}
            >
              <div className="profile-edit-preview__avatar">
                {profilePhoto ? <img src={profilePhoto} alt="Profile" /> : initials}
              </div>
            </div>
            <div className="profile-edit-preview__body">
              <h3>{formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'Your Name'}</h3>
              <p className="profile-edit-preview__headline">{formData.headline || 'Add a headline to introduce yourself'}</p>
              {formData.location && <p className="profile-edit-preview__location">{formData.location}</p>}
              <span className="profile-edit-preview__tier">
                {currentTier}{currentTier === 'Basic' ? ' tier' : ''}{hasVerified ? ' · Verified' : ''}
              </span>
            </div>
            <div className="profile-edit-preview__note">This is a live preview of how your profile card will appear to others.</div>
          </aside>

          <div className="profile-edit-main">
            <div className="profile-edit-header">
              <h1>Edit Profile</h1>
              <p>Manage your public identity, media, and professional history.</p>
            </div>

            <nav className="profile-edit-tabs">
              <button
                className={`profile-edit-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Basic Info
              </button>
              <button
                className={`profile-edit-tab ${activeTab === 'enhance' ? 'active' : ''}`}
                onClick={() => setActiveTab('enhance')}
              >
                Subscriptions
              </button>
              <button
                className={`profile-edit-tab ${activeTab === 'sections' ? 'active' : ''}`}
                onClick={() => setActiveTab('sections')}
              >
                Add Sections
              </button>
            </nav>

            <div className="profile-edit-content">
              {error && <div className="form-message error">{error}</div>}
              {success && <div className="form-message success">{success}</div>}
              {activeTab === 'info' && (
                <div className="edit-section">
                  <h2>Basic Information</h2>
                  <p className="section-description">Update your photo, banner, primary identity data, and contact details</p>

              <div className="photo-edit-card">
                <div
                  className="photo-edit-card__banner"
                  style={backgroundPhoto ? { backgroundImage: `url(${backgroundPhoto})` } : undefined}
                >
                  <button className="photo-edit-card__banner-btn" onClick={() => handlePhotoUpload('background')}>
                    {backgroundPhoto ? 'Change Banner' : 'Upload Banner'}
                  </button>
                </div>
                <div className="photo-edit-card__body">
                  <div className="photo-edit-card__avatar">
                    {profilePhoto ? <img src={profilePhoto} alt="Profile" /> : initials}
                  </div>
                  <div className="photo-edit-card__meta">
                    <button className="btn-add" onClick={() => handlePhotoUpload('profile')}>
                      {profilePhoto ? 'Update Photo' : 'Upload Photo'}
                    </button>
                    <p>Square images work best, at least 400×400px.</p>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Headline *</label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleChange}
                  placeholder="e.g. Chief Technology Officer | Enterprise Architect"
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Remote, Berlin, Germany"
                />
              </div>

              <div className="form-group">
                <label>About / Bio</label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="Tell us about your professional journey..."
                  rows={6}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourportfolio.tech"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+49 (170) 987-6543"
                  />
                </div>
              </div>

              <h3 className="form-section-heading">Billing address</h3>
              <p className="form-section-hint">Used to pre-fill checkout when you buy something on the Marketplace.</p>

              <div className="form-group">
                <label>Street address</label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="123 Main St"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Chicago"
                  />
                </div>
                <div className="form-group">
                  <label>State / Region</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="IL"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Postal code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="60601"
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="United States"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => navigate('/profile')} disabled={isSaving}>
                  Discard Changes
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <h3 className="form-section-heading" style={{ marginTop: '32px' }}>Automatic Check-In Profile</h3>
              <p className="form-section-hint">
                A small, separate profile used only to confirm your identity for Automatic Check-In at reservations — not part of your public profile, and doesn't affect it.
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label>Legal first name</label>
                  <input
                    type="text"
                    value={checkInFirstName}
                    onChange={(e) => setCheckInFirstName(e.target.value)}
                    placeholder="As it appears on your bank account"
                  />
                </div>
                <div className="form-group">
                  <label>Legal last name</label>
                  <input
                    type="text"
                    value={checkInLastName}
                    onChange={(e) => setCheckInLastName(e.target.value)}
                    placeholder="As it appears on your bank account"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={checkInPhone}
                    onChange={(e) => setCheckInPhone(e.target.value)}
                    placeholder="+49 (170) 987-6543"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={checkInEmail}
                    onChange={(e) => setCheckInEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>ID-style photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {checkInPhotoUrl ? (
                    <img
                      src={checkInPhotoUrl}
                      alt="Check-in photo"
                      style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--tech-border, #2a2a22)' }}
                    />
                  ) : (
                    <div style={{ width: '72px', height: '72px', borderRadius: '8px', border: '1px dashed var(--tech-border, #2a2a22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', color: 'var(--color-muted, #a79e8c)', textAlign: 'center' }}>
                      No photo
                    </div>
                  )}
                  <button type="button" className="btn-secondary" onClick={handleUploadCheckInPhoto} disabled={isUploadingCheckInPhoto}>
                    {isUploadingCheckInPhoto ? 'Uploading...' : checkInPhotoUrl ? 'Replace Photo' : 'Upload Photo'}
                  </button>
                </div>
                <p className="form-section-hint" style={{ marginTop: '6px' }}>
                  A clear headshot — required for Automatic Check-In so restaurant staff can recognize you. Uploads immediately, separately from the fields below.
                </p>
              </div>

              <div className="form-group">
                <label>NFC card (optional)</label>
                {isNfcSupported ? (
                  <>
                    <button type="button" className="btn-secondary" onClick={handleWriteNfcCard} disabled={isWritingNfcCard}>
                      {isWritingNfcCard ? 'Writing…' : 'Write NFC Card'}
                    </button>
                    {nfcCardStatus && <p className="form-section-hint" style={{ marginTop: '6px' }}>{nfcCardStatus}</p>}
                    <p className="form-section-hint" style={{ marginTop: '6px' }}>
                      Tap a blank writable NFC tag/card against this device to link it to your reservations — a restaurant kiosk can then read it to check you in. Not required; the kiosk can also look you up by phone number.
                    </p>
                  </>
                ) : (
                  <p className="form-section-hint">
                    NFC card setup needs Chrome on Android — this device/browser can't write one. Restaurants can still check you in by looking up your phone number.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Notes for restaurant staff (optional)</label>
                <textarea
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="e.g. peanut allergy, wheelchair access needed"
                />
                <p className="form-section-hint" style={{ marginTop: '4px' }}>
                  Shown to restaurant staff only when you're automatically checked in — not part of your public profile.
                </p>
              </div>

              <div className="form-actions">
                {checkInSavedAt && <span style={{ color: 'var(--color-success, #4f9d5c)', fontSize: '0.85rem', alignSelf: 'center', marginRight: 'auto' }}>Saved</span>}
                <button className="btn-primary" onClick={handleSaveCheckInProfile} disabled={isSavingCheckIn}>
                  {isSavingCheckIn ? 'Saving...' : 'Save Check-In Profile'}
                </button>
              </div>

              <h3 className="form-section-heading" style={{ marginTop: '32px' }}>Bank Account</h3>
              <p className="form-section-hint">
                Connect and verify a bank account — the third Automatic Check-In requirement. Verifying confirms via Plaid Identity that the account belongs to you.
              </p>

              {bankError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', margin: '0 0 12px' }}>{bankError}</p>}

              {isLoadingBank ? (
                <div className="worksuite-empty">Loading bank accounts…</div>
              ) : bankConnections.length === 0 ? (
                plaidConfigured ? (
                  <div className="worksuite-empty worksuite-empty--goals">
                    <p>No bank accounts connected yet.</p>
                    <button className="worksuite-create-btn" onClick={handleConnectBank} disabled={isConnectingBank}>
                      {isConnectingBank ? 'Connecting…' : '+ Connect Bank'}
                    </button>
                  </div>
                ) : (
                  <p className="form-section-hint">Bank connections aren't configured on this environment yet.</p>
                )
              ) : (
                <>
                  {bankConnections.map((connection) => (
                    <div key={connection.id} className="worksuite-bank-card">
                      <div className="worksuite-bank-card__header">
                        <div>
                          <h3 className="worksuite-bank-card__title">{connection.institutionName || 'Connected bank'}</h3>
                          <span className="worksuite-bank-card__count">{connection.accounts.length} account{connection.accounts.length === 1 ? '' : 's'}</span>
                        </div>
                        <button className="worksuite-bank-card__disconnect" onClick={() => handleDisconnectBank(connection)}>
                          <IconClose size={12} /> Disconnect
                        </button>
                      </div>

                      <div className="worksuite-bank-account-list">
                        {connection.accounts.map((account) => (
                          <div key={account.id} className="worksuite-bank-account-row">
                            <div className="worksuite-bank-account-row__icon"><IconCard size={15} /></div>
                            <div className="worksuite-bank-account-row__info">
                              <div className="worksuite-bank-account-row__name">
                                {account.name}
                                {account.mask && <span className="worksuite-bank-account-row__mask">••••{account.mask}</span>}
                              </div>
                              <div className="worksuite-bank-account-row__type">{account.type}{account.subtype ? ` · ${account.subtype}` : ''}</div>
                            </div>
                            {account.verificationStatus === 'VERIFIED' ? (
                              <span className="worksuite-bank-account-row__verified">✓ Verified</span>
                            ) : (
                              <button
                                className="worksuite-bank-account-row__verify-btn"
                                onClick={() => handleVerifyBankAccount(account.id)}
                                disabled={verifyingAccountId === account.id}
                                title="Confirms this account belongs to you via Plaid Identity — required for Automatic Check-In"
                              >
                                {verifyingAccountId === account.id ? 'Verifying…' : account.verificationStatus === 'FAILED' ? 'Retry Verify' : 'Verify'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button className="btn-secondary" onClick={handleConnectBank} disabled={isConnectingBank} style={{ marginTop: '8px' }}>
                    {isConnectingBank ? 'Connecting…' : '+ Connect Another Bank'}
                  </button>
                </>
              )}
                </div>
              )}

              {activeTab === 'enhance' && (
                <div className="edit-section">
                  <h2>Subscriptions &amp; Tiers</h2>
                  <p className="section-description">
                    Buy or manage your Ornave Status — subscribe monthly, pay for a full year up front, or downgrade and cancel any time
                  </p>

              <div className="enhancement-list">
                <div className="enhancement-row">
                  <span className="enhancement-row__icon">O</span>
                  <div className="enhancement-row__body">
                    <h3>Ornave Status</h3>
                    <p>
                      You're currently on the {currentTier}{currentTier === 'Basic' ? ' tier' : ''}{hasVerified ? ' · Verified ✓' : ''}
                      {currentTier !== 'Basic' && cancelAt ? (
                        ` · Canceling — switches to Basic on ${formatLockDate(cancelAt)}`
                      ) : currentTier !== 'Basic' && lockedBillingPeriod && (
                        lockedBillingPeriod === 'ANNUAL'
                          ? ` · Annual — valid through ${formatLockDate(canDowngradeAt)}, does not auto-renew`
                          : (canDowngradeAt ? ` · Monthly, renews automatically — min. commitment until ${formatLockDate(canDowngradeAt)}` : ' · Monthly, renews automatically, cancel anytime')
                      )}
                    </p>
                  </div>
                  <div className="enhancement-row__actions">
                    {currentTier !== 'Basic' && (
                      cancelAt ? (
                        <button className="btn-outline" onClick={handleUndoCancellation} disabled={isCancelling}>
                          {isCancelling ? 'Undoing…' : 'Undo Cancellation'}
                        </button>
                      ) : (
                        <button className="btn-outline" onClick={() => setActiveModal('cancel')}>
                          Cancel Subscription
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="status-shop">
                <p className="status-shop__intro">
                  Unlock a new status to stand out across Ornave. Statuses apply instantly and update everywhere your profile appears.
                  Silver and above require staying subscribed at least 3 months before switching away; paying annually locks in the full year instead, with no auto-renewal.
                </p>
                <div className="status-shop__grid">
                  {STATUS_TIERS.map((tier) => {
                    const isCurrent = currentTier === tier.id;
                    const isLockedBasic = tier.code === 'BASIC' && !isCurrent && !!canDowngradeAt;
                    const hasCommitment = tier.code && ['SILVER', 'GOLD', 'DIAMOND'].includes(tier.code);
                    return (
                      <div key={tier.id} className={`status-tier-card ${tierCardClass(tier.id)} ${isCurrent ? 'status-tier-card--current' : ''}`}>
                        <h3>{tier.name}</h3>
                        <p className="status-tier-card__tagline">{tier.tagline}</p>
                        <div className="status-tier-card__price">{tier.price}</div>
                        <ul className="status-tier-card__perks">
                          {tier.perks.map((perk) => <li key={perk}>{perk}</li>)}
                        </ul>
                        {isCurrent && currentTier !== 'Basic' && lockedBillingPeriod && (
                          <p className="status-tier-card__tagline" style={{ color: 'var(--color-muted)' }}>
                            {lockedBillingPeriod === 'ANNUAL'
                              ? `Valid through ${formatLockDate(canDowngradeAt)} — one-time payment, does not auto-renew.`
                              : canDowngradeAt
                                ? `Renews monthly — minimum commitment until ${formatLockDate(canDowngradeAt)}.`
                                : 'Renews monthly — cancel anytime.'}
                          </p>
                        )}
                        {!isCurrent && hasCommitment && (
                          <p className="status-tier-card__tagline" style={{ color: 'var(--color-muted)' }}>
                            Monthly plan has a 3-month minimum before you can switch away.
                          </p>
                        )}
                        {isLockedBasic && (
                          <p className="status-tier-card__tagline" style={{ color: 'var(--color-muted)' }}>
                            Available {formatLockDate(canDowngradeAt)} — {lockedBillingPeriod === 'ANNUAL' ? 'your annual status runs a full year' : 'Silver and above have a 3-month minimum'}.
                          </p>
                        )}
                        {isCurrent ? (
                          <>
                            <button className="btn-secondary" disabled>Current Status</button>
                            {tier.code !== 'BASIC' && (
                              cancelAt ? (
                                <button className="btn-secondary" style={{ marginTop: '8px' }} onClick={handleUndoCancellation} disabled={isCancelling}>
                                  {isCancelling ? 'Undoing…' : 'Undo Cancellation'}
                                </button>
                              ) : (
                                <button className="btn-secondary" style={{ marginTop: '8px' }} onClick={() => setActiveModal('cancel')}>
                                  Cancel Subscription
                                </button>
                              )
                            )}
                          </>
                        ) : (
                          <>
                            <button className="btn-primary" onClick={() => handlePurchaseTier(tier)} disabled={!!isPurchasing || isLockedBasic}>
                              {isPurchasing === tier.id
                                ? (tier.price === 'Free' ? 'Switching…' : 'Redirecting…')
                                : tier.price === 'Free' ? 'Switch to This' : 'Choose This Status'}
                            </button>
                            {tier.annualPrice && (
                              <button
                                className="btn-secondary"
                                style={{ marginTop: '8px' }}
                                onClick={() => handlePurchaseTier(tier, 'ANNUAL')}
                                disabled={!!isPurchasing}
                              >
                                {isPurchasing === `${tier.id}-annual` ? 'Redirecting…' : `or ${tier.annualPrice} (1 year, no auto-renew)`}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="status-shop__addon">
                  <div className="status-shop__addon-body">
                    <h3>{VERIFIED_ADDON.name}</h3>
                    <p className="status-tier-card__tagline">
                      {AUTO_VERIFIED_TIERS.includes(currentTier)
                        ? 'Included free with Silver, Gold, and Diamond status'
                        : VERIFIED_ADDON.tagline}
                    </p>
                  </div>
                  <div className="status-shop__addon-price">
                    {hasVerified ? 'Included' : VERIFIED_ADDON.price}
                  </div>
                  {hasVerified ? (
                    <button className="btn-secondary" disabled>Owned</button>
                  ) : (
                    <button className="btn-primary" onClick={handlePurchaseVerified} disabled={!!isPurchasing}>
                      {isPurchasing === 'Verified' ? 'Redirecting…' : 'Add Verified'}
                    </button>
                  )}
                </div>
              </div>
                </div>
              )}

              {activeTab === 'sections' && (
                <div className="edit-section">
                  <h2>Profile Sections</h2>
                  <p className="section-description">
                    Configure availability and populate your professional ledger with structured experience data
                  </p>

              <div className="sections-grid">
                <div className="section-block">
                  <div className="section-card">
                    <div className="section-icon">A</div>
                    <div className="section-info">
                      <h3>Availability Status</h3>
                      <p>Configure availability preferences</p>
                    </div>
                    <button className="btn-add" onClick={() => navigate('/profile/settings/open-to')}>Set Status</button>
                  </div>
                </div>

                {sections.map(sec => {
                  const entries: { id: string; title: string; subtitle: string; onEdit: () => void; onDelete: () => void }[] =
                    sec.id === 'experience' ? experiences.map(exp => ({
                      id: exp.id, title: exp.title, subtitle: exp.company,
                      onEdit: () => {
                        setExperienceForm(exp);
                        setEditingId(exp.id);
                        setActiveModal('experience');
                      },
                      onDelete: () => {
                        const updated = experiences.filter(e => e.id !== exp.id);
                        setExperiences(updated);
                        localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), experiences: updated }));
                      },
                    })) :
                    sec.id === 'education' ? educations.map(edu => ({
                      id: edu.id, title: edu.school, subtitle: edu.degree,
                      onEdit: () => {
                        setEducationForm(edu);
                        setEditingId(edu.id);
                        setActiveModal('education');
                      },
                      onDelete: () => {
                        const updated = educations.filter(e => e.id !== edu.id);
                        setEducations(updated);
                        localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), educations: updated }));
                      },
                    })) :
                    sec.id === 'skills' ? skills.map(skill => ({
                      id: skill.id, title: skill.name, subtitle: skill.level,
                      onEdit: () => {
                        setSkillForm(skill);
                        setEditingId(skill.id);
                        setActiveModal('skills');
                      },
                      onDelete: () => {
                        const updated = skills.filter(s => s.id !== skill.id);
                        setSkills(updated);
                        localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), skills: updated }));
                      },
                    })) :
                    sec.id === 'certifications' ? certifications.map(cert => ({
                      id: cert.id, title: cert.name, subtitle: cert.organization,
                      onEdit: () => {
                        setCertificationForm(cert);
                        setEditingId(cert.id);
                        setActiveModal('certifications');
                      },
                      onDelete: () => {
                        const updated = certifications.filter(c => c.id !== cert.id);
                        setCertifications(updated);
                        localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), certifications: updated }));
                      },
                    })) :
                    sec.id === 'languages' ? languages.map(lang => ({
                      id: lang.id, title: lang.name, subtitle: lang.proficiency,
                      onEdit: () => {
                        setLanguageForm(lang);
                        setEditingId(lang.id);
                        setActiveModal('languages');
                      },
                      onDelete: () => {
                        const updated = languages.filter(l => l.id !== lang.id);
                        setLanguages(updated);
                        localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), languages: updated }));
                      },
                    })) :
                    projects.map(proj => ({
                      id: proj.id, title: proj.name, subtitle: `${proj.startDate} – ${proj.current ? 'Present' : proj.endDate}`,
                      onEdit: () => {
                        setProjectForm(proj);
                        setEditingId(proj.id);
                        setActiveModal('projects');
                      },
                      onDelete: () => {
                        const updated = projects.filter(p => p.id !== proj.id);
                        setProjects(updated);
                        localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), projects: updated }));
                      },
                    }));

                  return (
                    <div key={sec.id} className="section-block">
                      <div className="section-card">
                        <div className="section-icon">{sec.title[0]}</div>
                        <div className="section-info">
                          <h3>{sec.title}</h3>
                          <p>{sec.description}</p>
                        </div>
                        <button className="btn-add" onClick={() => {
                          setEditingId(null);
                          if (sec.id === 'experience') setExperienceForm({});
                          else if (sec.id === 'education') setEducationForm({});
                          else if (sec.id === 'skills') setSkillForm({});
                          else if (sec.id === 'certifications') setCertificationForm({});
                          else if (sec.id === 'languages') setLanguageForm({});
                          else setProjectForm({});
                          setActiveModal(sec.id);
                        }}>+ Add Entry</button>
                      </div>

                      {entries.length > 0 && (
                        <div className="section-entries">
                          {entries.map(entry => (
                            <div key={entry.id} className="section-entry">
                              <div>
                                <div className="section-entry__title">{entry.title}</div>
                                <div className="section-entry__subtitle">{entry.subtitle}</div>
                              </div>
                              <div className="section-entry__actions">
                                <button className="btn-icon-edit" onClick={entry.onEdit}>Edit</button>
                                <button className="btn-icon-danger" onClick={entry.onDelete}>Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? (MODAL_TITLES[activeModal]?.replace('Add', 'Edit') || 'Edit Entry') : (MODAL_TITLES[activeModal] || 'Add Entry')}</h2>

            <div className="tech-form" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activeModal === 'experience' && (
                <>
                  <div className="form-group">
                    <label className="modal-field-label">Position / Title</label>
                    <input type="text" className="tech-input" value={experienceForm.title || ''} onChange={(e) => setExperienceForm({...experienceForm, title: e.target.value})} placeholder="e.g. Systems Architect" />
                  </div>
                  <div className="form-group">
                    <label className="modal-field-label">Company</label>
                    <input type="text" className="tech-input" value={experienceForm.company || ''} onChange={(e) => setExperienceForm({...experienceForm, company: e.target.value})} placeholder="e.g. Global Tech Corp" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="modal-field-label">Start Date</label>
                      <input type="month" className="tech-input" value={experienceForm.startDate || ''} onChange={(e) => setExperienceForm({...experienceForm, startDate: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="modal-field-label">End Date</label>
                      <input type="month" className="tech-input" value={experienceForm.endDate || ''} onChange={(e) => setExperienceForm({...experienceForm, endDate: e.target.value})} disabled={experienceForm.current} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="modal-field-label">Description</label>
                    <textarea className="tech-input" value={experienceForm.description || ''} onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})} rows={6} placeholder="What did you do in this role? Feel free to write as much as you'd like." />
                  </div>
                </>
              )}

              {activeModal === 'education' && (
                <>
                  <div className="form-group">
                    <label className="modal-field-label">Institution</label>
                    <input type="text" className="tech-input" value={educationForm.school || ''} onChange={(e) => setEducationForm({...educationForm, school: e.target.value})} placeholder="e.g. MIT" />
                  </div>
                  <div className="form-group">
                    <label className="modal-field-label">Degree / Field</label>
                    <input type="text" className="tech-input" value={educationForm.degree || ''} onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})} placeholder="e.g. MS Computer Science" />
                  </div>
                </>
              )}

              {activeModal === 'skills' && (
                <>
                  <div className="form-group">
                    <label className="modal-field-label">Skill</label>
                    <input type="text" className="tech-input" value={skillForm.name || ''} onChange={(e) => setSkillForm({...skillForm, name: e.target.value})} placeholder="e.g. Cloud Architecture" />
                  </div>
                  <div className="form-group">
                    <label className="modal-field-label">Proficiency level</label>
                    <select className="tech-input" value={skillForm.level || 'Intermediate'} onChange={(e) => setSkillForm({...skillForm, level: e.target.value as any})}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </>
              )}

              {activeModal === 'certifications' && (
                <>
                  <div className="form-group">
                    <label className="modal-field-label">Certificate name</label>
                    <input type="text" className="tech-input" value={certificationForm.name || ''} onChange={(e) => setCertificationForm({...certificationForm, name: e.target.value})} placeholder="e.g. AWS Solutions Architect" />
                  </div>
                  <div className="form-group">
                    <label className="modal-field-label">Issuing organization</label>
                    <input type="text" className="tech-input" value={certificationForm.organization || ''} onChange={(e) => setCertificationForm({...certificationForm, organization: e.target.value})} placeholder="e.g. Amazon Web Services" />
                  </div>
                </>
              )}

              {activeModal === 'languages' && (
                <>
                  <div className="form-group">
                    <label className="modal-field-label">Language</label>
                    <input type="text" className="tech-input" value={languageForm.name || ''} onChange={(e) => setLanguageForm({...languageForm, name: e.target.value})} placeholder="e.g. English" />
                  </div>
                  <div className="form-group">
                    <label className="modal-field-label">Proficiency</label>
                    <select className="tech-input" value={languageForm.proficiency || 'Professional Working'} onChange={(e) => setLanguageForm({...languageForm, proficiency: e.target.value as any})}>
                      <option value="Elementary">Elementary</option>
                      <option value="Limited Working">Limited Working</option>
                      <option value="Professional Working">Professional Working</option>
                      <option value="Full Professional">Full Professional</option>
                      <option value="Native">Native</option>
                    </select>
                  </div>
                </>
              )}

              {activeModal === 'projects' && (
                <>
                  <div className="form-group">
                    <label className="modal-field-label">Project name</label>
                    <input type="text" className="tech-input" value={projectForm.name || ''} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} placeholder="e.g. Project Nebula" />
                  </div>
                  <div className="form-group">
                    <label className="modal-field-label">Description</label>
                    <textarea className="tech-input" value={projectForm.description || ''} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} rows={3} placeholder="What did you build, and what was the impact?" />
                  </div>
                </>
              )}

              {activeModal === 'featured' && <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem' }}>This feature is coming soon.</p>}

              {activeModal === 'cancel' && (() => {
                const currentIndex = STATUS_TIERS.findIndex((t) => t.id === currentTier);
                const downgradeOptions = currentIndex > 1 ? STATUS_TIERS.slice(1, currentIndex) : [];
                return (
                  <div className="status-shop">
                    <p className="status-shop__intro">
                      We're sorry to see you go. You're currently on <strong>{currentTier}</strong>
                      {lockedBillingPeriod === 'ANNUAL'
                        ? ' — a one-time annual payment that already does not renew, so there is nothing to cancel.'
                        : '.'}
                    </p>
                    {downgradeOptions.length > 0 && (
                      <>
                        <p className="status-shop__intro" style={{ marginTop: 0 }}>Want to keep some perks instead of leaving entirely? Switch to a lower tier:</p>
                        <div className="status-shop__grid">
                          {downgradeOptions.map((tier) => (
                            <div key={tier.id} className={`status-tier-card ${tierCardClass(tier.id)}`}>
                              <h3>{tier.name}</h3>
                              <div className="status-tier-card__price">{tier.price}</div>
                              <button
                                className="btn-primary"
                                onClick={() => handlePurchaseTier(tier)}
                                disabled={!!isPurchasing}
                              >
                                {isPurchasing === tier.id ? 'Redirecting…' : `Switch to ${tier.name}`}
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {lockedBillingPeriod !== 'ANNUAL' && canDowngradeAt && (
                      <p className="status-tier-card__tagline" style={{ color: 'var(--color-muted)' }}>
                        You're still inside the 3-month minimum. Canceling now is accepted immediately and takes effect on {formatLockDate(canDowngradeAt)} — you'll keep your current status until then and won't be charged again after.
                      </p>
                    )}
                    <div className="modal-actions" style={{ marginTop: '16px' }}>
                      <button className="btn-secondary" onClick={closeModal}>Never mind, keep my status</button>
                      <button
                        className="btn-primary"
                        style={{ background: 'var(--color-danger, #a2504b)' }}
                        onClick={handleCancelMembership}
                        disabled={isCancelling}
                      >
                        {isCancelling ? 'Canceling…' : lockedBillingPeriod === 'ANNUAL' ? 'Confirm — nothing to cancel' : 'No thanks, cancel my subscription'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {activeModal !== 'cancel' && (
              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn-primary" onClick={() => {
                  if (activeModal === 'experience') handleAddExperience();
                  else if (activeModal === 'education') handleAddEducation();
                  else if (activeModal === 'skills') handleAddSkill();
                  else if (activeModal === 'certifications') handleAddCertification();
                  else if (activeModal === 'languages') handleAddLanguage();
                  else if (activeModal === 'projects') handleAddProject();
                  else closeModal();
                }}>{editingId ? 'Save Changes' : 'Save'}</button>
              </div>
              )}
              </div>
            </div>
          </div>
      )}
    </div>
  );
};
