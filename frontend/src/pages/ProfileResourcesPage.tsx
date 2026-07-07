import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/ui/Navbar';
import './ProfileResourcesPage.css';

export const ProfileResourcesPage: React.FC = () => {
  const navigate = useNavigate();

  const resources = [
    {
      category: 'Career Development',
      items: [
        { icon: '📚', title: 'Resume Builder', description: 'Create a professional resume in minutes', link: '#' },
        { icon: '🎯', title: 'Career Coaching', description: 'Get personalized career guidance', link: '#' },
        { icon: '💼', title: 'Interview Prep', description: 'Prepare for your next interview', link: '#' },
        { icon: '📊', title: 'Salary Insights', description: 'Compare salaries for your role', link: '#' },
      ]
    },
    {
      category: 'Learning & Skills',
      items: [
        { icon: '🎓', title: 'Online Courses', description: 'Learn new skills with expert-led courses', link: '#' },
        { icon: '📖', title: 'Industry Reports', description: 'Stay updated with latest trends', link: '#' },
        { icon: '🏆', title: 'Certifications', description: 'Earn professional certifications', link: '#' },
        { icon: '💡', title: 'Skill Assessments', description: 'Test and validate your skills', link: '#' },
      ]
    },
    {
      category: 'Networking',
      items: [
        { icon: '👥', title: 'Events', description: 'Attend virtual and in-person events', link: '#' },
        { icon: '🎤', title: 'Webinars', description: 'Join live discussions with experts', link: '#' },
        { icon: '🤝', title: 'Mentorship', description: 'Connect with mentors in your field', link: '#' },
        { icon: '💬', title: 'Groups', description: 'Join professional communities', link: '#' },
      ]
    },
    {
      category: 'Business Tools',
      items: [
        { icon: '📈', title: 'Analytics Dashboard', description: 'Track your profile performance', link: '#' },
        { icon: '🔍', title: 'Talent Search', description: 'Find and recruit top talent', link: '#' },
        { icon: '📢', title: 'Marketing Tools', description: 'Promote your business effectively', link: '#' },
        { icon: '💰', title: 'Premium Features', description: 'Unlock advanced capabilities', link: '#' },
      ]
    }
  ];

  return (
    <div className="resources-page">
      <Navbar />
      
      <div className="resources-container">
        <div className="resources-header">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ← Back to Profile
          </button>
          <h1>Profile Resources</h1>
          <p className="resources-subtitle">
            Explore tools and resources to enhance your professional journey
          </p>
        </div>

        <div className="resources-content">
          {resources.map((category, idx) => (
            <div key={idx} className="resource-category">
              <h2 className="category-title">{category.category}</h2>
              <div className="resource-grid">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="resource-card">
                    <div className="resource-icon">{item.icon}</div>
                    <h3 className="resource-title">{item.title}</h3>
                    <p className="resource-description">{item.description}</p>
                    <button className="resource-btn">Explore</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="resources-footer">
          <div className="cta-card">
            <h3>Need More Help?</h3>
            <p>Contact our support team or visit our help center for additional assistance</p>
            <div className="cta-actions">
              <button className="btn-outline">Help Center</button>
              <button className="btn-primary">Contact Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
