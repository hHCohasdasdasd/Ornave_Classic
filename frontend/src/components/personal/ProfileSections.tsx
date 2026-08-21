import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeService, Product } from '@/services/storeService';
import { useAuth } from '@/context/AuthContext';
import {
  IconBriefcase, IconGraduationCap, IconTrophy, IconHandshake, IconGlobe,
  IconLink, IconSpark, IconChart, IconUsers, IconLaurel, IconCard, IconBuilding,
} from '@/components/ui/Icons';
import { IconMail, IconPhone, IconVerified } from '@/components/ui/Icons';
import { FeedItem } from './FeedItem';
import type { FeedItem as FeedItemData } from '@/types/feed';

interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

interface Skill {
  id: string;
  name: string;
  level?: string;
  endorsements?: number;
}

interface Certification {
  id: string;
  name: string;
  organization: string;
  issueDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

interface Language {
  id: string;
  name: string;
  proficiency?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  imageUrl?: string;
}

interface Volunteering {
  id: string;
  role: string;
  organization: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

interface Award {
  id: string;
  title: string;
  issuer: string;
  issueDate?: string;
  description?: string;
}

interface Recommendation {
  id: string;
  author: string;
  authorHeadline: string;
  authorAvatar?: string;
  content: string;
  date: string;
}

export interface ProfileHighlight {
  value: string;
  label: string;
}

export interface ProfilePortfolioItem {
  id: string;
  image: string;
  title: string;
  location?: string;
  year?: string;
}

export interface ProfileSkillEntry {
  id: string;
  name: string;
  level?: string;
}

// Highlights strip — punchy, scannable facts up top instead of forcing
// visitors to read the whole page to find out why this person matters.
export const ProfileHighlights: React.FC<{ highlights?: ProfileHighlight[] }> = ({ highlights }) => {
  if (!highlights || highlights.length === 0) return null;

  return (
    <section className="profile-highlights">
      {highlights.map((h, i) => (
        <div key={i} className="profile-highlights__item">
          <span className="profile-highlights__value">{h.value}</span>
          <span className="profile-highlights__label">{h.label}</span>
        </div>
      ))}
    </section>
  );
};

// Analytics Section
export const ProfileAnalytics: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="profile-section profile-section--analytics">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconChart size={17} /></span>Analytics</h2>
        <button className="profile-section__icon-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12 8C12 10.2091 10.2091 12 8 12C5.79086 12 4 10.2091 4 8C4 5.79086 5.79086 4 8 4C10.2091 4 12 5.79086 12 8Z"/>
          </svg>
        </button>
      </div>
      <p className="profile-section__subtitle">Private to you</p>
      
      <div className="profile-analytics">
        <div className="profile-analytics__item" onClick={() => navigate('/network')} style={{ cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" opacity="0.6">
            <path d="M10 4C6.13 4 3 7.13 3 11C3 14.87 6.13 18 10 18C13.87 18 17 14.87 17 11C17 7.13 13.87 4 10 4ZM10 16C7.24 16 5 13.76 5 11C5 8.24 7.24 6 10 6C12.76 6 15 8.24 15 11C15 13.76 12.76 16 10 16Z"/>
            <circle cx="10" cy="11" r="2"/>
          </svg>
          <div>
            <strong>198 profile views</strong>
            <p>Discover who's viewed your profile.</p>
          </div>
        </div>
        
        <div className="profile-analytics__item" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" opacity="0.6">
            <path d="M8 6H6V14H8V6ZM10 6V14H12V6H10ZM14 6V14H16V6H14Z"/>
          </svg>
          <div>
            <strong>89 post impressions</strong>
            <p>Check out who's engaging with your posts.</p>
          </div>
        </div>
        
        <div className="profile-analytics__item">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" opacity="0.6">
            <path d="M14 10C14 12.2091 12.2091 14 10 14C7.79086 14 6 12.2091 6 10C6 7.79086 7.79086 6 10 6C12.2091 6 14 7.79086 14 10Z"/>
            <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <div>
            <strong>53 search appearances</strong>
            <p>See how often you appear in search results.</p>
          </div>
        </div>
      </div>
      
      <button className="profile-section__footer-btn" onClick={() => navigate('/dashboard')}>Show all analytics →</button>
    </section>
  );
};

// Activity Section

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

interface PostAuthorProps {
  authorId?: string;
  authorFirstName?: string;
  authorLastName?: string;
  authorAvatar?: string;
  authorHeadline?: string;
}

// Profile pages only store the owner's posts (no per-post author payload,
// since the author is always whoever's profile this is) — this rebuilds the
// shape FeedItem expects so the same post card renders identically here and
// in the main feed.
function toFeedItemData(post: Post, author: PostAuthorProps): FeedItemData {
  return {
    id: post.id,
    type: 'post',
    author: {
      id: author.authorId || post.id,
      firstName: author.authorFirstName || 'Member',
      lastName: author.authorLastName || '',
      profilePicture: author.authorAvatar,
      headline: author.authorHeadline,
    },
    title: post.title,
    content: post.content,
    mediaUrl: post.mediaUrl,
    timestamp: post.timestamp || new Date().toISOString(),
    reactions: post.reactions,
  };
}

interface ProfileActivityProps extends PostAuthorProps {
  posts?: Post[];
  isLoading?: boolean;
  isViewingOther?: boolean;
}

// Featured post — their single best-performing post, given the magazine-cover
// treatment it deserves instead of making a visitor dig through the Activity
// tab to find out this person has anything worth reading.
export const ProfileFeatured: React.FC<{ posts?: Post[] }> = ({ posts = [] }) => {
  const navigate = useNavigate();
  if (!posts || posts.length === 0) return null;

  const featured = [...posts].sort((a, b) => (b.reactions?.likes || 0) - (a.reactions?.likes || 0))[0];
  if (!featured) return null;

  const excerpt = featured.content.length > 280 ? `${featured.content.slice(0, 280).trim()}…` : featured.content;

  return (
    <section className="profile-featured" onClick={() => navigate(`/posts/${featured.id}`)}>
      <div className="profile-featured__eyebrow">
        <IconSpark size={13} />
        Featured
      </div>
      {featured.title && <h2 className="profile-featured__title">{featured.title}</h2>}
      <p className="profile-featured__excerpt">{excerpt}</p>
      <div className="profile-featured__footer">
        <span className="profile-featured__stat">♥ {featured.reactions?.likes ?? 0} likes</span>
        <span className="profile-featured__stat">💬 {featured.reactions?.comments ?? 0} comments</span>
        <span className="profile-featured__link">Read the full post →</span>
      </div>
    </section>
  );
};

export const ProfileActivity: React.FC<ProfileActivityProps> = ({
  posts = [],
  isLoading = false,
  isViewingOther = false,
  authorId,
  authorFirstName,
  authorLastName,
  authorAvatar,
  authorHeadline,
}) => {
  const navigate = useNavigate();
  const hasContent = posts && posts.length > 0;

  return (
    <section className="profile-section profile-section--activity">
      <div className="profile-section__header">
        <div>
          <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconSpark size={17} /></span>Activity</h2>
          <p className="profile-section__subtitle">{posts?.length || 0} post{posts?.length !== 1 ? 's' : ''}</p>
        </div>
        {!isViewingOther && <button className="profile-section__action-btn" onClick={() => navigate('/dashboard')}>Create a post</button>}
      </div>

      {isLoading ? (
        <div className="profile-activity">
          <p className="profile-activity__empty">Loading activity...</p>
        </div>
      ) : hasContent ? (
        <div className="profile-activity-list">
          {posts?.map(post => (
            <FeedItem
              key={post.id}
              item={toFeedItemData(post, { authorId, authorFirstName, authorLastName, authorAvatar, authorHeadline })}
            />
          ))}
        </div>
      ) : (
        <div className="profile-activity">
          <p className="profile-activity__empty">{isViewingOther ? 'No posts yet' : 'You haven\'t posted yet'}</p>
          <p className="profile-activity__hint">{isViewingOther ? 'Posts will appear here.' : 'Posts you share will be displayed here.'}</p>
        </div>
      )}
      
      <button className="profile-section__footer-btn" onClick={() => navigate('/dashboard')}>Show all activity →</button>
    </section>
  );
};

// Shared: resume-style sections are namespaced per viewed profile (sectionsKey,
// typically the profile's URL slug) so that browsing multiple people's profiles
// doesn't leak one person's data onto another's. The owner's own profile (no
// sectionsKey passed) keeps using the original flat key for backward compat
// with ProfileEditPage.
export function getStoredSections(sectionsKey?: string): Record<string, any> {
  const storageKey = sectionsKey ? `ornave_profile_sections_${sectionsKey}` : 'ornave_profile_sections';
  const stored = localStorage.getItem(storageKey);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

interface SectionProps {
  sectionsKey?: string;
  isViewingOther?: boolean;
}

// Experience Section
export const ProfileExperience: React.FC<SectionProps> = ({ sectionsKey, isViewingOther = false }) => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    setExperiences(getStoredSections(sectionsKey).experiences || []);
  }, [sectionsKey]);

  if (experiences.length === 0) {
    if (isViewingOther) return null;
    return (
      <section className="profile-section profile-section--experience">
        <div className="profile-section__header">
          <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconBriefcase size={16} /></span>Experience</h2>
        </div>
        <button className="profile-section__add-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <span className="profile-section__add-icon">+</span>
          Add experience
        </button>
      </section>
    );
  }

  return (
    <section className="profile-section profile-section--experience">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconBriefcase size={16} /></span>Experience</h2>
        {!isViewingOther && (
          <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
            </svg>
          </button>
        )}
      </div>

      <div className="profile-section__items">
        {experiences.map(exp => (
          <div key={exp.id} className="profile-section__item">
            <div className="profile-item__icon"><IconBriefcase size={16} /></div>
            <div className="profile-item__content">
              <h3 className="profile-item__title">{exp.title}</h3>
              <p className="profile-item__subtitle">{exp.company}</p>
              {exp.location && <p className="profile-item__detail">{exp.location}</p>}
              <p className="profile-item__date">
                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
              </p>
              {exp.description && <p className="profile-item__description">{exp.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Education Section
export const ProfileEducation: React.FC<SectionProps> = ({ sectionsKey, isViewingOther = false }) => {
  const navigate = useNavigate();
  const [educations, setEducations] = useState<Education[]>([]);

  useEffect(() => {
    setEducations(getStoredSections(sectionsKey).educations || []);
  }, [sectionsKey]);

  if (educations.length === 0) {
    if (isViewingOther) return null;
    return (
      <section className="profile-section profile-section--education">
        <div className="profile-section__header">
          <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconGraduationCap size={17} /></span>Education</h2>
        </div>
        <p className="profile-section__helper">Enter your credentials and help recruiters find you for jobs requiring a certain degree or course of study.</p>
        <button className="profile-section__add-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <span className="profile-section__add-icon">+</span>
          Add education
        </button>
      </section>
    );
  }

  return (
    <section className="profile-section profile-section--education">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconGraduationCap size={17} /></span>Education</h2>
        {!isViewingOther && (
          <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
            </svg>
          </button>
        )}
      </div>

      <div className="profile-section__items">
        {educations.map(edu => (
          <div key={edu.id} className="profile-section__item">
            <div className="profile-item__icon"><IconGraduationCap size={17} /></div>
            <div className="profile-item__content">
              <h3 className="profile-item__title">{edu.school}</h3>
              <p className="profile-item__subtitle">{edu.degree}{edu.field ? ` - ${edu.field}` : ''}</p>
              <p className="profile-item__date">
                {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Skills Section
// Deterministic pseudo-count so the same skill always shows the same number
// (rather than a fresh random one every render) without needing a backend.
function endorsementSeed(name: string, level?: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const base = 8 + (hash % 60);
  return level === 'Expert' ? base + 25 : level === 'Advanced' ? base + 8 : base;
}

export const ProfileSkills: React.FC<SectionProps> = ({ sectionsKey, isViewingOther = false }) => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [endorsedIds, setEndorsedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSkills(getStoredSections(sectionsKey).skills || []);
    setEndorsedIds(new Set());
  }, [sectionsKey]);

  const toggleEndorse = (id: string) => {
    setEndorsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (skills.length === 0) {
    if (isViewingOther) return null;
    return (
      <section className="profile-section profile-section--skills">
        <div className="profile-section__header">
          <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconLaurel size={17} /></span>Skills</h2>
        </div>
        <p className="profile-section__helper">Show your top skills — link of the opportunities you see are matched based on them.</p>
        <button className="profile-section__add-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <span className="profile-section__add-icon">+</span>
          Add skill
        </button>
      </section>
    );
  }

  return (
    <section className="profile-section profile-section--skills">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconLaurel size={17} /></span>Skills</h2>
        {!isViewingOther && (
          <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
            </svg>
          </button>
        )}
      </div>

      <div className="profile-skills__grid">
        {skills.map(skill => {
          const isEndorsed = endorsedIds.has(skill.id);
          const count = (skill.endorsements ?? endorsementSeed(skill.name, skill.level)) + (isEndorsed ? 1 : 0);
          return (
            <div key={skill.id} className={`profile-skill__item ${isEndorsed ? 'profile-skill__item--endorsed' : ''}`}>
              <div className="profile-skill__main">
                <span className="profile-skill__name">{skill.name}</span>
                {skill.level && <span className="profile-skill__level">{skill.level}</span>}
              </div>
              <div className="profile-skill__footer">
                <span className="profile-skill__endorsements">{count} endorsement{count === 1 ? '' : 's'}</span>
                {isViewingOther && (
                  <button
                    className="profile-skill__endorse-btn"
                    onClick={() => toggleEndorse(skill.id)}
                  >
                    {isEndorsed ? '✓ Endorsed' : '+ Endorse'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// Interests Section
export const ProfileInterests: React.FC = () => {
  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconBuilding size={16} /></span>Interests</h2>
      </div>
      
      <div className="profile-interests__tabs">
        <button className="profile-interests__tab profile-interests__tab--active">Companies</button>
        <button className="profile-interests__tab">Groups</button>
        <button className="profile-interests__tab">Events</button>
        <button className="profile-interests__tab">Newsletters</button>
        <button className="profile-interests__tab">Schools</button>
      </div>
      
      <div className="profile-interests__content">
        <p className="profile-interests__empty">No companies followed yet</p>
        <p className="profile-interests__hint">Companies you follow will appear here.</p>
      </div>
    </section>
  );
};

// Certifications Section
export const ProfileCertifications: React.FC<SectionProps> = ({ sectionsKey, isViewingOther = false }) => {
  const navigate = useNavigate();
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    setCertifications(getStoredSections(sectionsKey).certifications || []);
  }, [sectionsKey]);

  if (certifications.length === 0) {
    return null;
  }

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconTrophy size={17} /></span>Licenses & Certifications</h2>
        {!isViewingOther && (
          <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
            </svg>
          </button>
        )}
      </div>

      <div className="profile-section__items">
        {certifications.map(cert => (
          <div key={cert.id} className="profile-section__item">
            <div className="profile-item__icon"><IconTrophy size={16} /></div>
            <div className="profile-item__content">
              <h3 className="profile-item__title">{cert.name}</h3>
              <p className="profile-item__subtitle">{cert.organization}</p>
              {cert.issueDate && <p className="profile-item__date">Issued {cert.issueDate}</p>}
              {cert.credentialId && <p className="profile-item__detail">Credential ID: {cert.credentialId}</p>}
              {cert.credentialUrl && (
                <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="profile-item__link">
                  Show credential →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Languages Section
export const ProfileLanguages: React.FC<SectionProps> = ({ sectionsKey, isViewingOther = false }) => {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    setLanguages(getStoredSections(sectionsKey).languages || []);
  }, [sectionsKey]);

  if (languages.length === 0) {
    return null;
  }

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconGlobe size={17} /></span>Languages</h2>
        {!isViewingOther && (
          <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
            </svg>
          </button>
        )}
      </div>

      <div className="profile-skills__grid">
        {languages.map(lang => (
          <div key={lang.id} className="profile-skill__item">
            <span className="profile-skill__name">{lang.name}</span>
            {lang.proficiency && <span className="profile-skill__level">{lang.proficiency}</span>}
          </div>
        ))}
      </div>
    </section>
  );
};

// Projects Section
export const ProfileProjects: React.FC<SectionProps> = ({ sectionsKey, isViewingOther = false }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getStoredSections(sectionsKey).projects || []);
  }, [sectionsKey]);

  if (projects.length === 0) {
    if (isViewingOther) return null;
    return (
      <section className="profile-section">
        <div className="profile-section__header">
          <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconLink size={16} /></span>Projects</h2>
        </div>
        <button className="profile-section__add-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <span className="profile-section__add-icon">+</span>
          Add project
        </button>
      </section>
    );
  }

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconLink size={16} /></span>Projects</h2>
        {!isViewingOther && (
          <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
            </svg>
          </button>
        )}
      </div>

      <div className="profile-projects__grid">
        {projects.map(proj => (
          <div key={proj.id} className="profile-project__card">
            {proj.imageUrl ? (
              <img src={proj.imageUrl} alt={proj.name} className="profile-project__image" />
            ) : (
              <div className="profile-project__image-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/>
                </svg>
              </div>
            )}
            <div className="profile-project__details">
              <h3 className="profile-project__name">{proj.name}</h3>
              <p className="profile-project__description">{proj.description}</p>
              <div className="profile-project__footer">
                <span className="profile-project__date">
                  {proj.startDate} - {proj.current ? 'Ongoing' : proj.endDate}
                </span>
                {proj.url && (
                  <a href={proj.url} target="_blank" rel="noopener noreferrer" className="profile-project__link">
                    View →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Volunteering Section
export const ProfileVolunteering: React.FC<SectionProps> = ({ sectionsKey, isViewingOther = false }) => {
  const navigate = useNavigate();
  const [volunteering, setVolunteering] = useState<Volunteering[]>([]);

  useEffect(() => {
    setVolunteering(getStoredSections(sectionsKey).volunteering || []);
  }, [sectionsKey]);

  if (volunteering.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconHandshake size={17} /></span>Volunteering</h2>
        {!isViewingOther && (
          <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
            </svg>
          </button>
        )}
      </div>
      <div className="profile-section__items">
        {volunteering.map(item => (
          <div key={item.id} className="profile-section__item">
            <div className="profile-item__icon"><IconHandshake size={17} /></div>
            <div className="profile-item__content">
              <h3 className="profile-item__title">{item.role}</h3>
              <p className="profile-item__subtitle">{item.organization}</p>
              {item.cause && <p className="profile-item__detail">Cause: {item.cause}</p>}
              <p className="profile-item__date">
                {item.startDate} - {item.current ? 'Present' : item.endDate}
              </p>
              {item.description && <p className="profile-item__description">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Honors & Awards Section
export const ProfileAwards: React.FC<SectionProps> = ({ sectionsKey, isViewingOther = false }) => {
  const navigate = useNavigate();
  const [awards, setAwards] = useState<Award[]>([]);

  useEffect(() => {
    setAwards(getStoredSections(sectionsKey).awards || []);
  }, [sectionsKey]);

  if (awards.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconTrophy size={17} /></span>Honors & Awards</h2>
        {!isViewingOther && (
          <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
            </svg>
          </button>
        )}
      </div>
      <div className="profile-section__items">
        {awards.map(award => (
          <div key={award.id} className="profile-section__item">
            <div className="profile-item__icon"><IconTrophy size={16} /></div>
            <div className="profile-item__content">
              <h3 className="profile-item__title">{award.title}</h3>
              <p className="profile-item__subtitle">{award.issuer}</p>
              {award.issueDate && <p className="profile-item__date">Issued {award.issueDate}</p>}
              {award.description && <p className="profile-item__description">{award.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Recommendations Section
export const ProfileRecommendations: React.FC<SectionProps> = ({ sectionsKey, isViewingOther = false }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setRecommendations(getStoredSections(sectionsKey).recommendations || []);
    setIndex(0);
  }, [sectionsKey]);

  const go = (delta: number) => setIndex((i) => (i + delta + recommendations.length) % recommendations.length);
  const active = recommendations[Math.min(index, recommendations.length - 1)];

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconCard size={16} /></span>Recommendations</h2>
        {!isViewingOther && (
          <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
            </svg>
          </button>
        )}
      </div>
      {recommendations.length === 0 ? (
        <div className="profile-connections-empty">
          <div className="empty-icon"><IconCard size={22} /></div>
          <p>No recommendations yet.</p>
          {!isViewingOther && (
            <button className="btn-primary" onClick={() => navigate('/profile/edit?tab=sections')}>
              Request a Recommendation
            </button>
          )}
        </div>
      ) : (
      <div className="profile-recommendations">
        <div className="profile-recommendation">
          {recommendations.length > 1 && (
            <button className="profile-recommendation__nav profile-recommendation__nav--prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
          )}
          <div className="profile-recommendation__header">
            <div className="profile-recommendation__avatar">
              {active.authorAvatar ? (
                <img src={active.authorAvatar} alt={active.author} />
              ) : (
                <div className="profile-recommendation__avatar-placeholder">
                  {active.author.charAt(0)}
                </div>
              )}
            </div>
            <div className="profile-recommendation__info">
              <h4 className="profile-recommendation__author">{active.author}</h4>
              <p className="profile-recommendation__headline">{active.authorHeadline}</p>
              <p className="profile-recommendation__date">{active.date}</p>
            </div>
          </div>
          <div className="profile-recommendation__content">
            <p>"{active.content}"</p>
          </div>
          {recommendations.length > 1 && (
            <>
              <button className="profile-recommendation__nav profile-recommendation__nav--next" onClick={() => go(1)} aria-label="Next">›</button>
              <div className="profile-recommendation__dots">
                {recommendations.map((_, i) => (
                  <span key={i} className={`profile-recommendation__dot ${i === index ? 'profile-recommendation__dot--active' : ''}`} onClick={() => setIndex(i)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </section>
  );
};

// Connections Section
export const ProfileConnections: React.FC<{ connections: any[], isLoading?: boolean, isViewingOther?: boolean }> = ({ 
  connections = [], 
  isLoading = false,
  isViewingOther = false
}) => {
  const navigate = useNavigate();

  return (
    <section className="profile-section profile-section--connections fade-in">
      <div className="profile-section__header">
        <div>
          <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconUsers size={16} /></span>Network Directory</h2>
          <p className="profile-section__subtitle">
            {connections.length} established {connections.length === 1 ? 'connection' : 'connections'}
          </p>
        </div>
        {!isViewingOther && (
          <button className="profile-section__action-btn" onClick={() => navigate('/network')}>
            Manage Network
          </button>
        )}
      </div>
      
      {isLoading ? (
        <div className="profile-connections-loading">
          <p>Loading connections…</p>
        </div>
      ) : connections.length > 0 ? (
        <div className="profile-connections-list">
          {connections.map((conn, i) => {
            const isFirm = conn.type === 'firm';
            return (
              <div key={conn.id || i} className={`connection-hud-item ${isFirm ? 'connection-hud-item--firm' : 'connection-hud-item--user'}`}>
                <div className="connection-hud-item__avatar">
                  {conn.avatarUrl ? (
                    <img src={conn.avatarUrl} alt={conn.name} />
                  ) : (
                    <div className="connection-hud-item__initials">
                      {isFirm ? '🏢' : (conn.name?.split(' ').map((n: string) => n[0]).join('') || 'U')}
                    </div>
                  )}
                  <div className="connection-hud-item__type-indicator"></div>
                </div>
                <div className="connection-hud-item__info">
                  <div className="connection-hud-item__title-row">
                    <h4
                      className="connection-hud-item__name"
                      onClick={() => navigate(`/profile?view=${conn.id || conn.name.toLowerCase().replace(' ', '-')}`)}
                    >
                      {conn.name}
                    </h4>
                    {isFirm && <span className="firm-verified-badge">Company</span>}
                  </div>
                  <p className="connection-hud-item__headline">{conn.headline}</p>
                  <div className="connection-hud-item__meta">
                    <span className="tech-tag">{isFirm ? 'Company' : 'Individual'}</span>
                    <span className="tech-tag">{conn.location || 'Global'}</span>
                  </div>
                </div>
                <div className="connection-hud-item__actions">
                  {isFirm && (
                    <button
                      className="btn-sm-firm"
                      onClick={() => navigate(`/purchased-services/${conn.id}`)}
                    >
                      Overview
                    </button>
                  )}
                  <button
                    className={isFirm ? "btn-sm-firm" : "btn-sm-primary"}
                    onClick={() => navigate(`/messages?to=${conn.id}`)}
                  >
                    {isFirm ? 'Enquire' : 'Message'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="profile-connections-empty">
          <div className="empty-icon"><IconUsers size={22} /></div>
          <p>No connections yet.</p>
          {!isViewingOther && (
            <button className="btn-primary" onClick={() => navigate('/network')}>
              Grow Your Network
            </button>
          )}
        </div>
      )}
    </section>
  );
};

// Services Section
interface ProfileServicesProps {
  companyId: string;
  isOwner: boolean;
}

export const ProfileServices: React.FC<ProfileServicesProps> = ({ companyId, isOwner }) => {
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestedId, setRequestedId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) { setIsLoading(false); return; }
    storeService.getCompanyProducts(companyId)
      .then(p => setProducts(p))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, [companyId]);

  const handleRequest = (product: Product) => {
    if (!user || user.id === 'guest') {
      triggerAuthModal('Please log in to request a service.');
      return;
    }
    setRequestedId(product.id);
    const ORDERS_KEY = 'ornave_orders';
    const existing = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const newOrder = {
      id: `ord-${Date.now()}`,
      userId: user.id,
      companyId,
      status: 'PENDING',
      totalAmount: product.price,
      currency: product.currency,
      createdAt: new Date().toISOString(),
      company: { name: product.company?.name || 'Firm', id: companyId },
      items: [{ id: `i-${Date.now()}`, productId: product.id, product, quantity: 1, price: product.price }],
    };
    localStorage.setItem(ORDERS_KEY, JSON.stringify([newOrder, ...existing]));
  };

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title"><span className="profile-section__title-icon"><IconCard size={16} /></span>Services</h2>
        {isOwner && (
          <button className="profile-section__action-btn" onClick={() => navigate('/global/store')}>
            Manage
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="profile-section__subtitle">Loading services...</p>
      ) : products.length === 0 ? (
        <p className="profile-section__subtitle">
          {isOwner ? 'No services listed yet. Add them in your store.' : 'No services listed yet.'}
        </p>
      ) : (
        <div className="profile-services__grid">
          {products.map(product => (
            <div key={product.id} className="profile-service-card">
              {product.imageUrl && (
                <div className="profile-service-card__img">
                  <img src={product.imageUrl} alt={product.name} />
                </div>
              )}
              <div className="profile-service-card__body">
                <div className="profile-service-card__name">{product.name}</div>
                {product.description && (
                  <div className="profile-service-card__desc">{product.description}</div>
                )}
                <div className="profile-service-card__price">
                  {product.currency} {product.price.toFixed(2)}
                </div>
              </div>
              <div className="profile-service-card__footer">
                {isOwner ? (
                  <button className="profile-service-card__btn profile-service-card__btn--manage" onClick={() => navigate('/global/store')}>
                    Edit
                  </button>
                ) : (
                  <button
                    className={`profile-service-card__btn ${requestedId === product.id ? 'profile-service-card__btn--sent' : ''}`}
                    onClick={() => handleRequest(product)}
                    disabled={requestedId === product.id}
                  >
                    {requestedId === product.id ? '✓ Requested' : 'Request Service'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Editorial dossier widgets — the light, magazine-style Overview layout.
// Presentation-only: they take plain derived data as props rather than a
// sectionsKey, since the caller (ProfilePage) already has a single resolved
// profile sections record to draw from.
// ══════════════════════════════════════════════════════════════════════════

export const ProfileExpertiseList: React.FC<{ items?: string[] }> = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="dossier-card">
      <h4 className="dossier-card__title">Expertise</h4>
      <ul className="dossier-list">
        {items.map((item) => (
          <li key={item} className="dossier-list__item">{item}</li>
        ))}
      </ul>
    </div>
  );
};

export const ProfileLanguagesList: React.FC<{ languages?: { id: string; name: string; proficiency?: string }[] }> = ({ languages }) => {
  if (!languages || languages.length === 0) return null;
  return (
    <div className="dossier-card">
      <h4 className="dossier-card__title">Languages</h4>
      <div className="dossier-rows">
        {languages.map((l) => (
          <div key={l.id} className="dossier-row">
            <span>{l.name}</span>
            <span className="dossier-row__meta">{l.proficiency}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProfileContactCard: React.FC<{
  email?: string;
  website?: string;
  phone?: string;
  onScheduleMeeting?: () => void;
  onDownloadVCard?: () => void;
}> = ({ email, website, phone, onScheduleMeeting, onDownloadVCard }) => {
  if (!website && !phone && !email) return null;
  return (
    <div className="dossier-card">
      <h4 className="dossier-card__title">Contact</h4>
      <div className="dossier-contact-rows">
        {email && (
          <a href={`mailto:${email}`} className="dossier-contact-row">
            <IconMail size={15} /><span>{email}</span>
          </a>
        )}
        {phone && (
          <div className="dossier-contact-row"><IconPhone size={15} /><span>{phone}</span></div>
        )}
        {website && (
          <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="dossier-contact-row">
            <IconLink size={15} /><span>{website}</span>
          </a>
        )}
        {onDownloadVCard && (
          <button className="dossier-contact-row dossier-contact-row--btn" onClick={onDownloadVCard}>
            <IconCard size={15} /><span>Download vCard</span>
          </button>
        )}
      </div>
      {onScheduleMeeting && (
        <button className="dossier-cta-btn" onClick={onScheduleMeeting}>
          Schedule Meeting
        </button>
      )}
    </div>
  );
};

export const ProfileMembershipCard: React.FC<{ tier?: string; memberSince?: string }> = ({ tier, memberSince }) => {
  if (!tier) return null;
  const badges = ['Verified Professional', 'Executive Circle', 'Priority Support'];
  return (
    <div className="dossier-card">
      <h4 className="dossier-card__title">Membership</h4>
      <ul className="dossier-badges">
        <li className="dossier-badges__item"><IconVerified size={15} />{tier}</li>
        {badges.map((b) => (
          <li key={b} className="dossier-badges__item"><IconLaurel size={15} />{b}</li>
        ))}
      </ul>
      {memberSince && <p className="dossier-card__footnote">Member since {memberSince}</p>}
    </div>
  );
};

export interface FeaturedSlide { image: string; title: string; role?: string }

export const ProfileFeaturedAchievement: React.FC<{
  slides?: FeaturedSlide[];
  onView?: () => void;
}> = ({ slides, onView }) => {
  const [index, setIndex] = useState(0);
  if (!slides || slides.length === 0) return null;
  const active = slides[Math.min(index, slides.length - 1)];
  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);
  return (
    <section className="dossier-featured">
      <div className="dossier-featured__image">
        <img src={active.image} alt={active.title} />
        {slides.length > 1 && (
          <>
            <button className="dossier-featured__nav dossier-featured__nav--prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
            <button className="dossier-featured__nav dossier-featured__nav--next" onClick={() => go(1)} aria-label="Next">›</button>
            <div className="dossier-featured__dots">
              {slides.map((_, i) => (
                <span key={i} className={`dossier-featured__dot ${i === index ? 'dossier-featured__dot--active' : ''}`} onClick={() => setIndex(i)} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="dossier-featured__body">
        <span className="dossier-featured__eyebrow"><IconSpark size={13} /> Featured Achievement</span>
        <h3 className="dossier-featured__title">{active.title}</h3>
        {active.role && <p className="dossier-featured__role">Role: {active.role}</p>}
        {onView && <button className="dossier-cta-btn" onClick={onView}>View Project</button>}
      </div>
    </section>
  );
};

export const ProfileRecentPosts: React.FC<PostAuthorProps & { posts?: Post[] }> = ({
  posts = [],
  authorId,
  authorFirstName,
  authorLastName,
  authorAvatar,
  authorHeadline,
}) => {
  return (
    <div className="dossier-card">
      <div className="dossier-card__header-row">
        <h4 className="dossier-card__title">Recent Posts</h4>
        <span className="dossier-card__view-all">View all</span>
      </div>
      {!posts || posts.length === 0 ? (
        <div className="dossier-empty-state">
          <p>No posts yet.</p>
        </div>
      ) : (
      <div className="dossier-posts">
        {posts.slice(0, 3).map((p) => (
          <FeedItem
            key={p.id}
            item={toFeedItemData(p, { authorId, authorFirstName, authorLastName, authorAvatar, authorHeadline })}
          />
        ))}
      </div>
      )}
    </div>
  );
};

export const ProfilePortfolioGallery: React.FC<{ items?: ProfilePortfolioItem[] }> = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="dossier-card">
      <h4 className="dossier-card__title">Portfolio Highlights</h4>
      <div className="dossier-portfolio-grid">
        {items.map((item) => (
          <figure key={item.id} className="dossier-portfolio-item">
            <img src={item.image} alt={item.title} loading="lazy" />
            <figcaption>
              <span className="dossier-portfolio-item__title">{item.title}</span>
              <span className="dossier-portfolio-item__meta">{[item.location, item.year].filter(Boolean).join(' · ')}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
};

export interface DerivedCompany { name: string; role: string; years: string }

export const ProfileCompaniesList: React.FC<{ companies?: DerivedCompany[] }> = ({ companies }) => {
  if (!companies || companies.length === 0) return null;
  return (
    <div className="dossier-card">
      <h4 className="dossier-card__title">Companies</h4>
      <div className="dossier-rows">
        {companies.map((c) => (
          <div key={c.name} className="dossier-company-row">
            <div className="dossier-company-row__avatar">{c.name.slice(0, 2).toUpperCase()}</div>
            <div className="dossier-company-row__info">
              <span className="dossier-company-row__name">{c.name} <IconVerified size={12} /></span>
              <span className="dossier-company-row__meta">{c.role}</span>
              <span className="dossier-company-row__meta">{c.years}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface TimelineEntry { id: string; period: string; title: string; org: string }

export const ProfileTimeline: React.FC<{ entries?: TimelineEntry[]; title?: string }> = ({ entries, title = 'Experience Timeline' }) => {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="dossier-card">
      <h4 className="dossier-card__title">{title}</h4>
      <div className="dossier-timeline">
        {entries.map((e) => (
          <div key={e.id} className="dossier-timeline__item">
            <span className="dossier-timeline__dot" />
            <span className="dossier-timeline__period">{e.period}</span>
            <span className="dossier-timeline__title">{e.title}</span>
            <span className="dossier-timeline__org">{e.org}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const skillLevelToPercent = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'expert': return 95;
    case 'advanced': return 80;
    case 'intermediate': return 60;
    case 'beginner': return 35;
    default: return 50;
  }
};

export const ProfileSkillBars: React.FC<{ skills?: ProfileSkillEntry[] }> = ({ skills }) => {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="dossier-card">
      <h4 className="dossier-card__title">Expertise &amp; Skills</h4>
      <div className="dossier-skill-bars">
        {skills.slice(0, 8).map((s) => (
          <div key={s.id} className="dossier-skill-bar">
            <span className="dossier-skill-bar__label">{s.name}</span>
            <div className="dossier-skill-bar__track">
              <div className="dossier-skill-bar__fill" style={{ width: `${skillLevelToPercent(s.level)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProfileTrustedConnections: React.FC<{ connections?: any[] }> = ({ connections = [] }) => {
  const navigate = useNavigate();
  const shown = connections.slice(0, 7);
  const overflow = connections.length - shown.length;
  return (
    <div className="dossier-card">
      <div className="dossier-card__header-row">
        <h4 className="dossier-card__title">Trusted Connections</h4>
        <span className="dossier-card__view-all">View all</span>
      </div>
      {!connections || connections.length === 0 ? (
        <div className="dossier-empty-state">
          <p>No connections yet.</p>
        </div>
      ) : (
      <div className="dossier-trusted__grid">
        {shown.map((c, i) => (
          <div
            key={c.id || i}
            className="dossier-trusted__avatar"
            onClick={() => c.id && navigate(`/profile?view=${c.id}`)}
            title={c.name}
          >
            {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} /> : (c.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
        ))}
        {overflow > 0 && (
          <div className="dossier-trusted__avatar dossier-trusted__avatar--overflow">+{overflow}</div>
        )}
      </div>
      )}
    </div>
  );
};

export interface DerivedRecognition { id: string; label: string; sublabel: string }

export const ProfileRecognitions: React.FC<{ items?: DerivedRecognition[] }> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="dossier-card dossier-card--recognitions">
        <h4 className="dossier-card__title">Recognitions &amp; Awards</h4>
        <div className="dossier-recognitions__empty">No recognitions added yet.</div>
      </div>
    );
  }
  return (
    <div className="dossier-card dossier-card--recognitions">
      <div className="dossier-card__header-row">
        <h4 className="dossier-card__title">Recognitions &amp; Awards</h4>
        <span className="dossier-card__view-all">View all</span>
      </div>
      <div className="dossier-recognitions__grid">
        {items.slice(0, 4).map((r) => (
          <div key={r.id} className="dossier-recognitions__item">
            <IconLaurel size={32} />
            <span className="dossier-recognitions__label">{r.label}</span>
            <span className="dossier-recognitions__sublabel">{r.sublabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
