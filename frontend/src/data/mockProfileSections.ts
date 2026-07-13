// Rich "resume" sections (Experience / Education / Skills / Certifications /
// Languages) for the people who appear throughout the app's feed, suggestions,
// and network pages. There's no backend model for this yet (see
// backend/src/scripts/seedNetwork.ts for the real headline/bio/avatar data
// these people have in the database) — this is purely frontend enrichment so
// their profile pages feel complete rather than empty, keyed by the same
// "firstname-lastname" slug used everywhere else in the app.

export interface MockExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface MockEducation {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export interface MockSkill {
  id: string;
  name: string;
  level?: string;
  endorsements?: number;
}

export interface MockHighlight {
  value: string;
  label: string;
}

export interface MockCertification {
  id: string;
  name: string;
  organization: string;
  issueDate?: string;
  credentialId?: string;
}

export interface MockLanguage {
  id: string;
  name: string;
  proficiency?: string;
}

export interface MockRecommendation {
  id: string;
  author: string;
  authorHeadline: string;
  authorAvatar?: string;
  content: string;
  date: string;
}

export interface MockPortfolioItem {
  id: string;
  image: string;
  title: string;
  location?: string;
  year?: string;
}

export interface MockProfileSections {
  experiences: MockExperience[];
  educations: MockEducation[];
  skills: MockSkill[];
  certifications?: MockCertification[];
  languages?: MockLanguage[];
  highlights?: MockHighlight[];
  focusAreas?: string[];
  recommendations?: MockRecommendation[];
  portfolio?: MockPortfolioItem[];
}

export const mockProfileSections: Record<string, MockProfileSections> = {
  'chuck-hartwig': {
    highlights: [
      { value: '20+', label: 'Years in Enterprise Tech' },
      { value: '150+', label: 'Engineers Led' },
      { value: '$10M+', label: 'Cloud Migration Savings' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=450&fit=crop', title: 'Nexus Flow Cloud Migration', location: 'Berlin, Germany', year: '2023' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: 'Global Logistics Tech Platform Rebuild', location: 'London, UK', year: '2019' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=450&fit=crop', title: 'Zero-Trust Security Rollout', location: 'Berlin, Germany', year: '2021' },
    ],
    focusAreas: ['Enterprise Architecture', 'AI Strategy', 'Cloud Infrastructure', 'Distributed Systems'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'David Kim',
        authorHeadline: 'Software Architect · Cloud Infrastructure',
        authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
        content: "Chuck is the rare CTO who can still read a stack trace at 2am and still hold a boardroom's attention the next morning. The migration plan he designed saved us millions and several very bad weekends.",
        date: 'Apr 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Chief Technology Officer',
        company: 'Nexus Flow Systems',
        location: 'Berlin, Germany',
        startDate: '2020-01',
        current: true,
        description: 'Leading the technical vision and engineering strategy for an enterprise-grade supply chain orchestration platform.',
      },
      {
        id: 'exp-2',
        title: 'VP of Engineering',
        company: 'Global Logistic Tech',
        location: 'London, UK',
        startDate: '2015-06',
        endDate: '2019-12',
        description: 'Scaled the engineering team from 20 to 150+ developers and migrated legacy infrastructure to a cloud-native microservices architecture.',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Technical University of Munich',
        degree: 'Master of Science',
        field: 'Computer Science & AI',
        startDate: '2005-09',
        endDate: '2007-06',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Enterprise Architecture', level: 'Expert' },
      { id: 'skill-2', name: 'Artificial Intelligence', level: 'Expert' },
      { id: 'skill-3', name: 'Distributed Systems', level: 'Expert' },
      { id: 'skill-4', name: 'Cloud Strategy', level: 'Expert' },
      { id: 'skill-5', name: 'Product Engineering', level: 'Advanced' },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect – Professional',
        organization: 'Amazon Web Services',
        issueDate: '2021-03',
      },
    ],
    languages: [
      { id: 'lang-1', name: 'English', proficiency: 'Native' },
      { id: 'lang-2', name: 'German', proficiency: 'Full Professional' },
    ],
  },

  'alex-rivera': {
    highlights: [
      { value: '40%', label: 'Delay Reduction Achieved' },
      { value: '14', label: 'Years in Global Operations' },
      { value: '$200M', label: 'Annual Freight Managed' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=600&h=450&fit=crop', title: 'Fortune 500 Supply Chain Audit', location: 'Chicago, IL', year: '2025' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&h=450&fit=crop', title: 'Nearshoring Strategy for 3 Manufacturers', location: 'Monterrey, Mexico', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: 'Supplier Scorecard Program', location: 'Chicago, IL', year: '2023' },
    ],
    focusAreas: ['Supply Chain Strategy', 'Supplier Risk', 'Nearshoring', 'Sustainability'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Omar Hassan',
        authorHeadline: 'Global Trade & Logistics Director',
        authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
        content: "Alex has the sharpest eye for supplier risk I've worked with. He flagged a customs bottleneck in our EMEA lane three months before it became a crisis for everyone else.",
        date: 'Mar 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Senior Supply Chain Consultant',
        company: 'Rivera Consulting',
        location: 'Chicago, Illinois',
        startDate: '2019-03',
        current: true,
        description: 'Independent consulting practice helping Fortune 500 manufacturers redesign supplier networks for resilience and sustainability. Led audits that reduced client shipment delays by up to 40%.',
      },
      {
        id: 'exp-2',
        title: 'Director of Global Operations',
        company: 'Meridian Freight Group',
        location: 'Chicago, Illinois',
        startDate: '2013-05',
        endDate: '2019-02',
        description: 'Owned end-to-end logistics operations across North America and EMEA, managing a $200M annual freight budget and a team of 45.',
      },
      {
        id: 'exp-3',
        title: 'Operations Analyst',
        company: 'Kestrel Logistics',
        location: 'Detroit, Michigan',
        startDate: '2010-08',
        endDate: '2013-04',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'University of Michigan, Ross School of Business',
        degree: 'MBA',
        field: 'Operations Management',
        startDate: '2008-09',
        endDate: '2010-06',
      },
      {
        id: 'edu-2',
        school: 'Purdue University',
        degree: 'Bachelor of Science',
        field: 'Industrial Engineering',
        startDate: '2004-09',
        endDate: '2008-05',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Supply Chain Strategy', level: 'Expert' },
      { id: 'skill-2', name: 'Supplier Risk Management', level: 'Expert' },
      { id: 'skill-3', name: 'Logistics Optimization', level: 'Expert' },
      { id: 'skill-4', name: 'Nearshoring Strategy', level: 'Advanced' },
      { id: 'skill-5', name: 'Sustainable Operations', level: 'Advanced' },
      { id: 'skill-6', name: 'Vendor Negotiation', level: 'Expert' },
    ],
    certifications: [
      { id: 'cert-1', name: 'Certified Supply Chain Professional (CSCP)', organization: 'APICS', issueDate: '2014-05' },
      { id: 'cert-2', name: 'Lean Six Sigma Black Belt', organization: 'ASQ', issueDate: '2012-11' },
    ],
    languages: [
      { id: 'lang-1', name: 'English', proficiency: 'Native' },
      { id: 'lang-2', name: 'Spanish', proficiency: 'Professional Working' },
    ],
  },

  'sarah-chen': {
    highlights: [
      { value: '91%', label: 'Feature Adoption (from 23%)' },
      { value: '10+', label: 'Years in Product Design' },
      { value: '12', label: 'Countries Shipped To' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=450&fit=crop', title: 'Robotics Monitoring Dashboard Redesign', location: 'San Francisco, CA', year: '2025' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=450&fit=crop', title: 'Factory-Floor Onboarding Flow', location: 'San Francisco, CA', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&h=450&fit=crop', title: 'Industrial Design System v2', location: 'San Francisco, CA', year: '2023' },
    ],
    focusAreas: ['Industrial UX', 'Design Systems', 'User Research'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'James Okafor',
        authorHeadline: 'CTO & Co-founder · Building the future of fintech',
        authorAvatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&h=200&fit=crop&crop=face',
        content: "Sarah redesigned our onboarding flow for markets where most users had never used a banking app before. Activation went up 3x. She designs for the user in front of her, not the user in the persona deck.",
        date: 'Feb 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Product Designer · UX Lead',
        company: 'NovaTech Robotics',
        location: 'San Francisco, California',
        startDate: '2021-02',
        current: true,
        description: 'Leading design for industrial robotics monitoring and control interfaces used on factory floors across 12 countries. Grew feature adoption from 23% to 91% by redesigning around physical operator gestures.',
      },
      {
        id: 'exp-2',
        title: 'Senior Product Designer',
        company: 'Fjord (Accenture Interactive)',
        location: 'San Francisco, California',
        startDate: '2018-01',
        endDate: '2021-01',
        description: 'Designed enterprise SaaS products for manufacturing and logistics clients, from discovery research through shipped UI.',
      },
      {
        id: 'exp-3',
        title: 'UX Designer',
        company: 'Asana',
        location: 'San Francisco, California',
        startDate: '2015-07',
        endDate: '2017-12',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'California College of the Arts',
        degree: 'Bachelor of Fine Arts',
        field: 'Interaction Design',
        startDate: '2011-09',
        endDate: '2015-05',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Industrial UX', level: 'Expert' },
      { id: 'skill-2', name: 'Design Systems', level: 'Expert' },
      { id: 'skill-3', name: 'User Research', level: 'Expert' },
      { id: 'skill-4', name: 'Interaction Design', level: 'Expert' },
      { id: 'skill-5', name: 'Figma', level: 'Expert' },
      { id: 'skill-6', name: 'Accessibility (WCAG)', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'English', proficiency: 'Native' },
      { id: 'lang-2', name: 'Mandarin', proficiency: 'Native' },
    ],
  },

  'marcus-thorn': {
    highlights: [
      { value: '6', label: 'Production Sites Overseen' },
      { value: '15', label: 'Years on Factory Floors' },
      { value: '30+', label: 'Roles Redesigned' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&h=450&fit=crop', title: 'Cobot Cell Rollout, 3 Plants', location: 'Berlin, Germany', year: '2025' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=450&fit=crop', title: 'Collaborative Automation Program', location: 'Stuttgart, Germany', year: '2023' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: 'Digital Transformation Roadmap', location: 'Berlin, Germany', year: '2021' },
    ],
    focusAreas: ['Digital Transformation', 'Industry 4.0', 'Change Management'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Yuki Tanaka',
        authorHeadline: 'Robotics Engineer · Automation Specialist',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
        content: "Marcus is the reason our cobot rollout didn't become another failed pilot. He understood that the hardest part of automation isn't the robots, it's the people deciding whether to trust them.",
        date: 'Jan 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'VP of Operations',
        company: 'NovaTech Robotics',
        location: 'Berlin, Germany',
        startDate: '2020-09',
        current: true,
        description: 'Own manufacturing operations strategy and Industry 4.0 rollout across 6 production sites. Championed a collaborative-automation model that redesigned 30+ factory floor roles.',
      },
      {
        id: 'exp-2',
        title: 'Associate Partner',
        company: 'McKinsey & Company',
        location: 'Munich, Germany',
        startDate: '2014-08',
        endDate: '2020-08',
        description: 'Advised industrial and automotive clients on operations strategy and digital transformation programs across Europe.',
      },
      {
        id: 'exp-3',
        title: 'Plant Manager',
        company: 'Siemens AG',
        location: 'Nuremberg, Germany',
        startDate: '2009-04',
        endDate: '2012-07',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'WHU – Otto Beisheim School of Management',
        degree: 'MBA',
        startDate: '2012-09',
        endDate: '2014-06',
      },
      {
        id: 'edu-2',
        school: 'RWTH Aachen University',
        degree: 'Diplom-Ingenieur',
        field: 'Mechanical Engineering',
        startDate: '2003-10',
        endDate: '2009-03',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Digital Transformation', level: 'Expert' },
      { id: 'skill-2', name: 'Manufacturing Strategy', level: 'Expert' },
      { id: 'skill-3', name: 'Industry 4.0', level: 'Expert' },
      { id: 'skill-4', name: 'Change Management', level: 'Expert' },
      { id: 'skill-5', name: 'Lean Manufacturing', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'German', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
    ],
  },

  'elena-rodriguez': {
    highlights: [
      { value: '280 MW', label: 'Solar Capacity Added (2026)' },
      { value: '120K', label: 'Tonnes CO₂ Offset Annually' },
      { value: '12', label: 'Years in Climate Policy' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=450&fit=crop', title: '40th Solar Installation, 280 MW Added', location: 'Valencia, Spain', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&h=450&fit=crop', title: 'European Clean Energy Forum Keynote', location: 'Berlin, Germany', year: '2025' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: 'Single-Metric ESG Reporting Framework', location: 'Madrid, Spain', year: '2024' },
    ],
    focusAreas: ['Renewable Energy', 'Climate Policy', 'ESG Strategy'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Tom Bradley',
        authorHeadline: 'Venture Partner · Early Stage Investor',
        authorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
        content: "Elena is one of the few climate advisors who can talk IRR with a partner in the morning and permitting law with a regulator in the afternoon. Two of our portfolio companies are faster to revenue because of her.",
        date: 'May 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Sustainability Lead · Climate Tech Advisor',
        company: 'Solaris Energy',
        location: 'Madrid, Spain',
        startDate: '2019-04',
        current: true,
        description: 'Leading utility-scale solar deployment strategy across Southern Europe and North Africa. Commissioned 40+ installations totalling 280 MW of capacity in 2026 alone.',
      },
      {
        id: 'exp-2',
        title: 'Climate Policy Advisor',
        company: 'European Commission (DG Climate Action)',
        location: 'Brussels, Belgium',
        startDate: '2015-01',
        endDate: '2019-03',
      },
      {
        id: 'exp-3',
        title: 'Environmental Engineer',
        company: 'Iberdrola',
        location: 'Bilbao, Spain',
        startDate: '2011-06',
        endDate: '2014-12',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Universidad Politécnica de Madrid',
        degree: 'Master of Science',
        field: 'Renewable Energy Engineering',
        startDate: '2009-09',
        endDate: '2011-06',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Renewable Energy Development', level: 'Expert' },
      { id: 'skill-2', name: 'Climate Policy', level: 'Expert' },
      { id: 'skill-3', name: 'Grid Integration', level: 'Advanced' },
      { id: 'skill-4', name: 'ESG Reporting', level: 'Advanced' },
      { id: 'skill-5', name: 'Public Speaking', level: 'Expert' },
    ],
    certifications: [
      { id: 'cert-1', name: 'LEED Green Associate', organization: 'U.S. Green Building Council', issueDate: '2016-02' },
    ],
    languages: [
      { id: 'lang-1', name: 'Spanish', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
      { id: 'lang-3', name: 'French', proficiency: 'Professional Working' },
    ],
  },

  'james-okafor': {
    highlights: [
      { value: '$12M', label: 'Series A Raised' },
      { value: '600M', label: 'People in Target Market' },
      { value: '3', label: 'Prior Exits' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=600&h=450&fit=crop', title: 'Series A: $12M Payment Rails Expansion', location: 'Lagos, Nigeria', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=450&fit=crop', title: '2G/USSD Payment Infrastructure', location: 'Lagos, Nigeria', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: '14-Language Payment Flow Launch', location: 'Lagos, Nigeria', year: '2023' },
    ],
    focusAreas: ['Fintech Infrastructure', 'Emerging Markets', 'Payments'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'David Kim',
        authorHeadline: 'Software Architect · Cloud Infrastructure',
        authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
        content: "James built a payment rail that works on 2G with USSD fallback and still passes every audit I've thrown at it. That combination of pragmatism and rigor is rare in fintech infrastructure.",
        date: 'Mar 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'CTO & Co-founder',
        company: 'Meridian Pay',
        location: 'Lagos, Nigeria',
        startDate: '2023-01',
        current: true,
        description: 'Building AI-powered payment infrastructure for emerging markets, designed to run on 2G with USSD fallback. Raised a $12M Series A led by Meridian Capital.',
      },
      {
        id: 'exp-2',
        title: 'Founder & CEO',
        company: 'Kobo Health (acquired)',
        location: 'Lagos, Nigeria',
        startDate: '2019-03',
        endDate: '2022-08',
        description: 'Built and sold a digital health payments startup serving 300+ clinics across West Africa.',
      },
      {
        id: 'exp-3',
        title: 'Founding Engineer',
        company: 'Paystack',
        location: 'Lagos, Nigeria',
        startDate: '2016-01',
        endDate: '2019-02',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'University of Lagos',
        degree: 'Bachelor of Science',
        field: 'Computer Engineering',
        startDate: '2010-09',
        endDate: '2014-07',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Fintech Infrastructure', level: 'Expert' },
      { id: 'skill-2', name: 'Payment Systems', level: 'Expert' },
      { id: 'skill-3', name: 'Distributed Systems', level: 'Expert' },
      { id: 'skill-4', name: 'Fundraising', level: 'Advanced' },
      { id: 'skill-5', name: 'Emerging Markets Strategy', level: 'Expert' },
    ],
    languages: [
      { id: 'lang-1', name: 'English', proficiency: 'Native' },
      { id: 'lang-2', name: 'Yoruba', proficiency: 'Native' },
    ],
  },

  'priya-nair': {
    highlights: [
      { value: '8', label: 'Hospitals in Published Study' },
      { value: '4', label: 'Countries Validated Across' },
      { value: '±2%', label: 'Accuracy vs. Centralized Training' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=450&fit=crop', title: 'Federated Learning Pipeline, 3-Country Rollout', location: 'Bangalore, India', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=450&fit=crop', title: 'Privacy-Preserving ML Training Infra', location: 'Bangalore, India', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=450&fit=crop', title: 'Applied Research: Logistics Forecasting', location: 'Bangalore, India', year: '2023' },
    ],
    focusAreas: ['Federated Learning', 'Healthcare AI', 'Applied Research'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Nikolai Petrov',
        authorHeadline: 'Cybersecurity Expert · CISO · Threat Intelligence',
        authorAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=face',
        content: "We brought Priya in to review a federated learning pipeline handling patient data across three countries. She found privacy leakage vectors our own team had missed twice. Meticulous and fast.",
        date: 'Apr 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Data Scientist · ML Engineer',
        company: 'DeepCode AI',
        location: 'Bangalore, India',
        startDate: '2021-06',
        current: true,
        description: 'Leading applied research on federated learning for healthcare data. Published work validated across 8 hospitals in 4 countries with accuracy within 2% of centralized training.',
      },
      {
        id: 'exp-2',
        title: 'Machine Learning Engineer',
        company: 'Microsoft Research India',
        location: 'Bangalore, India',
        startDate: '2018-08',
        endDate: '2021-05',
      },
      {
        id: 'exp-3',
        title: 'Research Assistant',
        company: 'Indian Institute of Science',
        location: 'Bangalore, India',
        startDate: '2015-07',
        endDate: '2018-07',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Indian Institute of Science',
        degree: 'PhD',
        field: 'Computer Science',
        startDate: '2015-07',
        endDate: '2020-12',
      },
      {
        id: 'edu-2',
        school: 'Indian Institute of Technology, Madras',
        degree: 'Bachelor of Technology',
        field: 'Computer Science & Engineering',
        startDate: '2010-07',
        endDate: '2014-05',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Machine Learning', level: 'Expert' },
      { id: 'skill-2', name: 'Federated Learning', level: 'Expert' },
      { id: 'skill-3', name: 'Healthcare AI', level: 'Expert' },
      { id: 'skill-4', name: 'Python', level: 'Expert' },
      { id: 'skill-5', name: 'PyTorch', level: 'Advanced' },
      { id: 'skill-6', name: 'Research Publication', level: 'Expert' },
    ],
    languages: [
      { id: 'lang-1', name: 'English', proficiency: 'Full Professional' },
      { id: 'lang-2', name: 'Hindi', proficiency: 'Native' },
      { id: 'lang-3', name: 'Malayalam', proficiency: 'Native' },
    ],
  },

  'lucas-fontaine': {
    highlights: [
      { value: '6x', label: 'Lower CAC via Referrals' },
      { value: '€10M', label: 'ARR Scaled To' },
      { value: '3', label: 'SaaS Companies Scaled' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=450&fit=crop', title: 'Lead Scoring & Pipeline Rebuild', location: 'Paris, France', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=600&h=450&fit=crop', title: '0 to $10M ARR Growth Program', location: 'Paris, France', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=450&fit=crop', title: 'Go-to-Market Playbook for Seed Startups', location: 'Paris, France', year: '2022' },
    ],
    focusAreas: ['Revenue Operations', 'Go-to-Market', 'B2B Growth'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Carlos Mendes',
        authorHeadline: 'Sales Director EMEA · Enterprise Software',
        authorAvatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face',
        content: "Lucas rebuilt our lead scoring model and pipeline stages in a single quarter, and our sales team actually started trusting the CRM again. That alone is worth more than most GTM hires I've seen.",
        date: 'Feb 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Head of Growth',
        company: 'Artisan Bloom',
        location: 'Paris, France',
        startDate: '2022-03',
        current: true,
        description: 'Own revenue operations and growth strategy. Built a referral-driven growth engine that now delivers CAC 6x lower than paid channels.',
      },
      {
        id: 'exp-2',
        title: 'VP Revenue Operations',
        company: 'Aircall',
        location: 'Paris, France',
        startDate: '2018-01',
        endDate: '2022-02',
        description: 'Scaled revenue operations from €2M to €10M ARR. Built the go-to-market playbook for the company\'s Series B expansion.',
      },
      {
        id: 'exp-3',
        title: 'Growth Marketing Manager',
        company: 'Payfit',
        location: 'Paris, France',
        startDate: '2015-09',
        endDate: '2017-12',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'HEC Paris',
        degree: 'Master in Management',
        startDate: '2010-09',
        endDate: '2015-06',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Revenue Operations', level: 'Expert' },
      { id: 'skill-2', name: 'Go-to-Market Strategy', level: 'Expert' },
      { id: 'skill-3', name: 'B2B SaaS Growth', level: 'Expert' },
      { id: 'skill-4', name: 'Positioning & Messaging', level: 'Advanced' },
      { id: 'skill-5', name: 'Customer Success Strategy', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'French', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
    ],
  },

  'yuki-tanaka': {
    highlights: [
      { value: '8', label: 'Patents Filed' },
      { value: '45→4 min', label: 'Robot Setup Time Cut' },
      { value: '200+', label: 'Cobots Deployed' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=450&fit=crop', title: 'Cobot Cell: 30% Cycle-Time Reduction', location: 'Tokyo, Japan', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&h=450&fit=crop', title: 'Mechatronics Patent Portfolio (8 Filed)', location: 'Tokyo, Japan', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=450&fit=crop', title: 'AI-Mechanical Systems Integration Lab', location: 'Tokyo, Japan', year: '2022' },
    ],
    focusAreas: ['Robotics Engineering', 'Mechatronics', 'Cobots'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Marcus Thorn',
        authorHeadline: 'VP of Operations · Manufacturing & Industry 4.0',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
        content: "Yuki designed a cobot cell that cut cycle time by 30% without a single safety incident during rollout. Rare to find an engineer who treats the factory floor workers as co-designers instead of end users.",
        date: 'Jan 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Robotics Engineer · Automation Specialist',
        company: 'NovaTech Robotics',
        location: 'Tokyo, Japan',
        startDate: '2017-04',
        current: true,
        description: 'Design collaborative robotic arm systems for automotive and electronics manufacturing. Holder of 8 filed patents, including a force-feedback calibration method that cut robot setup time from 45 to under 4 minutes.',
      },
      {
        id: 'exp-2',
        title: 'Mechatronics Engineer',
        company: 'FANUC Corporation',
        location: 'Yamanashi, Japan',
        startDate: '2013-04',
        endDate: '2017-03',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Tokyo Institute of Technology',
        degree: 'Master of Engineering',
        field: 'Mechatronics',
        startDate: '2011-04',
        endDate: '2013-03',
      },
      {
        id: 'edu-2',
        school: 'University of Tokyo',
        degree: 'Bachelor of Engineering',
        field: 'Mechanical Engineering',
        startDate: '2007-04',
        endDate: '2011-03',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Robotics Engineering', level: 'Expert' },
      { id: 'skill-2', name: 'Mechatronics', level: 'Expert' },
      { id: 'skill-3', name: 'Motion Control', level: 'Expert' },
      { id: 'skill-4', name: 'Collaborative Robotics (Cobots)', level: 'Expert' },
      { id: 'skill-5', name: 'Patent Development', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'Japanese', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Professional Working' },
    ],
  },

  'anna-kowalski': {
    highlights: [
      { value: '+400bps', label: 'Gross Margin Expansion' },
      { value: '-35%', label: 'Support Tickets Reduced' },
      { value: '10+', label: 'Years in Startup Finance' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=600&h=450&fit=crop', title: 'Series B Unit Economics Model', location: 'Warsaw, Poland', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: 'Financial Infrastructure for Hypergrowth', location: 'Warsaw, Poland', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&h=450&fit=crop', title: 'Fundraising Readiness Program', location: 'Warsaw, Poland', year: '2023' },
    ],
    focusAreas: ['Strategic Finance', 'Unit Economics', 'Fundraising'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Tom Bradley',
        authorHeadline: 'Venture Partner · Early Stage Investor',
        authorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
        content: "Anna is the CFO founders wish they'd hired a year earlier. She rebuilt one portfolio company's unit economics model in a week and it directly shaped how we structured their Series B.",
        date: 'Mar 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'CFO',
        company: 'DeepCode AI',
        location: 'Warsaw, Poland',
        startDate: '2021-11',
        current: true,
        description: 'Own financial strategy for a hypergrowth Series B startup. Expanded gross margin 400bps YoY without price increases by rebuilding onboarding for the highest-support-cost customer segment.',
      },
      {
        id: 'exp-2',
        title: 'VP Finance',
        company: 'Booksy',
        location: 'Warsaw, Poland',
        startDate: '2017-06',
        endDate: '2021-10',
      },
      {
        id: 'exp-3',
        title: 'Investment Associate',
        company: 'Innovation Nest',
        location: 'Kraków, Poland',
        startDate: '2014-02',
        endDate: '2017-05',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Warsaw School of Economics',
        degree: 'Master of Science',
        field: 'Finance and Accounting',
        startDate: '2009-09',
        endDate: '2014-01',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Strategic Finance', level: 'Expert' },
      { id: 'skill-2', name: 'Venture-backed Financial Planning', level: 'Expert' },
      { id: 'skill-3', name: 'Unit Economics', level: 'Expert' },
      { id: 'skill-4', name: 'Fundraising', level: 'Advanced' },
      { id: 'skill-5', name: 'Financial Modeling', level: 'Expert' },
    ],
    certifications: [
      { id: 'cert-1', name: 'Chartered Financial Analyst (CFA)', organization: 'CFA Institute', issueDate: '2016-08' },
    ],
    languages: [
      { id: 'lang-1', name: 'Polish', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
    ],
  },

  'omar-hassan': {
    highlights: [
      { value: '$50M', label: 'Deal Rescued from Compliance Gap' },
      { value: '15', label: 'Years in Trade Compliance' },
      { value: 'Gulf', label: 'Region Specialist' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=600&h=450&fit=crop', title: '4-Jurisdiction Customs Compliance Overhaul', location: 'Dubai, UAE', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&h=450&fit=crop', title: 'Cross-Border Trade Resilience Program', location: 'Dubai, UAE', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&h=450&fit=crop', title: 'Global Trade Compliance Framework', location: 'Dubai, UAE', year: '2022' },
    ],
    focusAreas: ['Trade Compliance', 'Customs', 'Supply Chain Resilience'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Alex Rivera',
        authorHeadline: 'Senior Supply Chain Consultant',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        content: "Omar untangled a customs compliance mess across four jurisdictions that had stalled a client's expansion for months. He knows trade regulation the way most people know their own street.",
        date: 'Feb 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Global Trade & Logistics Director',
        company: 'Global LogiLink',
        location: 'Dubai, UAE',
        startDate: '2018-05',
        current: true,
        description: 'Direct cross-border trade compliance and supply chain resilience strategy for enterprise clients navigating Red Sea disruptions and shifting trade corridors.',
      },
      {
        id: 'exp-2',
        title: 'Regional Trade Compliance Manager',
        company: 'DP World',
        location: 'Dubai, UAE',
        startDate: '2012-09',
        endDate: '2018-04',
      },
      {
        id: 'exp-3',
        title: 'Customs & Trade Analyst',
        company: 'Aramex',
        location: 'Amman, Jordan',
        startDate: '2009-01',
        endDate: '2012-08',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'American University of Sharjah',
        degree: 'Bachelor of Science',
        field: 'International Business',
        startDate: '2005-09',
        endDate: '2009-06',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Trade Compliance', level: 'Expert' },
      { id: 'skill-2', name: 'Customs Documentation', level: 'Expert' },
      { id: 'skill-3', name: 'Supply Chain Resilience', level: 'Expert' },
      { id: 'skill-4', name: 'Cross-border Logistics', level: 'Expert' },
      { id: 'skill-5', name: 'HS Classification', level: 'Advanced' },
    ],
    certifications: [
      { id: 'cert-1', name: 'Certified International Trade Professional', organization: 'FITT', issueDate: '2015-04' },
    ],
    languages: [
      { id: 'lang-1', name: 'Arabic', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
    ],
  },

  'camille-dupont': {
    highlights: [
      { value: '2x', label: 'Pipeline After Rebrand Sprint' },
      { value: '12', label: 'Years in B2B Branding' },
      { value: '6', label: 'Weeks: Sprint to Launch' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=450&fit=crop', title: 'B2B Positioning Workshop & Relaunch', location: 'Lyon, France', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&h=450&fit=crop', title: 'Brand Narrative Overhaul, 12 Markets', location: 'Lyon, France', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=450&fit=crop', title: 'Story-to-Pipeline Sales Enablement Kit', location: 'Lyon, France', year: '2022' },
    ],
    focusAreas: ['Brand Strategy', 'B2B Positioning', 'Storytelling'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Lucas Fontaine',
        authorHeadline: 'Head of Growth · B2B SaaS · Revenue Operations',
        authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        content: "Camille rewrote our entire positioning in a single workshop and our sales team started closing deals faster within the month, using her language verbatim. That's the mark of a brand strategist who actually understands the buyer.",
        date: 'Apr 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Brand Strategist · Marketing Director',
        company: 'Dupont & Co.',
        location: 'Lyon, France',
        startDate: '2017-01',
        current: true,
        description: 'Independent brand strategy practice for B2B companies. Recent engagement with a logistics startup doubled pipeline in month one after a six-week rebrand sprint.',
      },
      {
        id: 'exp-2',
        title: 'Senior Brand Manager',
        company: 'Publicis Groupe',
        location: 'Paris, France',
        startDate: '2011-09',
        endDate: '2016-12',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Sciences Po Paris',
        degree: 'Master',
        field: 'Marketing & Communications',
        startDate: '2009-09',
        endDate: '2011-06',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Brand Strategy', level: 'Expert' },
      { id: 'skill-2', name: 'B2B Positioning', level: 'Expert' },
      { id: 'skill-3', name: 'Storytelling', level: 'Expert' },
      { id: 'skill-4', name: 'Visual Identity Direction', level: 'Advanced' },
      { id: 'skill-5', name: 'Go-to-Market Messaging', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'French', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
      { id: 'lang-3', name: 'Italian', proficiency: 'Limited Working' },
    ],
  },

  'david-kim': {
    highlights: [
      { value: '0', label: 'Downtime on Region Migration' },
      { value: '10+', label: 'Years at Google/AWS' },
      { value: '3x', label: 'Volume Cost-Modeled Pre-Launch' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=450&fit=crop', title: 'Training Infra: 14h to 2h Job Time', location: 'Seoul, South Korea', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=450&fit=crop', title: 'Distributed Systems Reliability Program', location: 'Seoul, South Korea', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: 'Resilient Cloud Architecture Rebuild', location: 'Seoul, South Korea', year: '2022' },
    ],
    focusAreas: ['Cloud Architecture', 'Distributed Systems', 'SRE'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Priya Nair',
        authorHeadline: 'Data Scientist · ML Engineer · AI Researcher',
        authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
        content: "David redesigned our training infrastructure so a job that took 14 hours now finishes in under two. He explains distributed systems trade-offs more clearly than anyone I've worked with, including at Google.",
        date: 'Jan 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Software Architect · Cloud Infrastructure',
        company: 'Global LogiLink',
        location: 'Seoul, South Korea',
        startDate: '2020-06',
        current: true,
        description: 'Led migration to a multi-region active-active infrastructure with zero downtime. Own platform reliability, observability, and cost architecture.',
      },
      {
        id: 'exp-2',
        title: 'Senior Software Engineer',
        company: 'Amazon Web Services',
        location: 'Seattle, Washington',
        startDate: '2016-07',
        endDate: '2020-05',
      },
      {
        id: 'exp-3',
        title: 'Software Engineer',
        company: 'Google',
        location: 'Mountain View, California',
        startDate: '2013-08',
        endDate: '2016-06',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Korea Advanced Institute of Science and Technology (KAIST)',
        degree: 'Master of Science',
        field: 'Computer Science',
        startDate: '2011-09',
        endDate: '2013-06',
      },
      {
        id: 'edu-2',
        school: 'Seoul National University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2007-03',
        endDate: '2011-02',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Distributed Systems', level: 'Expert' },
      { id: 'skill-2', name: 'Cloud Architecture', level: 'Expert' },
      { id: 'skill-3', name: 'Site Reliability Engineering', level: 'Expert' },
      { id: 'skill-4', name: 'Kubernetes', level: 'Advanced' },
      { id: 'skill-5', name: 'Cost Optimization', level: 'Advanced' },
      { id: 'skill-6', name: 'Open Source', level: 'Advanced' },
    ],
    certifications: [
      { id: 'cert-1', name: 'AWS Certified Solutions Architect – Professional', organization: 'Amazon Web Services', issueDate: '2019-05' },
    ],
    languages: [
      { id: 'lang-1', name: 'Korean', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
    ],
  },

  'fatima-al-rashid': {
    highlights: [
      { value: '67%', label: 'Telemedicine Adoption (from <2%)' },
      { value: '7', label: 'Years in Digital Health' },
      { value: '3x', label: 'AI-Assisted Radiology Capacity' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=450&fit=crop', title: 'Health Informatics Standards Advisory', location: 'Riyadh, Saudi Arabia', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=450&fit=crop', title: 'Telemedicine Platform Compliance Rebuild', location: 'Riyadh, Saudi Arabia', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=450&fit=crop', title: 'Digital Health Equity Initiative', location: 'Riyadh, Saudi Arabia', year: '2023' },
    ],
    focusAreas: ['Digital Health', 'Telemedicine', 'Health Informatics'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Isabella Santos',
        authorHeadline: 'People Operations · Culture & Talent Lead',
        authorAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&h=200&fit=crop&crop=face',
        content: "Fatima advised our health-tech portfolio company on informatics standards that saved them a painful compliance rebuild. She translates medicine and technology fluently, which is genuinely rare.",
        date: 'May 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Healthcare Innovation Lead · Digital Health',
        company: 'Azure Health Systems',
        location: 'Riyadh, Saudi Arabia',
        startDate: '2020-02',
        current: true,
        description: 'Direct digital health strategy across the Gulf region. Telemedicine adoption in the market grew from under 2% to 67% during her tenure, with a focus on outcome-based incentive structures.',
      },
      {
        id: 'exp-2',
        title: 'Health Informatics Manager',
        company: 'King Faisal Specialist Hospital',
        location: 'Riyadh, Saudi Arabia',
        startDate: '2016-01',
        endDate: '2020-01',
      },
      {
        id: 'exp-3',
        title: 'Clinical Systems Analyst',
        company: 'Cerner Corporation',
        location: 'Dubai, UAE',
        startDate: '2013-06',
        endDate: '2015-12',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'King Saud University',
        degree: 'Master of Health Informatics',
        startDate: '2011-09',
        endDate: '2013-05',
      },
      {
        id: 'edu-2',
        school: 'King Saud bin Abdulaziz University for Health Sciences',
        degree: 'Bachelor of Science',
        field: 'Nursing',
        startDate: '2007-09',
        endDate: '2011-06',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Digital Health Strategy', level: 'Expert' },
      { id: 'skill-2', name: 'Telemedicine', level: 'Expert' },
      { id: 'skill-3', name: 'Health Informatics', level: 'Expert' },
      { id: 'skill-4', name: 'AI-assisted Diagnostics', level: 'Advanced' },
      { id: 'skill-5', name: 'Healthcare Policy', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'Arabic', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
    ],
  },

  'tom-bradley': {
    highlights: [
      { value: '40+', label: 'Companies Invested In' },
      { value: '15+', label: 'Years in Venture Capital' },
      { value: '#41', label: 'Latest Bet: Trade Finance ERP' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&h=450&fit=crop', title: '40+ Company Investment Portfolio', location: 'London, UK', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=600&h=450&fit=crop', title: 'Series A Lead: Fintech Infrastructure', location: 'London, UK', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: 'Climate Tech Growth Equity Fund', location: 'London, UK', year: '2022' },
    ],
    focusAreas: ['Venture Capital', 'B2B SaaS', 'Growth Equity'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'James Okafor',
        authorHeadline: 'CTO & Co-founder · Building the future of fintech',
        authorAvatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&h=200&fit=crop&crop=face',
        content: "Tom led our Series A and never once made us feel like the emerging-market founders in the room. He asked harder questions than our other investors and then fought hardest for us at the board table.",
        date: 'Mar 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Venture Partner · Early Stage Investor',
        company: 'Meridian Capital',
        location: 'London, UK',
        startDate: '2016-03',
        current: true,
        description: 'Invested in 40+ B2B software companies across SaaS, fintech, and climate tech. Thesis: boring industries, interesting software. Most recent investment: a $9T trade-finance ERP market.',
      },
      {
        id: 'exp-2',
        title: 'Principal',
        company: 'Balderton Capital',
        location: 'London, UK',
        startDate: '2011-05',
        endDate: '2016-02',
      },
      {
        id: 'exp-3',
        title: 'Investment Banking Analyst',
        company: 'Goldman Sachs',
        location: 'London, UK',
        startDate: '2008-08',
        endDate: '2011-04',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'University of Oxford',
        degree: 'Master of Arts',
        field: 'Philosophy, Politics and Economics',
        startDate: '2005-10',
        endDate: '2008-06',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Venture Capital', level: 'Expert' },
      { id: 'skill-2', name: 'Growth Equity', level: 'Expert' },
      { id: 'skill-3', name: 'Due Diligence', level: 'Expert' },
      { id: 'skill-4', name: 'B2B SaaS Evaluation', level: 'Expert' },
      { id: 'skill-5', name: 'Board Governance', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'English', proficiency: 'Native' },
    ],
  },

  'isabella-santos': {
    highlights: [
      { value: '20–30%', label: 'Attrition Reduction' },
      { value: '3', label: 'Hypergrowth Companies' },
      { value: 'Global', label: 'Culture Programs Built' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=450&fit=crop', title: 'Performance Review Redesign', location: 'São Paulo, Brazil', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=450&fit=crop', title: 'Culture Design Playbook, 3 Offices', location: 'São Paulo, Brazil', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&h=450&fit=crop', title: 'Workforce Analytics Rollout', location: 'São Paulo, Brazil', year: '2023' },
    ],
    focusAreas: ['People Operations', 'Workforce Analytics', 'Culture Design'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Sarah Chen',
        authorHeadline: 'Product Designer · UX Lead at NovaTech',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
        content: "Isabella rebuilt our performance review process from scratch after the old one was quietly making everyone miserable. Engagement scores went up two quarters in a row. She designs culture the way good PMs design products.",
        date: 'Feb 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'People Operations · Culture & Talent Lead',
        company: 'Artisan Bloom',
        location: 'São Paulo, Brazil',
        startDate: '2022-08',
        current: true,
        description: 'Building the people function for a fast-growing marketplace. Championed a workforce-analytics approach to attrition that reduced regretted departures by 24%.',
      },
      {
        id: 'exp-2',
        title: 'Senior People Partner',
        company: 'Notion',
        location: 'San Francisco, California',
        startDate: '2020-01',
        endDate: '2022-06',
      },
      {
        id: 'exp-3',
        title: 'People Operations Manager',
        company: 'Spotify',
        location: 'New York, New York',
        startDate: '2016-09',
        endDate: '2019-12',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Fundação Getúlio Vargas (FGV)',
        degree: 'Bachelor of Business Administration',
        startDate: '2010-02',
        endDate: '2014-12',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'People Operations', level: 'Expert' },
      { id: 'skill-2', name: 'Workforce Analytics', level: 'Expert' },
      { id: 'skill-3', name: 'Culture Design', level: 'Expert' },
      { id: 'skill-4', name: 'Talent Strategy', level: 'Advanced' },
      { id: 'skill-5', name: 'Hybrid Work Design', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'Portuguese', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
      { id: 'lang-3', name: 'Spanish', proficiency: 'Professional Working' },
    ],
  },

  'nikolai-petrov': {
    highlights: [
      { value: '15', label: 'Years in Security' },
      { value: '<4 hrs', label: 'Incident Detection Target' },
      { value: '2', label: 'Elite Certs (CISSP / OSCP)' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=450&fit=crop', title: 'Incident Response Tabletop Program', location: 'Amsterdam, Netherlands', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=450&fit=crop', title: 'Enterprise Threat Intelligence Platform', location: 'Amsterdam, Netherlands', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: 'Security Governance Framework', location: 'Amsterdam, Netherlands', year: '2022' },
    ],
    focusAreas: ['Threat Intelligence', 'Incident Response', 'Security Governance'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'David Kim',
        authorHeadline: 'Software Architect · Cloud Infrastructure',
        authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
        content: "Nikolai ran an incident response tabletop that exposed three gaps in our infrastructure we genuinely hadn't considered. Calm under pressure and never alarmist, just precise about what actually matters.",
        date: 'Apr 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Cybersecurity Expert · CISO · Threat Intelligence',
        company: 'DeepCode AI',
        location: 'Amsterdam, Netherlands',
        startDate: '2019-10',
        current: true,
        description: 'Own security posture for an ML platform used by enterprise customers. Report directly to the board; every product decision and vendor contract includes a security review.',
      },
      {
        id: 'exp-2',
        title: 'Head of Threat Intelligence',
        company: 'Kaspersky',
        location: 'Amsterdam, Netherlands',
        startDate: '2013-04',
        endDate: '2019-09',
      },
      {
        id: 'exp-3',
        title: 'Security Analyst',
        company: 'ING Group',
        location: 'Amsterdam, Netherlands',
        startDate: '2009-06',
        endDate: '2013-03',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Delft University of Technology',
        degree: 'Master of Science',
        field: 'Cybersecurity',
        startDate: '2007-09',
        endDate: '2009-05',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Threat Intelligence', level: 'Expert' },
      { id: 'skill-2', name: 'Offensive Security', level: 'Expert' },
      { id: 'skill-3', name: 'Incident Response', level: 'Expert' },
      { id: 'skill-4', name: 'Supply Chain Security', level: 'Expert' },
      { id: 'skill-5', name: 'Security Governance', level: 'Advanced' },
    ],
    certifications: [
      { id: 'cert-1', name: 'Certified Information Systems Security Professional (CISSP)', organization: '(ISC)²', issueDate: '2015-03' },
      { id: 'cert-2', name: 'Offensive Security Certified Professional (OSCP)', organization: 'Offensive Security', issueDate: '2012-09' },
    ],
    languages: [
      { id: 'lang-1', name: 'Russian', proficiency: 'Native' },
      { id: 'lang-2', name: 'Dutch', proficiency: 'Full Professional' },
      { id: 'lang-3', name: 'English', proficiency: 'Full Professional' },
    ],
  },

  'mei-zhang': {
    highlights: [
      { value: '+34%', label: 'Cross-border Volume YoY' },
      { value: '15', label: 'Asian Markets Navigated' },
      { value: '10+', label: 'Years in E-commerce' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=600&h=450&fit=crop', title: '3-Marketplace Launch in One Quarter', location: 'Shanghai, China', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&h=450&fit=crop', title: 'Cross-Border Fulfillment Network', location: 'Shanghai, China', year: '2024' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=600&h=450&fit=crop', title: 'SME Market Entry Program, Asia-West', location: 'Shanghai, China', year: '2023' },
    ],
    focusAreas: ['Cross-border E-commerce', 'Market Entry', 'Localization'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Omar Hassan',
        authorHeadline: 'Global Trade & Logistics Director',
        authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
        content: "Mei got a mid-size manufacturer from zero to live on three Western marketplaces in under a quarter, localization and logistics included. She moves faster than most teams twice her size.",
        date: 'Jan 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'E-commerce Director · Cross-border Trade',
        company: 'Artisan Bloom',
        location: 'Shanghai, China',
        startDate: '2021-05',
        current: true,
        description: 'Building e-commerce bridges between Asia and Western markets. Grew cross-border volume 34% YoY while managing rising logistics and customs complexity.',
      },
      {
        id: 'exp-2',
        title: 'Head of International Expansion',
        company: 'Alibaba Group',
        location: 'Hangzhou, China',
        startDate: '2016-07',
        endDate: '2021-04',
      },
      {
        id: 'exp-3',
        title: 'Category Manager',
        company: 'JD.com',
        location: 'Beijing, China',
        startDate: '2013-03',
        endDate: '2016-06',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Fudan University',
        degree: 'Master of Business Administration',
        startDate: '2011-09',
        endDate: '2013-02',
      },
      {
        id: 'edu-2',
        school: 'Shanghai Jiao Tong University',
        degree: 'Bachelor of Economics',
        field: 'International Trade',
        startDate: '2007-09',
        endDate: '2011-06',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Cross-border E-commerce', level: 'Expert' },
      { id: 'skill-2', name: 'Market Entry Strategy', level: 'Expert' },
      { id: 'skill-3', name: 'Localization', level: 'Expert' },
      { id: 'skill-4', name: 'Partnership Development', level: 'Advanced' },
      { id: 'skill-5', name: 'Supply Chain Management', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'Mandarin', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
    ],
  },

  'carlos-mendes': {
    highlights: [
      { value: '140%', label: 'of H1 2026 Quota' },
      { value: '6–12', label: 'Stakeholders per Deal' },
      { value: '12+', label: 'Years in Enterprise Sales' },
    ],
    portfolio: [
      { id: 'pf-1', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop', title: '140% of H1 2026 Quota', location: 'Lisbon, Portugal', year: '2026' },
      { id: 'pf-2', image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=600&h=450&fit=crop', title: 'EMEA Deal Review Ritual Rollout', location: 'Lisbon, Portugal', year: '2025' },
      { id: 'pf-3', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=450&fit=crop', title: 'Enterprise Sales Team Build-out', location: 'Lisbon, Portugal', year: '2023' },
    ],
    focusAreas: ['Enterprise Sales', 'Deal Strategy', 'EMEA'],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Lucas Fontaine',
        authorHeadline: 'Head of Growth · B2B SaaS · Revenue Operations',
        authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        content: "Carlos runs the tightest deal reviews I've sat in on. He pressure-tests every stage of the pipeline before it becomes a problem, which is exactly why his team hit 140% of quota while everyone else was explaining misses.",
        date: 'May 2026',
      },
    ],
    experiences: [
      {
        id: 'exp-1',
        title: 'Sales Director EMEA · Enterprise Software',
        company: 'DeepCode AI',
        location: 'Lisbon, Portugal',
        startDate: '2021-09',
        current: true,
        description: 'Lead enterprise sales across EMEA. Team hit 140% of quota for H1 2026 by rebuilding discovery around business outcomes and multithreading every deal from day one.',
      },
      {
        id: 'exp-2',
        title: 'Regional Sales Manager',
        company: 'Salesforce',
        location: 'Madrid, Spain',
        startDate: '2016-04',
        endDate: '2021-08',
      },
      {
        id: 'exp-3',
        title: 'Enterprise Account Executive',
        company: 'SAP',
        location: 'Lisbon, Portugal',
        startDate: '2012-01',
        endDate: '2016-03',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'Nova School of Business and Economics',
        degree: 'Master in Management',
        startDate: '2007-09',
        endDate: '2009-06',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Enterprise Sales', level: 'Expert' },
      { id: 'skill-2', name: 'Sales Leadership', level: 'Expert' },
      { id: 'skill-3', name: 'Multithreaded Selling', level: 'Expert' },
      { id: 'skill-4', name: 'Deal Strategy', level: 'Expert' },
      { id: 'skill-5', name: 'Revenue Forecasting', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'Portuguese', proficiency: 'Native' },
      { id: 'lang-2', name: 'English', proficiency: 'Full Professional' },
      { id: 'lang-3', name: 'Spanish', proficiency: 'Full Professional' },
    ],
  },
};
