import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { TokenStorage } from '@/utils/storage';
import { networkService } from '@/services/networkService';
import { feedService } from '@/services/feedService';
import { firmService } from '@/services/firmService';
import { FirmProfileData } from '@/types/firm';
import { mockProfileSections } from '@/data/mockProfileSections';
import { mockFirmProfiles } from '@/data/mockFirmProfiles';
import { IconUsers, IconCard } from '@/components/ui/Icons';
import { ProfileHeroCard } from '@/components/personal/ProfileHeroCard';
import { ProfileSidebar } from '@/components/personal/ProfileSidebar';
import {
  ProfileAnalytics,
  ProfileActivity,
  ProfileExperience,
  ProfileEducation,
  ProfileSkills,
  ProfileCertifications,
  ProfileProjects,
  ProfileLanguages,
  ProfileVolunteering,
  ProfileAwards,
  ProfileRecommendations,
  ProfileConnections,
  ProfileServices,
  ProfileExpertiseList,
  ProfileContactCard,
  ProfileFeaturedAchievement,
  ProfileRecentPosts,
  ProfilePortfolioGallery,
  ProfileCompaniesList,
  ProfileTimeline,
  ProfileSkillBars,
  ProfileTrustedConnections,
  ProfileRecognitions,
  getStoredSections,
  type DerivedCompany,
  type TimelineEntry,
  type DerivedRecognition,
} from '@/components/personal/ProfileSections';
import {
  FirmAbout,
  FirmServices,
  FirmTeam,
  FirmJobs,
  FirmLocations,
  FirmInsights,
  FirmStore,
  FirmNetwork,
  FirmPortfolio,
  FirmResources,
  FirmSubscriptions
} from '@/components/firm/FirmProfileSections';
import { Navbar } from '@/components/ui/Navbar';
import './ProfilePage.css';

interface Post {
  id: string;
  title?: string;
  content: string;
  timestamp: string;
  reactions?: {
    likes: number;
    comments: number;
  };
  mediaUrl?: string;
}

// Slugs of firms that only exist as hardcoded demo filler elsewhere in the
// app (e.g. FirmsPage's fallback suggestions), so they never appear in the
// `ornave_registered_firms` cache this page otherwise checks. Without this,
// they'd be misclassified as individual users by the generic keyword guess
// below and rendered with the wrong profile layout.
const KNOWN_DEMO_FIRM_SLUGS = new Set([
  'ecostream-solutions', 'novatech-robotics', 'global-logilink', 'azure-health',
  'solaris-energy', 'deepcode-ai', 'meridian-capital', 'artisan-bloom',
]);

function isKnownFirmSlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return KNOWN_DEMO_FIRM_SLUGS.has(s) || s.includes('corp') || s.includes('inc') || s.includes('systems') || s === 'abibas';
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionCount, setConnectionCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isViewingOther, setIsViewingOther] = useState(false);
  const [viewedUser, setViewedUser] = useState<any>(null);
  const [viewedSlugKey, setViewedSlugKey] = useState<string | undefined>(undefined);
  const [firmData, setFirmData] = useState<FirmProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState('NOT_CONNECTED');
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [mutualConnections, setMutualConnections] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  
  // Profile data state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const { user, logout, triggerAuthModal } = useAuth();

  useEffect(() => {
    const viewParam = searchParams.get('view');
    
    if (viewParam) {
      loadViewedUserProfile(viewParam);
    } else {
      setIsViewingOther(false);
      setViewedUser(null);
      setViewedSlugKey(undefined);
      setMutualConnections([]);
      if (user) {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setHeadline('');
        setBio('');
        setLocation('');
        setAvatarUrl('');
        setBannerUrl('');
      }
      if (!user) {
        navigate('/login');
        return;
      }

      loadProfile();
      loadNetworkStats();
      loadUserPosts();
      loadConnections();
      
      // Seed Chuck Hartwig data if current user is Hartwig. Sourced from the
      // single mockProfileSections['chuck-hartwig'] record (same data every
      // other profile draws from) plus two fields that only exist here.
      if (user?.lastName === 'Hartwig') {
        const mockSections = {
          ...mockProfileSections['chuck-hartwig'],
          projects: [
            {
              id: 'proj-1',
              name: 'Nexus Quantum Architecture',
              description: 'Next-generation supply chain engine utilizing quantum computing principles for route optimization.',
              url: 'https://nexusflow.sys/quantum',
              startDate: '2022-01',
              current: true
            }
          ],
          awards: [
            {
              id: 'award-1',
              title: 'Global CTO of the Year',
              issuer: 'World Technology Council',
              issueDate: '2023-11',
              description: 'Awarded for pioneering contributions to distributed system architectures.'
            }
          ]
        };
        localStorage.setItem('ornave_profile_sections', JSON.stringify(mockSections));

        // Also seed overrides for bio/headline
        localStorage.setItem('ornave_profile_overrides', JSON.stringify({
          headline: 'Chief Technology Officer | Enterprise Architect | AI Innovation Lead',
          location: 'Berlin, Germany',
          bio: 'Visionary technology leader with 20+ years of experience in architecting high-scale distributed systems and leading global engineering teams through digital transformation.',
          website: 'https://hartwig.tech',
          phone: '+49 (170) 987-6543'
        }));
      }
    }
  }, [user, navigate, searchParams]);

  // Force Hartwig data if name matches
  useEffect(() => {
    if (firstName?.toLowerCase() === 'chuck' || lastName?.toLowerCase() === 'hartwig') {
      if (!bio) {
        setBio('Visionary technology leader with 20+ years of experience in architecting high-scale distributed systems and leading global engineering teams through digital transformation.');
      }
      if (!headline) {
        setHeadline('Chief Technology Officer | Enterprise Architect | AI Innovation Lead');
      }
      if (!location) {
        setLocation('Berlin, Germany');
      }
      if (!website) {
        setWebsite('https://hartwig.tech');
      }
      if (!phone) {
        setPhone('+49 (170) 987-6543');
      }
    }
  }, [firstName, lastName, bio, headline, location, website, phone]);

  const loadUserPosts = async (targetUserId?: string) => {
    try {
      setIsLoadingPosts(true);
      const effectiveUserId = targetUserId || user?.id;
      if (!effectiveUserId) return;
      
      const response = await feedService.getUserPosts(effectiveUserId);
      setPosts(response.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        timestamp: item.timestamp,
        reactions: item.reactions,
        mediaUrl: item.mediaUrl,
      })));
    } catch (error) {
      console.error('Failed to load user posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const loadProfile = async () => {
    if (searchParams.get('view')) return; // Guard against overwriting during switch
    try {
      setIsViewingOther(false);
      setViewedUser(null);
      setIsLoading(true);
      const response = await apiClient.getProfile();
      const profileData = response.data;
      
      // Seed data for Hartwig if detected
      if (profileData.lastName?.toLowerCase() === 'hartwig' || profileData.firstName?.toLowerCase() === 'chuck') {
        const mockOverrides = {
          headline: 'Chief Technology Officer | Enterprise Architect | AI Innovation Lead',
          location: 'Berlin, Germany',
          bio: 'Visionary technology leader with 20+ years of experience in architecting high-scale distributed systems and leading global engineering teams through digital transformation.',
          website: 'https://hartwig.tech',
          phone: '+49 (170) 987-6543'
        };
        setHeadline(mockOverrides.headline);
        setLocation(mockOverrides.location);
        setWebsite(mockOverrides.website);
        setBio(mockOverrides.bio);
        setPhone(mockOverrides.phone);
        localStorage.setItem('ornave_profile_overrides', JSON.stringify(mockOverrides));
        
        // Ensure name is correct
        setFirstName('Chuck');
        setLastName('Hartwig');
        setAvatarUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop');
        setBannerUrl('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop');
      } else {
        setFirstName(profileData.firstName || '');
        setLastName(profileData.lastName || '');
        setPhone(profileData.profile?.phone || '');
        setHeadline(profileData.profile?.headline || '');
        setLocation(profileData.profile?.location || profileData.profile?.address || '');
        setWebsite(profileData.profile?.website || '');
        setBio(profileData.profile?.bio || '');
        setAvatarUrl(profileData.profile?.avatarUrl || '');
        setBannerUrl(profileData.profile?.bannerUrl || '');
      }

      const storedUser = TokenStorage.getUser();
      if (storedUser?.firstName) setFirstName(storedUser.firstName);
      if (storedUser?.lastName) setLastName(storedUser.lastName);

      try {
        const raw = localStorage.getItem('ornave_profile_overrides');
        if (raw) {
          const overrides = JSON.parse(raw);
          if (overrides.headline !== undefined) setHeadline(overrides.headline);
          if (overrides.location !== undefined) setLocation(overrides.location);
          if (overrides.website !== undefined) setWebsite(overrides.website);
          if (overrides.phone !== undefined) setPhone(overrides.phone);
          if (overrides.bio !== undefined) setBio(overrides.bio);
          if (overrides.about !== undefined) setBio(overrides.about); // fallback for old data
        }
      } catch {}

      // Load firm data if it's a company user to populate the "own profile" view correctly
      if (user?.userType === 'COMPANY_USER') {
        const companyData = TokenStorage.getCompany();
        if (companyData) {
          try {
            const fData = await firmService.getFirmProfile(companyData.id || companyData.slug);
            setFirmData(fData);
            setFirstName(fData.name);
            setLastName('');
            setBio(fData.bio);
            setHeadline(fData.firmType === 'SERVICE' ? 'Professional Services' : 'Product & Innovation');
            if (fData.locations && fData.locations.length > 0) {
              setLocation(fData.locations[0].city);
            }
          } catch (e) {
            console.error('Failed to load own firm profile', e);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleStateUpdate = () => {
      if (!isViewingOther) {
        loadNetworkStats();
        loadConnections();
      } else if (viewedUser?.type !== 'firm') {
        loadConnections(viewedUser?.id);
      }

      // If we are viewing someone, update relationship status
      if (isViewingOther && viewedUser) {
        if (viewedUser.type === 'firm') {
          firmService.isFollowing(viewedUser.id).then(val => setIsFollowing(val));
          firmService.isPartneredWithFirm(viewedUser.id).then(val => setPartnerStatus(val ? 'PARTNERED' : 'NOT_CONNECTED'));
        } else {
          applyConnectionStatus(viewedUser.id);
          networkService.getPartnerStatus(viewedUser.id).then(val => setPartnerStatus(val));
        }
      }
    };

    window.addEventListener('ornave_state_update', handleStateUpdate);
    return () => window.removeEventListener('ornave_state_update', handleStateUpdate);
  }, [isViewingOther, viewedUser]);

  const loadNetworkStats = async () => {
    if (isViewingOther) return;
    try {
      const stats = await networkService.getNetworkStats();
      // Adjust count based on local storage reality
      const storedConnections = await networkService.getRecentConnections();
      setConnectionCount(storedConnections.length > 2 ? storedConnections.length + 125 : storedConnections.length);
    } catch (err) {
      setConnectionCount(0);
    }
  };

  const loadConnections = async (targetUserId?: string) => {
    try {
      setIsLoadingConnections(true);

      if (targetUserId) {
        // Viewing someone else — show their real connections, not our own.
        const theirs = await networkService.getConnectionsOf(targetUserId);
        setConnections(theirs.map((c: any) => ({
          id: c.id,
          name: c.name || `${c.firstName} ${c.lastName}`,
          headline: c.headline,
          type: 'user',
          location: c.location,
          avatarUrl: c.profilePicture,
        })));
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 600));

      const storedConnections = await networkService.getRecentConnections();
      const storedFollows = await firmService.getFollowedFirms();
      
      const combined = [
        ...storedConnections.map(c => ({
          id: c.id,
          name: c.name || `${c.firstName} ${c.lastName}`,
          headline: c.headline,
          type: 'user',
          location: c.location,
          avatarUrl: `https://ui-avatars.com/api/?name=${(c.firstName || c.name || 'U')}+${(c.lastName || '')}&background=0D0D0D&color=fff`
        })),
        ...storedFollows.map(f => {
          const firmName = f.name || `${f.firstName || ''} ${f.lastName || ''}`.trim() || 'Unknown Firm';
          return {
            id: f.id,
            name: firmName,
            headline: f.headline,
            type: 'firm',
            location: f.location,
            avatarUrl: `https://ui-avatars.com/api/?name=${firmName.replace(/ /g, '+')}&background=050505&color=fff`
          };
        })
      ];
      
      // If we have very few, add some more "demo" data but prioritize real state
      if (combined.length === 0) {
        setConnections([
          { 
            id: 'omar-elferwany', 
            name: 'Omar Elferwany', 
            headline: 'Senior Software Engineer | System Architect', 
            type: 'user', 
            location: 'San Francisco, CA',
            avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
          },
          { 
            id: 'global-logistics-corp', 
            name: 'Global Logistics Corp', 
            headline: 'End-to-End Supply Chain Solutions', 
            type: 'firm', 
            location: 'New York, USA',
            avatarUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop'
          }
        ]);
      } else {
        setConnections(combined);
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const loadViewedUserProfile = (viewParam: string) => {
    setIsViewingOther(true);
    const decodedParam = decodeURIComponent(viewParam);
    const [fname, lname] = decodedParam.split('-').map(name => name.charAt(0).toUpperCase() + name.slice(1));
    
    const mockProfiles: { [key: string]: any } = {
      'omar-elferwany': {
        firstName: 'Omar',
        lastName: 'Elferwany',
        headline: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        bio: 'Building scalable systems and passionate about open-source software.',
        website: 'https://omar.dev',
        phone: '+1 (555) 123-4567',
        connectionCount: 324,
      },
      'chuck-hartwig': {
        firstName: 'Chuck',
        lastName: 'Hartwig',
        headline: 'Chief Technology Officer | Enterprise Architect | AI Innovation Lead',
        location: 'Berlin, Germany',
        bio: 'Visionary technology leader with 20+ years of experience in architecting high-scale distributed systems and leading global engineering teams through digital transformation.',
        website: 'https://hartwig.tech',
        phone: '+49 (170) 987-6543',
        connectionCount: 5842,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
        type: 'user',
        isPremium: true,
      },
      'mohamed-arafa': {
        firstName: 'Mohamed',
        lastName: 'Arafa',
        headline: 'Full Stack Developer',
        location: 'Cairo, Egypt',
        bio: 'Web developer with expertise in React and Node.js. Always learning and sharing knowledge.',
        website: 'https://mohamedara.dev',
        phone: '+20 (100) 123-4567',
        connectionCount: 289,
      },
      'andrea-garcía-barea': {
        firstName: 'Andrea',
        lastName: 'García Barea',
        headline: 'Product Manager',
        location: 'Barcelona, Spain',
        bio: 'Focused on building products that solve real problems. Data-driven and user-centric.',
        website: 'https://andreagarcia.com',
        phone: '+34 (600) 123-456',
        connectionCount: 456,
        type: 'user',
      },
      'global-logistics-corp': {
        firstName: 'Global',
        lastName: 'Logistics Corp',
        headline: 'Leading Global Supply Chain Solutions',
        location: 'New York, USA',
        bio: 'Providing end-to-end logistics solutions for businesses worldwide since 1995.',
        website: 'https://globallogistics.com',
        phone: '+1 (800) LOG-ISTIC',
        connectionCount: 52400,
        type: 'firm',
      },
      'emma-williams': {
        id: 'cmol9m45z00074qmsf3rzwta7',
        firstName: 'Emma',
        lastName: 'Williams',
        headline: 'Senior Supply Chain Director @ Global Logistics | Digital Transformation Expert',
        location: 'New York, USA',
        bio: 'Visionary leader in global logistics and supply chain optimization with 15+ years of experience. Focused on digital transformation and sustainable operations.',
        website: 'https://emmawilliams.io',
        phone: '+1 (212) 555-0198',
        connectionCount: 1240,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
        type: 'user',
        isPremium: true,
      },
      'abibas': {
        firstName: 'Abibas',
        lastName: 'Official',
        headline: 'Everything is possible with three stripes',
        location: 'Herzogenaurach, Germany',
        bio: 'Leading sports brand specializing in high-performance footwear and apparel. Since 1949, we have been pushing the boundaries of athletic innovation.',
        website: 'https://abibas-mock.com',
        phone: '+49 123 456789',
        connectionCount: 1500000,
        type: 'firm',
      },
      'bjorn-gulden': {
        firstName: 'Bjørn',
        lastName: 'Gulden',
        headline: 'CEO at Abibas',
        location: 'Herzogenaurach, Germany',
        bio: 'Leading the three stripes into a new era of growth and innovation.',
        connectionCount: 12400,
        type: 'user'
      },
      'harm-ohlmeyer': {
        firstName: 'Harm',
        lastName: 'Ohlmeyer',
        headline: 'CFO at Abibas',
        location: 'Herzogenaurach, Germany',
        bio: 'Driving financial excellence and strategic value creation.',
        connectionCount: 8900,
        type: 'user'
      },
      'michelle-robertson': {
        firstName: 'Michelle',
        lastName: 'Robertson',
        headline: 'CHRO at Abibas',
        location: 'Herzogenaurach, Germany',
        bio: 'Focusing on people, culture, and organizational transformation.',
        connectionCount: 5600,
        type: 'user'
      },
      'service-firm': {
        firstName: 'Service',
        lastName: 'Firm',
        headline: 'Premium Professional Services & Consulting',
        location: 'Global',
        bio: 'A premier service-based organization dedicated to providing high-quality professional services and consulting solutions across multiple industries.',
        website: 'https://servicefirm.com',
        phone: '+1 (800) SERVICE',
        connectionCount: 12500,
        type: 'firm',
      },
      'expert-portfolio': {
        firstName: 'Expert',
        lastName: 'Portfolio',
        headline: 'Proven Success in Enterprise Infrastructure',
        location: 'London, UK',
        bio: 'Specializing in large-scale infrastructure and digital transformation projects with a proven track record of excellence.',
        website: 'https://expert-portfolio.com',
        connectionCount: 8400,
        type: 'firm',
      },
      'resource-hub': {
        firstName: 'Knowledge',
        lastName: 'Hub',
        headline: 'Authoritative B2B Research & Resources',
        location: 'Amsterdam, Netherlands',
        bio: 'The leading authority in industry research, technical documentation, and B2B educational resources.',
        website: 'https://resource-hub.com',
        connectionCount: 15600,
        type: 'firm',
      },
      'subscription-pro': {
        firstName: 'Subscription',
        lastName: 'model',
        headline: 'Reliable Ongoing Maintenance & Support',
        location: 'Singapore',
        bio: 'Reliable ongoing support and maintenance through our industry-leading subscription and SLA packages.',
        website: 'https://subscription-pro.com',
        connectionCount: 4200,
        type: 'firm',
      }
    };
    
    const key = decodedParam.toLowerCase().trim();
    const slugKey = key.replace(/\s+/g, '-');
    
    // Check if it's a registered firm first
    const registeredFirms = JSON.parse(localStorage.getItem('ornave_registered_firms') || '[]');
    const registeredFirm = registeredFirms.find((f: any) => {
      const fId = (f.id || '').toLowerCase();
      const fSlug = (f.slug || '').toLowerCase();
      const fName = (f.name || '').toLowerCase();
      const fNameSlug = fName.replace(/\s+/g, '-');

      return fId === key || fId === slugKey || 
             fSlug === key || fSlug === slugKey || 
             fName === key || fNameSlug === slugKey;
    });

    const profile = (mockProfiles[key] ? { ...mockProfiles[key] } : null) || (registeredFirm ? {
      firstName: registeredFirm.name,
      lastName: '',
      headline: registeredFirm.headline || `${registeredFirm.industry || 'Professional'} Firm`,
      location: registeredFirm.location || 'Global',
      bio: registeredFirm.description || 'No description available.',
      website: '',
      phone: '',
      connectionCount: registeredFirm.connectionCount || 0,
      type: 'firm',
      id: registeredFirm.id
    } : {
      firstName: fname,
      lastName: lname,
      headline: 'Professional',
      location: 'Global',
      bio: 'Passionate professional with diverse interests and expertise.',
      website: '',
      phone: '',
      connectionCount: Math.floor(Math.random() * 500) + 100,
      type: isKnownFirmSlug(decodedParam.toLowerCase()) ? 'firm' : 'user',
    });

    if (!profile.type) {
      profile.type = isKnownFirmSlug(key) ? 'firm' : 'user';
    }
    
    if (!profile.id) profile.id = key;

    setViewedSlugKey(key);
    const savedProfiles = JSON.parse(localStorage.getItem('ornave_saved_profiles') || '[]');
    setIsSaved(savedProfiles.some((s: any) => s.key === key));
    setViewedUser(profile);
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setHeadline(profile.headline);
    setLocation(profile.location);
    setBio(profile.bio);
    setWebsite(profile.website);
    setPhone(profile.phone);
    setAvatarUrl(profile.avatarUrl || '');
    setBannerUrl(profile.bannerUrl || '');
    setConnectionCount(profile.connectionCount);

    // Check relationship status
    if (profile.type === 'firm') {
      firmService.isFollowing(profile.id).then(val => setIsFollowing(val));
      firmService.isPartneredWithFirm(profile.id).then(val => setPartnerStatus(val ? 'PARTNERED' : 'NOT_CONNECTED'));
    } else {
      applyConnectionStatus(profile.id);
      networkService.getPartnerStatus(profile.id).then(val => setPartnerStatus(val));

      // Most profile links are built from a "firstname-lastname" slug rather than a
      // real user id. If this slug actually belongs to a registered account, swap in
      // their real id and real profile data (headline/bio/location/avatar) so the
      // page shows the actual person instead of a generic placeholder.
      networkService.resolveUserBySlug(key).then((real) => {
        if (real && real.id && real.id !== profile.id) {
          setViewedUser((prev: any) => (prev ? { ...prev, id: real.id } : prev));
          if (real.headline) setHeadline(real.headline);
          if (real.bio) setBio(real.bio);
          if (real.location) setLocation(real.location);
          if (real.profilePicture) setAvatarUrl(real.profilePicture);
          if (real.bannerUrl) setBannerUrl(real.bannerUrl);
          if (real.website) setWebsite(real.website);
          setIsConnected(false);
          setIsPending(false);
          setPartnerStatus('NOT_CONNECTED');
          applyConnectionStatus(real.id);
          networkService.getPartnerStatus(real.id).then(val => setPartnerStatus(val));
          loadUserPosts(real.id);
          loadConnections(real.id);
          if (user && user.id !== real.id) {
            networkService.getMutualConnections(real.id).then(setMutualConnections);
          }
        }
      });
    }

    // Seed this person's resume-style sections (Experience/Education/Skills/...),
    // namespaced per-slug so browsing multiple profiles doesn't mix people up.
    if (mockProfileSections[key]) {
      localStorage.setItem(`ornave_profile_sections_${key}`, JSON.stringify(mockProfileSections[key]));
    }

    if (profile.id && profile.type !== 'firm') {
      loadUserPosts(profile.id);
    }

    if (profile.type === 'firm') {
      const firmIdToLoad = profile.id || decodedParam;
      firmService.getFirmProfile(firmIdToLoad).then(data => {
        setFirmData(data);
        setConnectionCount(data.followersCount);

        // Firms have no backend "user" to load posts for — use the mock
        // posts authored for this firm instead (see mockFirmProfiles.ts).
        setIsLoadingPosts(false);
        setPosts((data.posts || []).map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          timestamp: p.timestamp,
          reactions: p.reactions,
          mediaUrl: p.mediaUrl,
        })));

        // Sync state variables for hero card
        setFirstName(data.name);
        setLastName('');
        setBio(data.bio || 'No bio available.');
        const newHeadline = data.tagline || (data.firmType === 'SERVICE' ? 'Professional Services' : 'Product & Innovation');
        setHeadline(newHeadline);
        
        // Update viewedUser with final firm data
        setViewedUser({
          id: data.id,
          firstName: data.name,
          lastName: '',
          bio: data.bio,
          headline: newHeadline,
          type: 'firm',
          isPremium: data.followersCount > 10000,
          location: data.locations && data.locations.length > 0 ? data.locations[0].city : 'Global'
        });
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /** Fetch the real connection status for a person and reflect it (connected vs. still pending). */
  const applyConnectionStatus = (otherUserId: string) => {
    networkService.getConnectionStatus(otherUserId).then((status) => {
      setIsConnected(status === 'CONNECTED');
      setIsPending(status === 'PENDING_SENT');
    });
  };

  const handleFollow = async () => {
    if (!user) {
      triggerAuthModal('Please log in to connect or follow.');
      return;
    }
    
    const isFirm = viewedUser?.type === 'firm';
    if (isFirm) {
      const success = isFollowing 
        ? await firmService.unfollowFirm(viewedUser.id)
        : await firmService.followFirm(viewedUser);
      
      if (success) {
        setIsFollowing(!isFollowing);
      }
    } else {
      // Logic for personal connection
      if (isConnected) {
        await networkService.removeConnection(viewedUser.id);
        setIsConnected(false);
        setPartnerStatus('NOT_CONNECTED');
      } else if (isPending) {
        // Cancel our outgoing request
        await networkService.removeConnection(viewedUser.id);
        setIsPending(false);
      } else {
        await networkService.addConnection(viewedUser);
        // The request may auto-accept (if the other side already requested us)
        // or stay pending — reflect the real status rather than assuming.
        const status = await networkService.getConnectionStatus(viewedUser.id);
        setIsConnected(status === 'CONNECTED');
        setIsPending(status === 'PENDING_SENT');
      }
    }
  };

  const handlePartner = async () => {
    if (!user) {
      triggerAuthModal('Please log in to partner with others.');
      return;
    }

    const isFirm = viewedUser?.type === 'firm';
    if (isFirm) {
      if (partnerStatus === 'PARTNERED') {
        await firmService.unpartnerFirm(viewedUser.id);
        setPartnerStatus('NOT_CONNECTED');
      } else {
        const success = await firmService.partnerFirm(viewedUser);
        if (success) setPartnerStatus('PARTNERED');
      }
    } else {
      if (partnerStatus === 'PARTNERED' || partnerStatus === 'PENDING_SENT') {
        await networkService.removePartnership(viewedUser.id);
        setPartnerStatus('NONE');
      } else if (partnerStatus === 'PENDING_RECEIVED') {
        navigate('/network');
      } else {
        await networkService.requestPartnership(viewedUser.id);
        setPartnerStatus('PENDING_SENT');
      }
    }
  };

  const handleToggleSave = () => {
    if (!user) {
      triggerAuthModal('Please log in to save profiles.');
      return;
    }
    if (!viewedUser?.id) return;
    const saved = JSON.parse(localStorage.getItem('ornave_saved_profiles') || '[]');
    const key = viewedSlugKey || viewedUser.id;
    const idx = saved.findIndex((s: any) => s.key === key);
    if (idx >= 0) {
      saved.splice(idx, 1);
      setIsSaved(false);
    } else {
      saved.push({
        key,
        id: viewedUser.id,
        name: `${firstName} ${lastName}`.trim(),
        headline,
        avatarUrl,
        savedAt: new Date().toISOString(),
      });
      setIsSaved(true);
    }
    localStorage.setItem('ornave_saved_profiles', JSON.stringify(saved));
  };

  const handleShareProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard permissions can be denied — fail silently, nothing to recover.
    }
  };

  const handleMessage = () => {
    if (!user) {
      triggerAuthModal('Please log in to message other professionals.');
      return;
    }
    navigate(`/messages?to=${isViewingOther ? viewedUser?.id : user?.id}`);
  };

  if (isLoading && !isViewingOther) {
    return (
      <div className="profile-page profile-page--editorial">
        <Navbar sidebarOffset />
        <div className="profile-page__container">
          <div className="loading-state">Loading profile...</div>
        </div>
      </div>
    );
  }

  const profileType = isViewingOther
    ? viewedUser?.type
    : (user?.userType === 'COMPANY_USER' ? 'firm' : 'user');

  // Which mockProfileSections record (if any) backs this profile's editorial
  // content (highlights, focus tags, portfolio, derived stats). Distinct from
  // `viewedSlugKey`/`sectionsKey`, which control which localStorage namespace
  // the resume-style sections (Experience, Skills, ...) read from — those stay
  // untouched here to avoid breaking the owner's own edited data.
  const ownMockKey = (!isViewingOther && (user?.lastName?.toLowerCase() === 'hartwig' || user?.firstName?.toLowerCase() === 'chuck'))
    ? 'chuck-hartwig'
    : undefined;
  const effectiveMockKey = viewedSlugKey || ownMockKey;
  const mockData = effectiveMockKey ? mockProfileSections[effectiveMockKey] : undefined;

  // Every profile gets the same editorial Overview layout — for the handful of
  // demo personas that comes from mockProfileSections, for everyone else it's
  // built from the same real Experience/Education/Skills/Certifications data
  // the resume-style sections below already read from localStorage. Portfolio
  // and recommendations have no real data-entry path yet, so those stay
  // mock-only and simply render their empty state for real accounts.
  const realSections = getStoredSections(viewedSlugKey);
  const sourceExperiences = mockData?.experiences || realSections.experiences || [];
  const sourceEducations = mockData?.educations || realSections.educations || [];
  const sourceSkills = mockData?.skills || realSections.skills || [];
  const sourceCertifications = mockData?.certifications || realSections.certifications || [];
  const sourcePortfolio = mockData?.portfolio || [];
  const sourceRecommendations = mockData?.recommendations || [];

  const earliestSourceYear = (() => {
    const years: number[] = [];
    [...sourceExperiences, ...sourceEducations].forEach((e: any) => {
      if (e.startDate) years.push(parseInt(e.startDate.slice(0, 4), 10));
    });
    return years.length ? Math.min(...years) : undefined;
  })();

  const heroStats = [
    { label: 'Companies Founded', value: new Set(sourceExperiences.map((e: any) => e.company)).size },
    { label: 'Projects Completed', value: sourcePortfolio.length },
    { label: 'Years in Business', value: earliestSourceYear ? new Date().getFullYear() - earliestSourceYear : '—' },
    { label: 'Connections', value: connectionCount },
    { label: 'Recommendations', value: sourceRecommendations.length },
    { label: 'Verified Achievements', value: sourceCertifications.length },
  ];

  // Firms get their own set of stats — team/hiring/output metrics instead of
  // an individual's career stats, which don't mean anything for a company.
  const firmHeroStats = firmData ? [
    { label: 'Founded', value: firmData.foundedYear || '—' },
    { label: 'Employees', value: firmData.employeeCount || '—' },
    { label: 'Years in Business', value: firmData.foundedYear ? new Date().getFullYear() - firmData.foundedYear : '—' },
    { label: 'Followers', value: firmData.followersCount || 0 },
    { label: 'Case Studies', value: firmData.portfolio?.length || 0 },
    { label: 'Open Roles', value: firmData.jobs?.length || 0 },
  ] : undefined;

  // The "Companies" tab means something different for a firm than a person —
  // not places they've worked, but firms they partner with on the platform.
  const firmPartnerCompanies: DerivedCompany[] = (firmData?.partnerSlugs || [])
    .map((slug) => mockFirmProfiles[slug])
    .filter(Boolean)
    .map((partner) => ({
      name: partner.name,
      role: partner.tagline || 'Trusted Partner',
      years: 'Trusted Partner',
    }));

  const memberNumberSourceKey = effectiveMockKey || viewedSlugKey || (isViewingOther ? viewedUser?.id : user?.id);
  const memberNumber = memberNumberSourceKey
    ? String(Math.abs(Array.from(memberNumberSourceKey).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 1000000, 7)) + 100000).slice(0, 6)
    : undefined;

  const defaultEditorialBanner = 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1600&h=500&fit=crop';

  const yearOf = (d?: string) => (d ? d.slice(0, 4) : '');

  const dossierCompanies: DerivedCompany[] = (() => {
    const seen = new Set<string>();
    const result: DerivedCompany[] = [];
    sourceExperiences.forEach((e: any) => {
      if (seen.has(e.company)) return;
      seen.add(e.company);
      result.push({
        name: e.company,
        role: e.title,
        years: `${yearOf(e.startDate)} – ${e.current ? 'Present' : yearOf(e.endDate)}`,
      });
    });
    return result;
  })();

  const dossierTimeline: TimelineEntry[] = (() => {
    const work = sourceExperiences.map((e: any) => ({
      id: e.id,
      period: `${yearOf(e.startDate)} – ${e.current ? 'Present' : yearOf(e.endDate)}`,
      title: e.title,
      org: e.company,
      sortKey: e.startDate || '',
    }));
    const edu = sourceEducations.map((e: any) => ({
      id: e.id,
      period: `${yearOf(e.startDate)} – ${e.current ? 'Present' : yearOf(e.endDate)}`,
      title: e.degree,
      org: e.school,
      sortKey: e.startDate || '',
    }));
    return [...work, ...edu].sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
  })();

  const dossierExpertise = sourceSkills.map((s: any) => s.name);

  const dossierCurrentRole = sourceExperiences.find((e: any) => e.current) || sourceExperiences[0];

  const dossierFeaturedSlides = sourcePortfolio.map((p) => ({
    image: p.image,
    title: p.title,
    role: dossierCurrentRole?.title,
  }));

  const dossierRecognitions: DerivedRecognition[] = sourceCertifications.map((c: any) => ({
    id: c.id,
    label: c.name,
    sublabel: [c.organization, c.issueDate ? yearOf(c.issueDate) : undefined].filter(Boolean).join(' · '),
  }));

  const dossierEmail = website
    ? `${firstName || 'contact'}@${website.replace(/^https?:\/\//, '').replace(/^www\./, '')}`.toLowerCase()
    : undefined;

  const handleDownloadVCard = () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName || ''};${firstName || ''};;;`,
      `FN:${`${firstName} ${lastName}`.trim()}`,
      headline ? `TITLE:${headline}` : '',
      dossierCurrentRole?.company ? `ORG:${dossierCurrentRole.company}` : '',
      phone ? `TEL:${phone}` : '',
      dossierEmail ? `EMAIL:${dossierEmail}` : '',
      website ? `URL:${website}` : '',
      'END:VCARD',
    ].filter(Boolean).join('\n');
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${firstName || 'contact'}-${lastName || ''}.vcf`.replace(/\s+/g, '-');
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar sidebarOffset />
      <div className="profile-page profile-page--editorial">
        <div className="profile-page__shell">
          <ProfileSidebar memberNumber={memberNumber} memberTier={effectiveMockKey === 'chuck-hartwig' ? 'Founding Member' : 'Gold Member'} />
          <div className="profile-page__wrapper">
          {/* Top Hero Section */}
          <div className="profile-page__hero-section">
            {(user || isViewingOther) && (
              <ProfileHeroCard
                user={isViewingOther ? viewedUser : { ...user, firstName, lastName }}
                connectionCount={connectionCount}
                headline={headline}
                avatarUrl={avatarUrl}
                bannerUrl={bannerUrl || defaultEditorialBanner}
                location={location}
                phone={phone}
                website={website}
                bio={bio}
                isViewingOther={isViewingOther}
                isPremium={isViewingOther ? viewedUser?.isPremium : false}
                type={profileType}
                githubUrl={isViewingOther ? `https://github.com/${firstName?.toLowerCase() || ''}` : "https://github.com/emmawilliams"}
                twitterUrl={isViewingOther ? `https://twitter.com/${firstName?.toLowerCase() || ''}` : "https://twitter.com/emma_supplychain"}
                focusAreas={mockData?.focusAreas}
                editorial
                verified={!!mockData}
                stats={profileType === 'firm' ? firmHeroStats : heroStats}
                memberSince={earliestSourceYear ? String(earliestSourceYear) : undefined}
                memberNumber={memberNumber}
                memberTier={effectiveMockKey === 'chuck-hartwig' ? 'Founding Member' : 'Gold Member'}
                company={dossierCurrentRole?.company}
              />
            )}
          </div>

          {/* Primary action row — Follow/Connect, Message, Save, Share (or
             Edit Profile/Log Out on your own profile) — sits right under the
             hero so it doesn't require scrolling past every tab to reach. */}
          {!isViewingOther ? (
            <div className="dossier-actions-bar account-card">
              <div className="account-stats">
                <div className="account-stat">
                  <span className="account-stat-label">Connections</span>
                  <span className="account-stat-value">{connectionCount}</span>
                </div>
                <div className="account-stat">
                  <span className="account-stat-label">Profile Views</span>
                  <span className="account-stat-value">1,248</span>
                </div>
              </div>
              <div className="account-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate('/profile/edit')}
                >
                  Edit Profile
                </button>
                <button className="btn-outline-danger" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <div className="dossier-actions-bar connect-card">
              <div className="connect-actions">
                <button
                  className={isFollowing || isConnected || isPending ? "btn-secondary" : "btn-primary"}
                  onClick={handleFollow}
                >
                  {viewedUser?.type === 'firm'
                    ? (isFollowing ? 'Following' : '+ Follow')
                    : (isConnected ? 'Connected' : (isPending ? 'Pending' : '+ Connect'))}
                </button>
                <button
                  className="btn-outline-primary"
                  onClick={handleMessage}
                >
                  Message
                </button>
                <button
                  className={`btn-icon-square ${isSaved ? 'btn-icon-square--active' : ''}`}
                  onClick={handleToggleSave}
                  title={isSaved ? 'Remove from saved' : 'Save profile'}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4">
                    <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.5l-4.5-3-4.5 3V3a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  className="btn-icon-square"
                  onClick={handleShareProfile}
                  title="Copy profile link"
                >
                  {shareCopied ? (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <circle cx="12.5" cy="3.5" r="1.8"/>
                      <circle cx="3.5" cy="8" r="1.8"/>
                      <circle cx="12.5" cy="12.5" r="1.8"/>
                      <path d="M5.1 7.1 11 4.3M5.1 8.9 11 11.7"/>
                    </svg>
                  )}
                </button>
              </div>

              {mutualConnections.length > 0 && (
                <div className="mutual-connections">
                  <div className="mutual-connections__avatars">
                    {mutualConnections.slice(0, 4).map((m, i) => (
                      <div key={m.id || i} className="mutual-connections__avatar" style={{ zIndex: 4 - i }}>
                        {m.profilePicture ? (
                          <img src={m.profilePicture} alt={m.firstName} />
                        ) : (
                          `${m.firstName?.[0] || ''}${m.lastName?.[0] || ''}`
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="mutual-connections__label">
                    {mutualConnections.length} mutual connection{mutualConnections.length === 1 ? '' : 's'}
                  </span>
                </div>
              )}
              {(viewedUser?.type === 'firm' ? isFollowing : isConnected) && (
                <button
                  className={`btn-partner ${partnerStatus === 'PARTNERED' ? 'btn-partner--active' : ''}`}
                  onClick={handlePartner}
                  title={
                    partnerStatus === 'PARTNERED'
                      ? 'End partnership'
                      : partnerStatus === 'PENDING_SENT'
                      ? 'Cancel partnership request'
                      : partnerStatus === 'PENDING_RECEIVED'
                      ? 'Respond in your Network'
                      : 'Propose a deeper, partnered relationship'
                  }
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1.3 9.8 5l4.1.6-3 2.9.7 4.1L8 10.7 4.4 12.6l.7-4.1-3-2.9L6.2 5 8 1.3Z"/>
                  </svg>
                  {partnerStatus === 'PARTNERED'
                    ? 'Partnered'
                    : partnerStatus === 'PENDING_SENT'
                    ? 'Partnership Requested'
                    : partnerStatus === 'PENDING_RECEIVED'
                    ? 'Wants to Partner — Respond'
                    : 'Propose Partnership'}
                </button>
              )}
            </div>
          )}

          <nav className="dossier-tabs">
            <div className="dossier-tabs__list">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'experience', label: 'Timeline' },
                { key: 'portfolio', label: 'Portfolio' },
                { key: 'companies', label: 'Companies' },
                { key: 'connections', label: 'Network' },
                { key: 'recognitions', label: 'Recognitions' },
                { key: 'activity', label: 'Publications' },
                ...(profileType === 'firm' ? [
                  { key: 'services', label: 'Services' },
                  { key: 'firm', label: 'Firm Details' },
                ] : []),
              ].map((t) => (
                <button
                  key={t.key}
                  className={`dossier-tabs__tab ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
              {!isViewingOther && (
                <button className="dossier-tabs__tab" onClick={() => navigate('/profile/edit')}>
                  Settings
                </button>
              )}
            </div>
            {!isViewingOther && (
              <button className="dossier-tabs__edit-btn" onClick={() => navigate('/profile/edit?tab=info')}>
                Edit Profile
              </button>
            )}
          </nav>

          <div className="profile-page__content-grid">
            {/* Left Content Area */}
            <main className="profile-page__main-col">
              <div className="profile-tab-content">
                {(user || isViewingOther) && (
                  <>
                    {activeTab === 'overview' && (
                      <>
                          <div className="tab-pane fade-in dossier-grid">
                            <div className="dossier-grid__col dossier-grid__col--left">
                              <div className="dossier-card">
                                <h4 className="dossier-card__title">About</h4>
                                <p className="bio-text">{bio || "No bio available."}</p>
                                <span className="dossier-card__link" onClick={() => setActiveTab('experience')}>View full profile ›</span>
                              </div>
                              <ProfileExpertiseList items={dossierExpertise} />
                              <ProfileContactCard
                                email={dossierEmail}
                                website={website}
                                phone={!isViewingOther ? phone : undefined}
                                onScheduleMeeting={isViewingOther ? handleMessage : undefined}
                                onDownloadVCard={!isViewingOther ? handleDownloadVCard : undefined}
                              />
                              <ProfileTrustedConnections connections={connections.filter(c => c.type === 'user')} />
                            </div>

                            <div className="dossier-grid__posts">
                              <ProfileRecentPosts
                                posts={posts}
                                authorId={isViewingOther ? viewedUser?.id : user?.id}
                                authorFirstName={firstName}
                                authorLastName={lastName}
                                authorAvatar={avatarUrl}
                                authorHeadline={headline}
                              />
                            </div>
                            <div className="dossier-grid__featured">
                              <ProfileFeaturedAchievement
                                slides={dossierFeaturedSlides}
                                onView={() => setActiveTab('experience')}
                              />
                            </div>
                            <div className="dossier-grid__portfolio">
                              <ProfilePortfolioGallery items={mockData?.portfolio} />
                            </div>

                            <div className="dossier-grid__col dossier-grid__col--right">
                              <ProfileTimeline entries={dossierTimeline} />
                              <ProfileCompaniesList companies={dossierCompanies} />
                              <ProfileRecommendations sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                              <ProfileRecognitions items={dossierRecognitions} />
                            </div>

                            <div className="dossier-grid__bottom-row dossier-grid__bottom-row--single">
                              <ProfileSkillBars skills={mockData?.skills} />
                            </div>

                            {!isViewingOther && (
                              <div className="dossier-grid__services profile-card stats-mini" onClick={() => navigate('/purchased-services')} style={{ cursor: 'pointer' }}>
                                <h4 className="section-title"><span className="profile-section__title-icon"><IconCard size={16} /></span>Connected Services</h4>
                                <div className="connected-firms-preview" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                  {connections.filter(c => c.type === 'firm').slice(0, 4).map(firm => (
                                    <div
                                      key={firm.id}
                                      className="firm-preview-row"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/purchased-services/${firm.id}`);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        padding: '12px',
                                        background: 'rgba(246, 243, 237, 0.03)',
                                        border: '1px solid var(--tech-border-dim)',
                                        borderRadius: '12px',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'var(--color-bg)',
                                        border: '1px solid var(--tech-border-dark)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        color: 'var(--tech-accent-gold)',
                                        fontWeight: 700,
                                        fontSize: '0.75rem'
                                      }}>
                                        {firm.avatarUrl ? (
                                          <img src={firm.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (firm.name || '?').slice(0, 2).toUpperCase()}
                                      </div>
                                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                                        <div style={{ color: 'var(--color-text)', fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {firm.name}
                                        </div>
                                        <div style={{ color: 'var(--tech-text-dim)', fontSize: '0.75rem' }}>
                                          {firm.headline || 'Connected company'}
                                        </div>
                                      </div>
                                      <div className="tech-tag">Active</div>
                                    </div>
                                  ))}
                                  {connections.filter(c => c.type === 'firm').length === 0 && (
                                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--tech-text-dim)', fontSize: '0.85rem', border: '1px dashed var(--tech-border-dim)', borderRadius: '12px' }}>
                                      No connected companies yet.
                                    </div>
                                  )}
                                </div>
                                <div className="mini-stats-row" style={{ borderTop: '1px solid var(--tech-border-dim)', paddingTop: '15px' }}>
                                  <div className="mini-stat">
                                    <span className="mini-stat-val">{connections.filter(c => c.type === 'firm').length}</span>
                                    <span className="mini-stat-lab">Companies</span>
                                  </div>
                                  <div className="mini-stat">
                                    <span className="mini-stat-val">B2B</span>
                                    <span className="mini-stat-lab">Relationship Type</span>
                                  </div>
                                </div>
                                <button
                                  className="profile-section__footer-btn"
                                  style={{ marginTop: '15px', width: '100%', textAlign: 'left' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/purchased-services');
                                  }}
                                >
                                  Manage Services →
                                </button>
                              </div>
                            )}
                          </div>
                      </>
                    )}

                    {activeTab === 'activity' && (
                      <div className="tab-pane fade-in">
                        <ProfileActivity
                          posts={posts}
                          isLoading={isLoadingPosts}
                          isViewingOther={isViewingOther}
                          authorId={isViewingOther ? viewedUser?.id : user?.id}
                          authorFirstName={firstName}
                          authorLastName={lastName}
                          authorAvatar={avatarUrl}
                          authorHeadline={headline}
                        />
                      </div>
                    )}

                    {activeTab === 'experience' && (
                      <div className="tab-pane fade-in">
                        {profileType === 'firm' ? (
                          (firmData?.milestones && firmData.milestones.length > 0) ? (
                            <ProfileTimeline entries={firmData.milestones} title="Company Milestones" />
                          ) : (
                            <div className="dossier-empty-state"><p>No milestones added yet.</p></div>
                          )
                        ) : (
                          <>
                            <ProfileExperience sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                            <ProfileEducation sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                            <ProfileCertifications sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                            <ProfileLanguages sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === 'skills' && (
                      <div className="tab-pane fade-in">
                        <ProfileSkills sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                        <ProfileProjects sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                        <ProfileAwards sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                        <ProfileVolunteering sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                      </div>
                    )}

                    {activeTab === 'connections' && (
                      <div className="tab-pane fade-in">
                        {profileType === 'firm' ? (
                          (firmData?.team && firmData.team.length > 0) ? (
                            <FirmNetwork team={firmData.team} firmName={firmData.name} />
                          ) : (
                            <div className="dossier-empty-state"><p>No team members added yet.</p></div>
                          )
                        ) : (
                          <ProfileConnections
                            connections={connections}
                            isLoading={isLoadingConnections}
                            isViewingOther={isViewingOther}
                          />
                        )}
                      </div>
                    )}

                    {activeTab === 'portfolio' && (
                      <div className="tab-pane fade-in">
                        {profileType === 'firm' ? (
                          (firmData?.portfolio && firmData.portfolio.length > 0) ? (
                            <FirmPortfolio portfolio={firmData.portfolio} />
                          ) : (
                            <div className="dossier-empty-state"><p>No case studies added yet.</p></div>
                          )
                        ) : (
                          <ProfilePortfolioGallery items={mockData?.portfolio} />
                        )}
                      </div>
                    )}

                    {activeTab === 'companies' && (
                      <div className="tab-pane fade-in">
                        {profileType === 'firm' ? (
                          firmPartnerCompanies.length > 0 ? (
                            <ProfileCompaniesList companies={firmPartnerCompanies} />
                          ) : (
                            <div className="dossier-empty-state"><p>No partner companies added yet.</p></div>
                          )
                        ) : (
                          <ProfileCompaniesList companies={dossierCompanies} />
                        )}
                      </div>
                    )}

                    {activeTab === 'recognitions' && (
                      <div className="tab-pane fade-in">
                        {profileType === 'firm' ? (
                          <ProfileRecognitions items={firmData?.recognitions || []} />
                        ) : (
                          <>
                            <ProfileRecognitions items={dossierRecognitions} />
                            <ProfileAwards sectionsKey={viewedSlugKey} isViewingOther={isViewingOther} />
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === 'services' && (
                      <div className="tab-pane fade-in">
                        {profileType === 'firm' ? (
                          (firmData?.services && firmData.services.length > 0) ? (
                            <FirmServices services={firmData.services} isProminent />
                          ) : (
                            <div className="dossier-empty-state"><p>No services added yet.</p></div>
                          )
                        ) : (
                          <ProfileServices
                            companyId={isViewingOther ? (viewedUser?.id || '') : (user?.companyId || '')}
                            isOwner={!isViewingOther}
                          />
                        )}
                      </div>
                    )}

                    {activeTab === 'firm' && (
                      <div className="tab-pane fade-in">
                        <FirmAbout bio={firmData?.bio || ''} />
                        <FirmNetwork team={firmData?.team || []} firmName={firmData?.name || ''} />
                        
                        <div className="bento-grid" style={{ marginTop: '20px' }}>
                          {firmData?.firmType === 'SERVICE' ? (
                            <div style={{ gridColumn: 'span 12' }}>
                              <FirmServices services={firmData?.services || []} isProminent={true} />
                            </div>
                          ) : (
                            <div style={{ gridColumn: 'span 12' }}>
                              <FirmStore companyId={firmData?.id || ''} />
                            </div>
                          )}
                        </div>

                        {firmData?.insights && <FirmInsights insights={firmData.insights} />}
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
                          <FirmTeam team={firmData?.team || []} />
                          <FirmLocations locations={firmData?.locations || []} />
                        </div>

                        {firmData?.portfolio && <FirmPortfolio portfolio={firmData.portfolio} />}
                        {firmData?.resources && <FirmResources resources={firmData.resources} />}
                        {firmData?.subscriptions && <FirmSubscriptions subscriptions={firmData.subscriptions} />}
                        
                        <FirmJobs jobs={firmData?.jobs || []} />
                        {firmData?.firmType !== 'SERVICE' && <FirmServices services={firmData?.services || []} />}
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>

            {/* Right Sidebar */}
            <aside className="profile-page__sidebar-col">
              <div className="sticky-sidebar">
                {/* Suggestions Section */}
                <div className="profile-card suggestions-card">
                  <h4 className="sidebar-title">Suggested for you</h4>
                  <div className="suggestions-list">
                    {[
                      { id: 'sarah-wilson', name: 'Sarah Wilson', role: 'CTO at DataFlow', icon: '👤' },
                      { id: 'james-chen', name: 'James Chen', role: 'Supply Chain Manager', icon: '👤' }
                    ].map((person, i) => (
                      <div key={i} className="suggestion-item">
                        <div 
                          className="suggestion-avatar"
                          onClick={() => navigate(`/profile?view=${person.id}`)}
                        >
                          {person.icon}
                        </div>
                        <div className="suggestion-info">
                          <span className="suggestion-name" onClick={() => navigate(`/profile?view=${person.id}`)}>{person.name}</span>
                          <span className="suggestion-role">{person.role}</span>
                          <button className="btn-sm-outline">Connect</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* News Section */}
                <div className="profile-card news-sidebar-card">
                  <h4 className="sidebar-title">Ornave News</h4>
                  <div className="news-mini-list">
                    {[
                      { title: 'Global trade routes', time: '2h ago' },
                      { title: 'Future of B2B', time: '5h ago' }
                    ].map((news, i) => (
                      <div key={i} className="news-mini-item">
                        <span className="news-mini-dot">•</span>
                        <div className="news-mini-content">
                          <span className="news-mini-title">{news.title}</span>
                          <span className="news-mini-time">{news.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};
