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

export interface MockProfileSections {
  experiences: MockExperience[];
  educations: MockEducation[];
  skills: MockSkill[];
  certifications?: MockCertification[];
  languages?: MockLanguage[];
}

export const mockProfileSections: Record<string, MockProfileSections> = {
  'chuck-hartwig': {
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
