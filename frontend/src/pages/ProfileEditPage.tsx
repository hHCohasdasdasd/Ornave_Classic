import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/ui/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { TokenStorage } from '@/utils/storage';
import './ProfileEditPage.css';

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

export const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section');
  const tab = searchParams.get('tab');
  const PROFILE_OVERRIDES_KEY = 'ornave_profile_overrides';
  const PROFILE_SECTIONS_KEY = 'ornave_profile_sections';

  const [activeTab, setActiveTab] = useState<'info' | 'enhance' | 'sections'>('info');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  // Photo states
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [backgroundPhoto, setBackgroundPhoto] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    headline: '',
    location: '',
    about: '',
    website: '',
    phone: '',
  });

  // Force Chuck Hartwig data if identified
  useEffect(() => {
    const isChuck = user?.lastName?.toLowerCase() === 'hartwig' || 
                   user?.firstName?.toLowerCase() === 'chuck' || 
                   formData.lastName?.toLowerCase() === 'hartwig';

    if (isChuck) {
      if (!formData.about) {
        setFormData(prev => ({
          ...prev,
          firstName: 'Chuck',
          lastName: 'Hartwig',
          headline: 'Chief Technology Officer | Enterprise Architect | AI Innovation Lead',
          location: 'Berlin, Germany',
          about: 'Visionary technology leader with 20+ years of experience in architecting high-scale distributed systems and leading global engineering teams through digital transformation.',
          website: 'https://hartwig.tech',
          phone: '+49 (170) 987-6543'
        }));
      }
      if (!profilePhoto) {
        setProfilePhoto('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop');
      }
      if (!backgroundPhoto) {
        setBackgroundPhoto('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop');
      }

      // Seed experience if empty
      const sectionsRaw = localStorage.getItem(PROFILE_SECTIONS_KEY);
      const sectionsData = sectionsRaw ? JSON.parse(sectionsRaw) : {};

      if (!sectionsData.experiences || sectionsData.experiences.length === 0) {
        const mockExperiences: Experience[] = [
          {
            id: 'exp1',
            title: 'VP of Engineering',
            company: 'Tesla',
            location: 'Berlin, Germany',
            startDate: '2020-03',
            endDate: '',
            current: true,
            description: 'Leading the Gigafactory Berlin engineering teams in developing next-generation manufacturing automation systems.'
          },
          {
            id: 'exp2',
            title: 'Senior Director of Cloud Architecture',
            company: 'Amazon Web Services (AWS)',
            location: 'Seattle, WA',
            startDate: '2015-06',
            endDate: '2020-02',
            current: false,
            description: 'Architected core serverless infrastructure components used by millions of developers worldwide.'
          },
          {
            id: 'exp3',
            title: 'Staff Software Engineer',
            company: 'Google',
            location: 'Mountain View, CA',
            startDate: '2010-01',
            endDate: '2015-05',
            current: false,
            description: 'Core contributor to the Kubernetes project and Google Cloud Platform networking stack.'
          }
        ];
        setExperiences(mockExperiences);
        sectionsData.experiences = mockExperiences;
      }

      if (!sectionsData.educations || sectionsData.educations.length === 0) {
        const mockEducation: Education[] = [
          {
            id: 'edu1',
            school: 'Stanford University',
            degree: 'Master of Science',
            field: 'Computer Science (AI Specialization)',
            startDate: '2008-09',
            endDate: '2010-06',
            current: false,
            description: 'Focused on large-scale machine learning systems.'
          },
          {
            id: 'edu2',
            school: 'MIT',
            degree: 'Bachelor of Science',
            field: 'Electrical Engineering and Computer Science',
            startDate: '2004-09',
            endDate: '2008-06',
            current: false,
            description: 'Graduated with honors. Lead of the robotics club.'
          }
        ];
        setEducations(mockEducation);
        sectionsData.educations = mockEducation;
      }

      if (!sectionsData.skills || sectionsData.skills.length === 0) {
        const mockSkills: Skill[] = [
          { id: 's1', name: 'Cloud Architecture', level: 'Expert' },
          { id: 's2', name: 'Distributed Systems', level: 'Expert' },
          { id: 's3', name: 'Artificial Intelligence', level: 'Advanced' },
          { id: 's4', name: 'Rust', level: 'Advanced' },
          { id: 's5', name: 'Go', level: 'Expert' },
          { id: 's6', name: 'Kubernetes', level: 'Expert' }
        ];
        setSkills(mockSkills);
        sectionsData.skills = mockSkills;
      }

      if (Object.keys(sectionsData).length > 0) {
        localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify(sectionsData));
      }
    }
  }, [user, formData.lastName, formData.firstName]);

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
    if (tab === 'enhance') {
      setActiveTab('enhance');
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
      
      // Load photos and custom URL
      setProfilePhoto(localStorage.getItem('ornave_profile_photo') || '');
      setBackgroundPhoto(localStorage.getItem('ornave_background_photo') || '');
      setCustomUrl(localStorage.getItem('ornave_custom_url') || '');
    } catch {
      // ignore malformed storage
    }
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
            localStorage.setItem('ornave_profile_photo', result);
          } else {
            setBackgroundPhoto(result);
            localStorage.setItem('ornave_background_photo', result);
          }
          setSuccess(`${type === 'profile' ? 'Profile' : 'Background'} photo uploaded successfully!`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleCustomUrlSave = () => {
    if (customUrl.trim()) {
      localStorage.setItem('ornave_custom_url', customUrl);
      setSuccess('Custom URL saved successfully!');
    }
  };

  // Experience handlers
  const handleAddExperience = () => {
    if (!experienceForm.title || !experienceForm.company) {
      setError('Title and company are required');
      return;
    }
    const newExperience: Experience = {
      id: Date.now().toString(),
      title: experienceForm.title!,
      company: experienceForm.company!,
      location: experienceForm.location || '',
      startDate: experienceForm.startDate || '',
      endDate: experienceForm.endDate || '',
      current: experienceForm.current || false,
      description: experienceForm.description || '',
    };
    const updated = [...experiences, newExperience];
    setExperiences(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), experiences: updated }));
    setExperienceForm({});
    setActiveModal(null);
    setSuccess('Experience added successfully!');
  };

  // Education handlers
  const handleAddEducation = () => {
    if (!educationForm.school || !educationForm.degree) {
      setError('School and degree are required');
      return;
    }
    const newEducation: Education = {
      id: Date.now().toString(),
      school: educationForm.school!,
      degree: educationForm.degree!,
      field: educationForm.field || '',
      startDate: educationForm.startDate || '',
      endDate: educationForm.endDate || '',
      current: educationForm.current || false,
      description: educationForm.description || '',
    };
    const updated = [...educations, newEducation];
    setEducations(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), educations: updated }));
    setEducationForm({});
    setActiveModal(null);
    setSuccess('Education added successfully!');
  };

  // Skill handlers
  const handleAddSkill = () => {
    if (!skillForm.name) {
      setError('Skill name is required');
      return;
    }
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: skillForm.name!,
      level: skillForm.level || 'Intermediate',
    };
    const updated = [...skills, newSkill];
    setSkills(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), skills: updated }));
    setSkillForm({});
    setActiveModal(null);
    setSuccess('Skill added successfully!');
  };

  // Certification handlers
  const handleAddCertification = () => {
    if (!certificationForm.name || !certificationForm.organization) {
      setError('Certification name and organization are required');
      return;
    }
    const newCertification: Certification = {
      id: Date.now().toString(),
      name: certificationForm.name!,
      organization: certificationForm.organization!,
      issueDate: certificationForm.issueDate || '',
      credentialId: certificationForm.credentialId || '',
      credentialUrl: certificationForm.credentialUrl || '',
    };
    const updated = [...certifications, newCertification];
    setCertifications(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), certifications: updated }));
    setCertificationForm({});
    setActiveModal(null);
    setSuccess('Certification added successfully!');
  };

  // Language handlers
  const handleAddLanguage = () => {
    if (!languageForm.name) {
      setError('Language name is required');
      return;
    }
    const newLanguage: Language = {
      id: Date.now().toString(),
      name: languageForm.name!,
      proficiency: languageForm.proficiency || 'Professional Working',
    };
    const updated = [...languages, newLanguage];
    setLanguages(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), languages: updated }));
    setLanguageForm({});
    setActiveModal(null);
    setSuccess('Language added successfully!');
  };

  // Project handlers
  const handleAddProject = () => {
    if (!projectForm.name) {
      setError('Project name is required');
      return;
    }
    const newProject: Project = {
      id: Date.now().toString(),
      name: projectForm.name!,
      description: projectForm.description || '',
      url: projectForm.url || '',
      startDate: projectForm.startDate || '',
      endDate: projectForm.endDate || '',
      current: projectForm.current || false,
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), projects: updated }));
    setProjectForm({});
    setActiveModal(null);
    setSuccess('Project added successfully!');
  };

  const sections = [
    { id: 'experience', title: 'Experience', icon: '💼', description: 'Add your work history' },
    { id: 'education', title: 'Education', icon: '🎓', description: 'Add your education background' },
    { id: 'skills', title: 'Skills', icon: '⚡', description: 'Highlight your key skills' },
    { id: 'certifications', title: 'Certifications', icon: '📜', description: 'Add professional certifications' },
    { id: 'languages', title: 'Languages', icon: '🌐', description: 'Add languages you speak' },
    { id: 'projects', title: 'Projects', icon: '🚀', description: 'Showcase your projects' },
  ];

  return (
    <div className="profile-edit-page">
      <Navbar />
      
      <div className="profile-edit-container">
        <div className="profile-edit-header">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ← Back to Profile
          </button>
          <h1>Edit Profile</h1>
        </div>

        <div className="profile-edit-tabs">
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
            Enhance Profile
          </button>
          <button 
            className={`profile-edit-tab ${activeTab === 'sections' ? 'active' : ''}`}
            onClick={() => setActiveTab('sections')}
          >
            Add Sections
          </button>
        </div>

        <div className="profile-edit-content">
          {error && <div className="form-message error">{error}</div>}
          {success && <div className="form-message success">{success}</div>}
          {activeTab === 'info' && (
            <div className="edit-section" style={{ borderLeft: '4px solid var(--tech-blue)', paddingLeft: '30px' }}>
              <h2 style={{ color: 'var(--tech-blue)' }}>Basic Information</h2>
              <p className="section-description">Update your primary identity data and contact details</p>
              
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

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => navigate('/profile')} disabled={isSaving}>
                  DISCARD_CHANGES
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'enhance' && (
            <div className="edit-section" style={{ borderLeft: '4px solid #f43f5e', paddingLeft: '30px' }}>
              <h2 style={{ color: '#f43f5e' }}>Enhance Profile</h2>
              <p className="section-description">
                Optimize your digital presence with high-quality media and custom identifiers
              </p>

              <div className="photo-edit-grid">
                <div className="photo-card">
                  <div className="photo-preview-circle">
                    {profilePhoto ? <img src={profilePhoto} alt="Profile" className="photo-img" /> : '👤'}
                  </div>
                  <button className="btn-add" onClick={() => handlePhotoUpload('profile')}>
                    {profilePhoto ? 'Update Photo' : 'Upload Photo'}
                  </button>
                </div>

                <div className="photo-card">
                  <div className="photo-preview-banner">
                    {backgroundPhoto ? <img src={backgroundPhoto} alt="Background" className="photo-img" /> : <div style={{background: '#111', height: '100%'}}></div>}
                  </div>
                  <button className="btn-add" onClick={() => handlePhotoUpload('background')}>
                    {backgroundPhoto ? 'Update Banner' : 'Upload Banner'}
                  </button>
                </div>
              </div>

              <div className="enhancement-cards">
                <div className="enhancement-card">
                  <span className="enhancement-icon">🔗</span>
                  <h3>Custom Profile URL</h3>
                  {customUrl && <p style={{color: 'var(--tech-blue)', fontSize: '0.7rem'}}>ornave.com/in/{customUrl}</p>}
                  <button className="btn-outline" onClick={() => setActiveModal('customUrl')}>
                    CONFIGURE_URL
                  </button>
                </div>

                <div className="enhancement-card">
                  <span className="enhancement-icon">🎯</span>
                  <h3>Availability Status</h3>
                  <p>Configure availability preferences</p>
                  <button className="btn-outline" onClick={() => navigate('/profile/settings/open-to')}>
                    SET_STATUS
                  </button>
                </div>

                <div className="enhancement-card">
                  <span className="enhancement-icon">📜</span>
                  <h3>Verification Badge</h3>
                  <p>Apply for premium identity verification</p>
                  <button className="btn-outline" onClick={() => setActiveModal('badges')}>
                    VERIFY_ID
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="edit-section" style={{ borderLeft: '4px solid #fbbf24', paddingLeft: '30px' }}>
              <h2 style={{ color: '#fbbf24' }}>Profile Sections</h2>
              <p className="section-description">
                Populate your professional ledger with structured experience data
              </p>

              <div className="sections-grid">
                {sections.map(sec => (
                  <div key={sec.id}>
                    <div className="section-card">
                      <div className="section-icon">{sec.icon}</div>
                      <div className="section-info">
                        <h3>{sec.title.toUpperCase()}</h3>
                        <p>{sec.description}</p>
                      </div>
                      <button className="btn-add" onClick={() => setActiveModal(sec.id)}>+ ADD_ENTRY</button>
                    </div>
                    
                    {/* Simplified Display of Added Items */}
                    <div style={{ paddingLeft: '20px', marginTop: '10px' }}>
                      {sec.id === 'experience' && experiences.map(exp => (
                        <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', marginBottom: '5px', borderLeft: '2px solid #10b981' }}>
                          <div>
                            <div style={{fontSize: '0.85rem', fontWeight: 800}}>{exp.title}</div>
                            <div style={{fontSize: '0.7rem', color: 'var(--tech-text-dim)'}}>{exp.company}</div>
                          </div>
                          <button style={{background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 800}} onClick={() => {
                            const updated = experiences.filter(e => e.id !== exp.id);
                            setExperiences(updated);
                            localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), experiences: updated }));
                          }}>DELETE</button>
                        </div>
                      ))}
                      {sec.id === 'education' && educations.map(edu => (
                        <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', marginBottom: '5px', borderLeft: '2px solid #fbbf24' }}>
                          <div>
                            <div style={{fontSize: '0.85rem', fontWeight: 800}}>{edu.school}</div>
                            <div style={{fontSize: '0.7rem', color: 'var(--tech-text-dim)'}}>{edu.degree}</div>
                          </div>
                          <button style={{background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 800}} onClick={() => {
                            const updated = educations.filter(e => e.id !== edu.id);
                            setEducations(updated);
                            localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), educations: updated }));
                          }}>DELETE</button>
                        </div>
                      ))}
                      {sec.id === 'skills' && skills.map(skill => (
                        <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', marginBottom: '5px', borderLeft: '2px solid var(--tech-accent-gold)' }}>
                          <div>
                            <div style={{fontSize: '0.85rem', fontWeight: 800}}>{skill.name}</div>
                            <div style={{fontSize: '0.7rem', color: 'var(--tech-text-dim)'}}>{skill.level}</div>
                          </div>
                          <button style={{background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 800}} onClick={() => {
                            const updated = skills.filter(s => s.id !== skill.id);
                            setSkills(updated);
                            localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), skills: updated }));
                          }}>DELETE</button>
                        </div>
                      ))}
                      {sec.id === 'certifications' && certifications.map(cert => (
                        <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', marginBottom: '5px', borderLeft: '2px solid #a855f7' }}>
                          <div>
                            <div style={{fontSize: '0.85rem', fontWeight: 800}}>{cert.name}</div>
                            <div style={{fontSize: '0.7rem', color: 'var(--tech-text-dim)'}}>{cert.organization}</div>
                          </div>
                          <button style={{background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 800}} onClick={() => {
                            const updated = certifications.filter(c => c.id !== cert.id);
                            setCertifications(updated);
                            localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), certifications: updated }));
                          }}>DELETE</button>
                        </div>
                      ))}
                      {sec.id === 'languages' && languages.map(lang => (
                        <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', marginBottom: '5px', borderLeft: '2px solid #f43f5e' }}>
                          <div>
                            <div style={{fontSize: '0.85rem', fontWeight: 800}}>{lang.name}</div>
                            <div style={{fontSize: '0.7rem', color: 'var(--tech-text-dim)'}}>{lang.proficiency}</div>
                          </div>
                          <button style={{background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 800}} onClick={() => {
                            const updated = languages.filter(l => l.id !== lang.id);
                            setLanguages(updated);
                            localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), languages: updated }));
                          }}>DELETE</button>
                        </div>
                      ))}
                      {sec.id === 'projects' && projects.map(proj => (
                        <div key={proj.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', marginBottom: '5px', borderLeft: '2px solid #10b981' }}>
                          <div>
                            <div style={{fontSize: '0.85rem', fontWeight: 800}}>{proj.name}</div>
                            <div style={{fontSize: '0.7rem', color: 'var(--tech-text-dim)'}}>{proj.startDate} - {proj.current ? 'Present' : proj.endDate}</div>
                          </div>
                          <button style={{background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 800}} onClick={() => {
                            const updated = projects.filter(p => p.id !== proj.id);
                            setProjects(updated);
                            localStorage.setItem(PROFILE_SECTIONS_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROFILE_SECTIONS_KEY) || '{}'), projects: updated }));
                          }}>DELETE</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="modal-content tech-modal" onClick={(e) => e.stopPropagation()} style={{ 
            background: '#0a0a0c', 
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 50px rgba(0,0,0,1), inset 0 0 20px rgba(59, 130, 246, 0.1)',
            padding: '40px',
            maxWidth: '600px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Grid Background Effect */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '24px 24px', pointerEvents: 'none', zIndex: 0 }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ 
                fontFamily: '"JetBrains Mono", monospace', 
                fontSize: '1.5rem', 
                marginBottom: '30px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <span style={{ color: 'var(--tech-blue)' }}>//</span> ADD_{activeModal.toUpperCase()}
              </h2>
              
              <div className="tech-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activeModal === 'experience' && (
                  <>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Position / Title</label>
                      <input type="text" className="tech-input" value={experienceForm.title || ''} onChange={(e) => setExperienceForm({...experienceForm, title: e.target.value})} placeholder="e.g. SYSTEMS_ARCHITECT" />
                    </div>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Organization</label>
                      <input type="text" className="tech-input" value={experienceForm.company || ''} onChange={(e) => setExperienceForm({...experienceForm, company: e.target.value})} placeholder="e.g. GLOBAL_TECH_CORP" />
                    </div>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Start Date</label>
                        <input type="month" className="tech-input" value={experienceForm.startDate || ''} onChange={(e) => setExperienceForm({...experienceForm, startDate: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>End Date</label>
                        <input type="month" className="tech-input" value={experienceForm.endDate || ''} onChange={(e) => setExperienceForm({...experienceForm, endDate: e.target.value})} disabled={experienceForm.current} />
                      </div>
                    </div>
                  </>
                )}

                {activeModal === 'education' && (
                  <>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Institution</label>
                      <input type="text" className="tech-input" value={educationForm.school || ''} onChange={(e) => setEducationForm({...educationForm, school: e.target.value})} placeholder="e.g. MIT_INSTITUTE" />
                    </div>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Degree / Field</label>
                      <input type="text" className="tech-input" value={educationForm.degree || ''} onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})} placeholder="e.g. MS_COMPUTER_SCIENCE" />
                    </div>
                  </>
                )}

                {activeModal === 'skills' && (
                  <>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Skill Identifier</label>
                      <input type="text" className="tech-input" value={skillForm.name || ''} onChange={(e) => setSkillForm({...skillForm, name: e.target.value})} placeholder="e.g. QUANTUM_COMPUTING" />
                    </div>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Proficiency level</label>
                      <select className="tech-input" value={skillForm.level || 'Intermediate'} onChange={(e) => setSkillForm({...skillForm, level: e.target.value as any})}>
                        <option value="Beginner">L1_BEGINNER</option>
                        <option value="Intermediate">L2_INTERMEDIATE</option>
                        <option value="Advanced">L3_ADVANCED</option>
                        <option value="Expert">L4_EXPERT</option>
                      </select>
                    </div>
                  </>
                )}

                {activeModal === 'certifications' && (
                  <>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Certificate name</label>
                      <input type="text" className="tech-input" value={certificationForm.name || ''} onChange={(e) => setCertificationForm({...certificationForm, name: e.target.value})} placeholder="e.g. AWS_ARCHITECT" />
                    </div>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Authority</label>
                      <input type="text" className="tech-input" value={certificationForm.organization || ''} onChange={(e) => setCertificationForm({...certificationForm, organization: e.target.value})} placeholder="e.g. AMAZON_WEB_SERVICES" />
                    </div>
                  </>
                )}

                {activeModal === 'languages' && (
                  <>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Language</label>
                      <input type="text" className="tech-input" value={languageForm.name || ''} onChange={(e) => setLanguageForm({...languageForm, name: e.target.value})} placeholder="e.g. ENGLISH" />
                    </div>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Mastery level</label>
                      <select className="tech-input" value={languageForm.proficiency || 'Professional Working'} onChange={(e) => setLanguageForm({...languageForm, proficiency: e.target.value as any})}>
                        <option value="Elementary">L1_ELEMENTARY</option>
                        <option value="Limited Working">L2_LIMITED</option>
                        <option value="Professional Working">L3_PROFESSIONAL</option>
                        <option value="Full Professional">L4_FLUENT</option>
                        <option value="Native">L5_NATIVE</option>
                      </select>
                    </div>
                  </>
                )}

                {activeModal === 'projects' && (
                  <>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Project identifier</label>
                      <input type="text" className="tech-input" value={projectForm.name || ''} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} placeholder="e.g. PROJECT_NEBULA" />
                    </div>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Description</label>
                      <textarea className="tech-input" value={projectForm.description || ''} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} rows={3} placeholder="System architecture summary..." />
                    </div>
                  </>
                )}

                {activeModal === 'customUrl' && (
                  <>
                    <div className="form-group">
                      <label style={{ color: 'var(--tech-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Custom identifier</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: 'var(--tech-text-dim)', fontSize: '0.8rem' }}>ornave.com/in/</span>
                        <input type="text" className="tech-input" value={customUrl} onChange={(e) => setCustomUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="your-name" style={{ flex: 1 }} />
                      </div>
                    </div>
                  </>
                )}

                {activeModal === 'featured' && <p style={{ color: 'var(--tech-text-dim)', fontSize: '0.9rem' }}>This experimental module is currently under development.</p>}
                {activeModal === 'badges' && <p style={{ color: 'var(--tech-text-dim)', fontSize: '0.9rem' }}>Complete professional milestones to unlock system authentication badges.</p>}

                <div className="modal-actions" style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button className="btn-secondary" style={{ flex: 1, height: '45px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.7rem', fontWeight: 800 }} onClick={() => setActiveModal(null)}>ABORT</button>
                  <button className="btn-primary" style={{ flex: 2, height: '45px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.7rem', fontWeight: 800 }} onClick={() => {
                    if (activeModal === 'experience') handleAddExperience();
                    else if (activeModal === 'education') handleAddEducation();
                    else if (activeModal === 'skills') handleAddSkill();
                    else if (activeModal === 'certifications') handleAddCertification();
                    else if (activeModal === 'languages') handleAddLanguage();
                    else if (activeModal === 'projects') handleAddProject();
                    else if (activeModal === 'customUrl') { handleCustomUrlSave(); setActiveModal(null); }
                    else setActiveModal(null);
                  }}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
