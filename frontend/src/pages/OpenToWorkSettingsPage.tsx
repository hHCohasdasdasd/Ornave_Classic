import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/ui/Navbar';
import './OpenToWorkSettingsPage.css';

export const OpenToWorkSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    jobTitles: ['Manager', 'Team Manager', 'Senior Manager'],
    locationTypes: ['remote', 'hybrid'],
    jobTypes: ['full-time', 'contract'],
    startDate: 'immediately',
    visibility: 'recruiters',
  });

  const [newJobTitle, setNewJobTitle] = useState('');

  const locationOptions = [
    { id: 'onsite', label: 'On-site' },
    { id: 'remote', label: 'Remote' },
    { id: 'hybrid', label: 'Hybrid' },
  ];

  const jobTypeOptions = [
    { id: 'full-time', label: 'Full-time' },
    { id: 'part-time', label: 'Part-time' },
    { id: 'contract', label: 'Contract' },
    { id: 'temporary', label: 'Temporary' },
    { id: 'internship', label: 'Internship' },
  ];

  const startDateOptions = [
    { id: 'immediately', label: 'Immediately' },
    { id: '1-month', label: 'Within 1 month' },
    { id: '2-months', label: 'Within 2 months' },
    { id: 'flexible', label: 'Flexible' },
  ];

  const visibilityOptions = [
    { id: 'all', label: 'All Ornave members', description: 'Your availability status will be visible to everyone' },
    { id: 'recruiters', label: 'Recruiters only', description: 'Only recruiters using Ornave Talent will see this' },
  ];

  const handleAddJobTitle = () => {
    if (newJobTitle.trim() && !settings.jobTitles.includes(newJobTitle.trim())) {
      setSettings(prev => ({
        ...prev,
        jobTitles: [...prev.jobTitles, newJobTitle.trim()]
      }));
      setNewJobTitle('');
    }
  };

  const handleRemoveJobTitle = (title: string) => {
    setSettings(prev => ({
      ...prev,
      jobTitles: prev.jobTitles.filter(t => t !== title)
    }));
  };

  const handleToggleLocation = (locationId: string) => {
    setSettings(prev => ({
      ...prev,
      locationTypes: prev.locationTypes.includes(locationId)
        ? prev.locationTypes.filter(l => l !== locationId)
        : [...prev.locationTypes, locationId]
    }));
  };

  const handleToggleJobType = (typeId: string) => {
    setSettings(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(typeId)
        ? prev.jobTypes.filter(t => t !== typeId)
        : [...prev.jobTypes, typeId]
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    navigate('/profile/edit?tab=sections');
  };

  return (
    <div className="open-to-work-page">
      <Navbar />
      
      <div className="open-to-work-container">
        <div className="open-to-work-header">
          <button className="back-btn" onClick={() => navigate('/profile/edit?tab=sections')}>
            ← Back to Profile
          </button>
          <h1>Availability Settings</h1>
          <p className="page-subtitle">
            Let recruiters know you're open to opportunities. Your settings are only visible to recruiters unless you choose otherwise.
          </p>
        </div>

        <div className="settings-content">
          {/* Job Titles */}
          <div className="settings-section">
            <h2>Job Titles</h2>
            <p className="section-description">
              Add up to 5 job titles you're interested in
            </p>
            
            <div className="job-titles-input">
              <input
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddJobTitle()}
                placeholder="e.g. Product Manager"
                maxLength={50}
              />
              <button onClick={handleAddJobTitle} className="add-btn">Add</button>
            </div>

            <div className="job-titles-list">
              {settings.jobTitles.map((title, idx) => (
                <div key={idx} className="job-title-chip">
                  <span>{title}</span>
                  <button onClick={() => handleRemoveJobTitle(title)}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Location Types */}
          <div className="settings-section">
            <h2>Location Types</h2>
            <p className="section-description">
              Select all that apply
            </p>
            
            <div className="options-grid">
              {locationOptions.map(option => (
                <label key={option.id} className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={settings.locationTypes.includes(option.id)}
                    onChange={() => handleToggleLocation(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Job Types */}
          <div className="settings-section">
            <h2>Job Types</h2>
            <p className="section-description">
              Select all that apply
            </p>
            
            <div className="options-grid">
              {jobTypeOptions.map(option => (
                <label key={option.id} className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={settings.jobTypes.includes(option.id)}
                    onChange={() => handleToggleJobType(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div className="settings-section">
            <h2>When Can You Start?</h2>
            <p className="section-description">
              Help recruiters understand your availability
            </p>
            
            <div className="radio-options">
              {startDateOptions.map(option => (
                <label key={option.id} className="radio-card">
                  <input
                    type="radio"
                    name="startDate"
                    value={option.id}
                    checked={settings.startDate === option.id}
                    onChange={(e) => setSettings(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="settings-section">
            <h2>Who Can See You're Open to Work?</h2>
            
            <div className="radio-options">
              {visibilityOptions.map(option => (
                <label key={option.id} className="radio-card radio-card--large">
                  <input
                    type="radio"
                    name="visibility"
                    value={option.id}
                    checked={settings.visibility === option.id}
                    onChange={(e) => setSettings(prev => ({ ...prev, visibility: e.target.value }))}
                  />
                  <div>
                    <div className="radio-label">{option.label}</div>
                    <div className="radio-description">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="settings-actions">
            <button className="btn-secondary" onClick={() => navigate('/profile/edit?tab=sections')}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
