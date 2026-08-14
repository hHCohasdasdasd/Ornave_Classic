import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { jobService } from '@/services/jobService';
import './JobsPage.css';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary';
  workType: 'On-site' | 'Remote' | 'Hybrid';
  description: string;
  promoted: boolean;
  applicants: number;
  posted: string;
  salary?: string;
}

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState<string>('1');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  
  // Filter states
  const [datePosted, setDatePosted] = useState<string>('any');
  const [experienceLevel, setExperienceLevel] = useState<string>('any');
  const [company, setCompany] = useState<string>('');
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [remote, setRemote] = useState<string>('any');
  const [easyApplyOnly, setEasyApplyOnly] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadJobsData();
  }, [user, navigate]);

  const loadJobsData = async () => {
    try {
      const networkJobs = await jobService.listAllActiveJobs();
      const mapped: Job[] = networkJobs
        .filter(job => job.isActive)
        .map(job => ({
          id: job.id,
          title: job.title,
          company: job.company?.name || 'Unknown company',
          location: job.location || 'Not specified',
          jobType: (job.type as Job['jobType']) || 'Full-time',
          workType: 'On-site',
          description: job.description || '',
          promoted: false,
          applicants: 0,
          posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '',
          salary: job.salaryMin && job.salaryMax
            ? `${job.salaryCurrency} ${job.salaryMin} - ${job.salaryMax} / ${job.salaryPeriod}`
            : undefined,
        }));
      setJobs(mapped);
      setSelectedJobId(mapped[0]?.id || '');
    } catch (err) {
      console.error('Failed to load jobs data:', err);
      setJobs([]);
      setSelectedJobId('');
    }
  };

  const selectedJob = jobs.find(job => job.id === selectedJobId);
  const filteredJobs = jobs.filter(job => {
    if (company) {
      const q = company.toLowerCase();
      if (!job.title.toLowerCase().includes(q) && !job.company.toLowerCase().includes(q)) return false;
    }
    if (locationQuery && !job.location.toLowerCase().includes(locationQuery.toLowerCase())) return false;
    if (remote !== 'any' && job.workType !== remote) return false;
    return true;
  });

  const handleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const updated = new Set(prev);
      if (updated.has(jobId)) {
        updated.delete(jobId);
      } else {
        updated.add(jobId);
      }
      return updated;
    });
  };

  const handleApplyJob = (jobId: string) => {
    // Handle job application
    alert(`Applied to job ${jobId}!`);
  };

  return (
    <>
      <Navbar />
      <div className="jobs-page">
        <div className="jobs-page__search-banner">
          <div className="jobs-page__search-container">
            <div className="jobs-search">
              <div className="jobs-search__field">
                <input
                  type="text"
                  placeholder="Title, skill or company"
                  className="jobs-search__input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="jobs-search__field">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#a79e8c">
                  <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 13c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm3-9H8V5h3v1z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Location"
                  className="jobs-search__input"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <button className="jobs-search__btn">Search</button>
            </div>
          </div>
        </div>

        <div className="jobs-page__container">
          {/* Filters Sidebar */}
          <aside className="jobs-filters">
            <div className="filters-section">
              <h3 className="filters-section__title">Date posted</h3>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="datePosted" 
                  value="any"
                  checked={datePosted === 'any'}
                  onChange={(e) => setDatePosted(e.target.value)}
                />
                <span>Any time</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="datePosted" 
                  value="24h"
                  checked={datePosted === '24h'}
                  onChange={(e) => setDatePosted(e.target.value)}
                />
                <span>Last 24 hours</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="datePosted" 
                  value="week"
                  checked={datePosted === 'week'}
                  onChange={(e) => setDatePosted(e.target.value)}
                />
                <span>Last week</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="datePosted" 
                  value="month"
                  checked={datePosted === 'month'}
                  onChange={(e) => setDatePosted(e.target.value)}
                />
                <span>Last month</span>
              </label>
            </div>

            <div className="filters-section">
              <h3 className="filters-section__title">Experience level</h3>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="experienceLevel" 
                  value="any"
                  checked={experienceLevel === 'any'}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                />
                <span>Any level</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="experienceLevel" 
                  value="entry"
                  checked={experienceLevel === 'entry'}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                />
                <span>Entry level</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="experienceLevel" 
                  value="mid"
                  checked={experienceLevel === 'mid'}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                />
                <span>Mid-level</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="experienceLevel" 
                  value="senior"
                  checked={experienceLevel === 'senior'}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                />
                <span>Senior level</span>
              </label>
            </div>

            <div className="filters-section">
              <h3 className="filters-section__title">Work type</h3>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="remote" 
                  value="any"
                  checked={remote === 'any'}
                  onChange={(e) => setRemote(e.target.value)}
                />
                <span>Any</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="remote" 
                  value="On-site"
                  checked={remote === 'On-site'}
                  onChange={(e) => setRemote(e.target.value)}
                />
                <span>On-site</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="remote" 
                  value="Remote"
                  checked={remote === 'Remote'}
                  onChange={(e) => setRemote(e.target.value)}
                />
                <span>Remote</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="radio" 
                  name="remote" 
                  value="Hybrid"
                  checked={remote === 'Hybrid'}
                  onChange={(e) => setRemote(e.target.value)}
                />
                <span>Hybrid</span>
              </label>
            </div>

            <div className="filters-section">
              <label className="filter-checkbox filter-checkbox--large">
                <input 
                  type="checkbox"
                  checked={easyApplyOnly}
                  onChange={(e) => setEasyApplyOnly(e.target.checked)}
                />
                <span>Easy Apply</span>
              </label>
            </div>
          </aside>

          {/* Jobs List */}
          <div className="jobs-list">
            <div className="jobs-list__header">
              <h2>Job Openings</h2>
              <p className="jobs-list__count">{filteredJobs.length} result{filteredJobs.length === 1 ? '' : 's'}</p>
            </div>

            <div className="jobs-items">
              {filteredJobs.length === 0 && (
                <p className="jobs-list__empty">
                  {jobs.length === 0 ? 'No job openings posted yet.' : 'No jobs match your filters.'}
                </p>
              )}
              {filteredJobs.map(job => (
                <div
                  key={job.id}
                  className={`job-item ${selectedJobId === job.id ? 'job-item--active' : ''}`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  {job.promoted && <div className="job-item__promoted">Promoted</div>}
                  
                  <div className="job-item__header">
                    <div className="job-item__title-section">
                      <h3 className="job-item__title">{job.title}</h3>
                      <p className="job-item__company">{job.company}</p>
                      <p className="job-item__location">{job.location}</p>
                    </div>
                    <button
                      className={`job-item__close ${savedJobs.has(job.id) ? 'job-item__close--saved' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveJob(job.id);
                      }}
                      title={savedJobs.has(job.id) ? 'Remove saved' : 'Save job'}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="job-item__meta">
                    <span className="job-meta">{job.jobType}</span>
                    <span className="job-meta">{job.workType}</span>
                  </div>

                  <div className="job-item__footer">
                    <p className="job-item__stats">{job.applicants} people clicked apply</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Details Panel */}
          {selectedJob && (
            <aside className="job-details">
              <div className="job-details__header">
                <div className="job-company-info">
                  <div className="job-company-logo">
                    {selectedJob.company.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div className="job-company-text">
                    <h2 className="job-company-name">{selectedJob.company}</h2>
                    <a href="#" className="job-company-link">View company</a>
                  </div>
                </div>
                <button className="job-details__more">⋯</button>
              </div>

              <h1 className="job-details__title">{selectedJob.title}</h1>

              <div className="job-details__meta">
                <div className="job-meta-item">
                  <span className="job-meta-label">Location:</span>
                  <span>{selectedJob.location}</span>
                </div>
                <div className="job-meta-item">
                  <span className="job-meta-label">Type:</span>
                  <span>
                    <span className="job-badge">{selectedJob.jobType}</span>
                    {selectedJob.workType && <span className="job-badge">{selectedJob.workType}</span>}
                  </span>
                </div>
              </div>

              <div className="job-details__stats">
                <p>📊 {selectedJob.applicants} people clicked apply</p>
                {selectedJob.promoted && <p>🚀 Promoted by hirer • Responses managed off LinkedIn</p>}
              </div>

              <div className="job-details__actions">
                <button 
                  className="btn-apply"
                  onClick={() => handleApplyJob(selectedJob.id)}
                >
                  Apply
                </button>
                <button 
                  className={`btn-save ${savedJobs.has(selectedJob.id) ? 'btn-save--saved' : ''}`}
                  onClick={() => handleSaveJob(selectedJob.id)}
                >
                  {savedJobs.has(selectedJob.id) ? '✓ Saved' : 'Save'}
                </button>
              </div>

              <div className="job-details__description">
                <h3>About the job</h3>
                <p>{selectedJob.description}</p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
};
