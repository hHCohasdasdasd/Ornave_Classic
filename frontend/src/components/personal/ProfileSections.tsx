import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeService, Product } from '@/services/storeService';
import { useAuth } from '@/context/AuthContext';

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

// Analytics Section
export const ProfileAnalytics: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="profile-section profile-section--analytics">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Analytics</h2>
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
}

interface ProfileActivityProps {
  posts?: Post[];
  isLoading?: boolean;
  isViewingOther?: boolean;
}

export const ProfileActivity: React.FC<ProfileActivityProps> = ({ posts = [], isLoading = false, isViewingOther = false }) => {
  const navigate = useNavigate();
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const hasContent = posts && posts.length > 0;

  return (
    <section className="profile-section profile-section--activity">
      <div className="profile-section__header">
        <div>
          <h2 className="profile-section__title">Activity</h2>
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
            <div key={post.id} className="profile-activity-item">
              <div className="profile-activity-item__content">
                {post.title && <h4 className="profile-activity-item__title">{post.title}</h4>}
                <p className="profile-activity-item__text">{post.content}</p>
              </div>
              <div className="profile-activity-item__footer">
                <span className="profile-activity-item__time">{formatDate(post.timestamp)}</span>
                {post.reactions && (
                  <div className="profile-activity-item__reactions">
                    <span>👍 {post.reactions.likes}</span>
                    <span>💬 {post.reactions.comments}</span>
                  </div>
                )}
              </div>
            </div>
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

// Experience Section
export const ProfileExperience: React.FC = () => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ornave_profile_sections');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setExperiences(data.experiences || []);
      } catch {}
    }
  }, []);

  if (experiences.length === 0) {
    return (
      <section className="profile-section profile-section--experience">
        <div className="profile-section__header">
          <h2 className="profile-section__title">Experience</h2>
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
        <h2 className="profile-section__title">Experience</h2>
        <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
          </svg>
        </button>
      </div>
      
      <div className="profile-section__items">
        {experiences.map(exp => (
          <div key={exp.id} className="profile-section__item">
            <div className="profile-item__icon">💼</div>
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
export const ProfileEducation: React.FC = () => {
  const navigate = useNavigate();
  const [educations, setEducations] = useState<Education[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ornave_profile_sections');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setEducations(data.educations || []);
      } catch {}
    }
  }, []);

  if (educations.length === 0) {
    return (
      <section className="profile-section profile-section--education">
        <div className="profile-section__header">
          <h2 className="profile-section__title">Education</h2>
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
        <h2 className="profile-section__title">Education</h2>
        <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
          </svg>
        </button>
      </div>
      
      <div className="profile-section__items">
        {educations.map(edu => (
          <div key={edu.id} className="profile-section__item">
            <div className="profile-item__icon">🎓</div>
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
export const ProfileSkills: React.FC = () => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ornave_profile_sections');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSkills(data.skills || []);
      } catch {}
    }
  }, []);

  if (skills.length === 0) {
    return (
      <section className="profile-section profile-section--skills">
        <div className="profile-section__header">
          <h2 className="profile-section__title">Skills</h2>
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
        <h2 className="profile-section__title">Skills</h2>
        <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
          </svg>
        </button>
      </div>
      
      <div className="profile-skills__grid">
        {skills.map(skill => (
          <div key={skill.id} className="profile-skill__item">
            <span className="profile-skill__name">{skill.name}</span>
            {skill.level && <span className="profile-skill__level">{skill.level}</span>}
          </div>
        ))}
      </div>
    </section>
  );
};

// Interests Section
export const ProfileInterests: React.FC = () => {
  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Interests</h2>
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
export const ProfileCertifications: React.FC = () => {
  const navigate = useNavigate();
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ornave_profile_sections');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setCertifications(data.certifications || []);
      } catch {}
    }
  }, []);

  if (certifications.length === 0) {
    return null;
  }

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Licenses & Certifications</h2>
        <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
          </svg>
        </button>
      </div>
      
      <div className="profile-section__items">
        {certifications.map(cert => (
          <div key={cert.id} className="profile-section__item">
            <div className="profile-item__icon">🏆</div>
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
export const ProfileLanguages: React.FC = () => {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ornave_profile_sections');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setLanguages(data.languages || []);
      } catch {}
    }
  }, []);

  if (languages.length === 0) {
    return null;
  }

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Languages</h2>
        <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
          </svg>
        </button>
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
export const ProfileProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ornave_profile_sections');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setProjects(data.projects || []);
      } catch {}
    }
  }, []);

  if (projects.length === 0) {
    return (
      <section className="profile-section">
        <div className="profile-section__header">
          <h2 className="profile-section__title">Projects</h2>
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
        <h2 className="profile-section__title">Projects</h2>
        <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
          </svg>
        </button>
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
export const ProfileVolunteering: React.FC = () => {
  const navigate = useNavigate();
  const [volunteering, setVolunteering] = useState<Volunteering[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ornave_profile_sections');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setVolunteering(data.volunteering || []);
      } catch {}
    }
  }, []);

  if (volunteering.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Volunteering</h2>
        <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
          </svg>
        </button>
      </div>
      <div className="profile-section__items">
        {volunteering.map(item => (
          <div key={item.id} className="profile-section__item">
            <div className="profile-item__icon">🤝</div>
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
export const ProfileAwards: React.FC = () => {
  const navigate = useNavigate();
  const [awards, setAwards] = useState<Award[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ornave_profile_sections');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setAwards(data.awards || []);
      } catch {}
    }
  }, []);

  if (awards.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Honors & Awards</h2>
        <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
          </svg>
        </button>
      </div>
      <div className="profile-section__items">
        {awards.map(award => (
          <div key={award.id} className="profile-section__item">
            <div className="profile-item__icon">🎖️</div>
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
export const ProfileRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ornave_profile_sections');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setRecommendations(data.recommendations || []);
      } catch {}
    }
  }, []);

  if (recommendations.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__header">
        <h2 className="profile-section__title">Recommendations</h2>
        <button className="profile-section__icon-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.1 1.9L14.1 3.9L12.1 1.9zM2 11.5V13.5H4L11.5 6L9.5 4L2 11.5z"/>
          </svg>
        </button>
      </div>
      <div className="profile-recommendations">
        {recommendations.map(rec => (
          <div key={rec.id} className="profile-recommendation">
            <div className="profile-recommendation__header">
              <div className="profile-recommendation__avatar">
                {rec.authorAvatar ? (
                  <img src={rec.authorAvatar} alt={rec.author} />
                ) : (
                  <div className="profile-recommendation__avatar-placeholder">
                    {rec.author.charAt(0)}
                  </div>
                )}
              </div>
              <div className="profile-recommendation__info">
                <h4 className="profile-recommendation__author">{rec.author}</h4>
                <p className="profile-recommendation__headline">{rec.authorHeadline}</p>
                <p className="profile-recommendation__date">{rec.date}</p>
              </div>
            </div>
            <div className="profile-recommendation__content">
              <p>"{rec.content}"</p>
            </div>
          </div>
        ))}
      </div>
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
          <h2 className="profile-section__title">Network Directory</h2>
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
          <div className="tech-scan-line"></div>
          <p>Scanning established links...</p>
        </div>
      ) : connections.length > 0 ? (
        <div className="profile-connections-list">
          {connections.map((conn, i) => {
            const isFirm = conn.type === 'firm';
            return (
              <div key={conn.id || i} className={`connection-hud-item ${isFirm ? 'connection-hud-item--firm' : 'connection-hud-item--user'}`} style={isFirm ? {
                borderLeft: '4px solid var(--tech-blue)',
                background: 'linear-gradient(90deg, rgba(231, 223, 201, 0.05) 0%, transparent 100%)'
              } : {}}>
                <div className="connection-hud-item__avatar" style={isFirm ? {
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                  borderRadius: '0'
                } : {}}>
                  {conn.avatarUrl ? (
                    <img src={conn.avatarUrl} alt={conn.name} />
                  ) : (
                    <div className="connection-hud-item__initials">
                      {isFirm ? '🏢' : (conn.name?.split(' ').map((n: string) => n[0]).join('') || 'U')}
                    </div>
                  )}
                  <div className="connection-hud-item__type-indicator" style={{ backgroundColor: isFirm ? 'var(--tech-blue)' : 'var(--color-primary)' }}></div>
                </div>
                <div className="connection-hud-item__info">
                  <div className="connection-hud-item__title-row">
                    <h4
                      className="connection-hud-item__name"
                      onClick={() => navigate(`/profile?view=${conn.id || conn.name.toLowerCase().replace(' ', '-')}`)}
                      style={{ color: isFirm ? 'var(--tech-blue)' : 'var(--color-text)' }}
                    >
                      {conn.name}
                    </h4>
                    {isFirm && <span className="firm-verified-badge" style={{ background: 'var(--tech-blue)', color: '#14140f' }}>Company</span>}
                    {!isFirm && <span className="firm-verified-badge" style={{ background: 'rgba(198, 161, 91, 0.2)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>Connection</span>}
                  </div>
                  <p className="connection-hud-item__headline">{conn.headline}</p>
                  <div className="connection-hud-item__meta">
                    <span className="tech-tag" style={{ borderColor: isFirm ? 'var(--tech-blue)' : 'rgba(198, 161, 91, 0.5)', color: isFirm ? 'var(--tech-blue)' : 'var(--color-primary)' }}>
                      {isFirm ? 'Company' : 'Individual'}
                    </span>
                    <span className="tech-tag">{conn.location || 'Global'}</span>
                  </div>
                </div>
                <div className="connection-hud-item__actions">
                  {isFirm && (
                    <button
                      className="btn-sm-primary"
                      style={{ background: 'var(--tech-blue)', border: 'none', marginRight: '8px', color: '#14140f', fontWeight: 800 }}
                      onClick={() => navigate(`/purchased-services/${conn.id}`)}
                    >
                      OVERVIEW
                    </button>
                  )}
                  <button
                    className={isFirm ? "btn-sm-firm" : "btn-sm-primary"}
                    onClick={() => navigate(`/messages?to=${conn.id}`)}
                    style={!isFirm ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
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
          <div className="empty-icon">∅</div>
          <p>No active connections found in this sector.</p>
          {!isViewingOther && (
            <button className="btn-primary" onClick={() => navigate('/network')}>
              Expand Network
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
        <h2 className="profile-section__title">Services</h2>
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
