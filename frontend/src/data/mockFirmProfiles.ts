// Rich firm-profile content for the companies seeded in
// backend/src/scripts/seedNetwork.ts (see the `firms` array there for their
// real name/bio/industry/logo). There's no backend model yet for a firm's
// services/team/portfolio/insights, so this is purely frontend enrichment —
// the equivalent of mockProfileSections.ts, but for companies instead of
// people — keyed by the same slug used everywhere else in the app.

import { FirmProfileData } from '@/types/firm';

export const mockFirmProfiles: Record<string, FirmProfileData> = {
  'ecostream-solutions': {
    id: 'ecostream-solutions',
    name: 'EcoStream Solutions',
    tagline: 'Environmental Services',
    foundedYear: 2015,
    employeeCount: '180',
    bio: 'Founded in 2015, EcoStream has been at the forefront of sustainable industrial solutions. We help companies reduce their environmental footprint while optimizing operational efficiency.',
    firmType: 'SERVICE',
    followersCount: 8400,
    posts: [
      {
        id: 'es-post-1',
        title: 'Closed-loop system live at our largest chemical plant deployment yet',
        content: 'We just finished commissioning a closed-loop water recycling core at a major chemical plant in Bavaria. Total freshwater intake is down 62% since cutover, ahead of our own projections.\n\nThe redesign touched the entire intake and discharge pipeline — not just a filter swap. Grateful to the on-site team for keeping production running through the transition. 💧',
        timestamp: '2026-07-15T09:20:00.000Z',
        reactions: { likes: 74, comments: 12 },
        mediaUrl: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=800&h=500&fit=crop',
      },
      {
        id: 'es-post-2',
        content: 'Proud to share that our Hamburg district recycling network just crossed 2.1 billion liters of water recycled annually — enough to offset the freshwater use of roughly 14,000 households.\n\nMunicipal-scale greywater infrastructure is still an underinvested category. We think that changes fast over the next five years.',
        timestamp: '2026-07-08T14:05:00.000Z',
        reactions: { likes: 58, comments: 9 },
        mediaUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop',
      },
      {
        id: 'es-post-3',
        title: 'Hot take: most industrial water audits stop one step too early',
        content: 'Most industrial water audits stop at "here\'s where you\'re losing water." Ours go one step further and model the recycling ROI at 3 different investment tiers before we recommend anything.\n\nThe fix is rarely the flashiest option. It\'s usually the one that pays back in 18 months instead of 5 years.',
        timestamp: '2026-06-28T11:40:00.000Z',
        reactions: { likes: 41, comments: 15 },
      },
      {
        id: 'es-post-4',
        title: 'Now hiring across Munich and Rotterdam',
        content: 'We\'re growing the field engineering team in both Munich and Rotterdam this quarter. If you\'ve worked on industrial filtration, membrane systems, or greywater infrastructure, we\'d love to talk.\n\nLink to open roles in the Firm Details tab. 🌍',
        timestamp: '2026-06-18T08:15:00.000Z',
        reactions: { likes: 36, comments: 4 },
        mediaUrl: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&h=500&fit=crop',
      },
      {
        id: 'es-post-5',
        title: 'Our 2026 Industrial Water Sustainability Report is out',
        content: 'Our 2026 Industrial Water Sustainability Report is live. Benchmarks across 40+ European manufacturing sites, regulatory trends, and what "good" looks like for freshwater intake per unit of output.\n\nAvailable now in Resources.',
        timestamp: '2026-05-19T10:00:00.000Z',
        reactions: { likes: 29, comments: 3 },
      },
    ],
    services: [
      { title: 'Industrial Water Filtration', description: 'Custom-engineered filtration systems built for high-volume manufacturing plants.' },
      { title: 'Water Recycling Programs', description: 'Closed-loop systems that cut freshwater intake by up to 60%.' },
      { title: 'Environmental Consulting', description: 'Site audits and compliance strategy for water-intensive industries.' },
    ],
    team: [
      { name: 'Lena Fischer', role: 'CEO & Co-Founder', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
      { name: 'Markus Weber', role: 'Chief Engineer', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
      { name: 'Priya Sharma', role: 'Head of Sustainability', avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&h=200&fit=crop&crop=face' },
      {
        name: 'Thomas Becker', role: 'VP of Operations', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
        directReports: [
          { name: 'Karl Bauer', role: 'Operations Manager', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' },
          { name: 'Nina Vogel', role: 'Logistics Coordinator', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face' },
        ],
      },
      {
        name: 'Sofia Klein', role: 'Head of Engineering', avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&h=200&fit=crop&crop=face',
        directReports: [
          { name: 'Mika Hoffmann', role: 'Software Engineer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
          { name: 'Elif Yildiz', role: 'Systems Engineer', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=face' },
        ],
      },
      { name: 'David Novak', role: 'Regional Manager, Rotterdam', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
      { name: 'Anna Weiss', role: 'Head of Customer Success', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face' },
      { name: 'Jonas Richter', role: 'Sales Director', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face' },
    ],
    locations: [
      { city: 'Munich', address: 'Industriestrasse 24, 80339', type: 'Headquarters' },
      { city: 'Rotterdam', address: 'Havenweg 12, 3011 AA', type: 'European Distribution' },
    ],
    insights: { employeeGrowth: '+18%', avgTenure: '3.8 years' },
    portfolio: [
      {
        title: 'Closed-Loop System for a Major Chemical Plant',
        description: 'Redesigned the plant\'s entire water intake and discharge pipeline around a closed-loop recycling core.',
        category: 'Industrial Filtration',
        result: 'Cut freshwater intake by 62% within the first year.',
        imageUrl: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=800&h=500&fit=crop',
      },
      {
        title: 'Municipal Water Recycling — Hamburg',
        description: 'Partnered with the city to deploy a district-scale greywater recycling network.',
        category: 'Municipal Infrastructure',
        result: 'Recycles 2.1 billion liters of water annually.',
        imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop',
      },
    ],
    resources: [
      { title: '2026 Industrial Water Sustainability Report', type: 'WHITEPAPER', description: 'Benchmarks and regulatory trends across European heavy industry.' },
    ],
    jobs: [
      { id: 'es-1', title: 'Process Engineer', location: 'Munich, Germany', type: 'Full-time' },
      { id: 'es-2', title: 'Field Service Technician', location: 'Rotterdam, Netherlands', type: 'Full-time' },
    ],
    recognitions: [
      { id: 'es-r1', label: 'ISO 14001 Certified', sublabel: 'Environmental Management · 2019' },
      { id: 'es-r2', label: 'Green Business Award', sublabel: 'Bavarian Chamber of Commerce · 2023' },
    ],
    milestones: [
      { id: 'es-m1', period: '2026', title: 'Published 2026 Industrial Water Sustainability Report', org: 'Company Milestone' },
      { id: 'es-m2', period: '2023', title: 'Hamburg network reaches 2.1B liters recycled annually', org: 'Municipal Infrastructure' },
      { id: 'es-m3', period: '2018', title: 'Expanded to Rotterdam', org: 'European Distribution Hub' },
      { id: 'es-m4', period: '2015', title: 'Company founded', org: 'Munich, Germany' },
    ],
    partnerSlugs: ['novatech-robotics', 'solaris-energy'],
  },

  'novatech-robotics': {
    id: 'novatech-robotics',
    name: 'NovaTech Robotics',
    tagline: 'Manufacturing & Robotics',
    foundedYear: 2011,
    employeeCount: '420',
    bio: 'NovaTech Robotics is a leader in precision manufacturing automation. Our robotic arms are used by the world\'s leading automotive and electronics manufacturers.',
    firmType: 'SERVICE',
    followersCount: 14200,
    posts: [
      {
        id: 'nt-post-1',
        title: 'Next-gen cobot line: 40% faster install, zero recalibration',
        content: 'Announcing our next-generation collaborative robot line today. The breakthrough: the robot learns its own geometry through a standardized handling sequence on first install, instead of a manual factory calibration pass.\n\nSetup time drops from 45 minutes to under 4. Demo booked out through next month already.',
        timestamp: '2026-07-12T07:30:00.000Z',
        reactions: { likes: 96, comments: 21 },
        mediaUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=500&fit=crop',
      },
      {
        id: 'nt-post-2',
        content: '200+ cobots now running alongside human workers on a single EV battery assembly line for one of our automotive partners. 3x throughput, zero safety incidents in 18 months.\n\nThe workers weren\'t afraid of the robots. They were involved in the design process from day one.',
        timestamp: '2026-06-30T13:10:00.000Z',
        reactions: { likes: 68, comments: 14 },
      },
    ],
    services: [
      { title: 'Precision Robotic Arms', description: 'Sub-millimeter accuracy for automotive and electronics assembly lines.' },
      { title: 'Automation Integration', description: 'End-to-end deployment, calibration, and line integration for factory floors.' },
      { title: 'Predictive Maintenance AI', description: 'Sensor-driven uptime monitoring across your entire robotic fleet.' },
    ],
    team: [
      { name: 'Hiroshi Tanaka', role: 'CEO', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
      { name: 'Yuki Sato', role: 'Chief Robotics Officer', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face' },
      { name: 'Kenji Nakamura', role: 'Head of AI', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
    ],
    locations: [
      { city: 'Nagoya', address: '2-1 Meieki, Nakamura-ku, 450-0002', type: 'Headquarters' },
      { city: 'Shenzhen', address: 'Nanshan Tech Park, 518000', type: 'Manufacturing Hub' },
    ],
    insights: { employeeGrowth: '+22%', avgTenure: '4.1 years' },
    portfolio: [
      {
        title: 'Next-Gen Cobot Line',
        description: 'Announced a next-generation collaborative robot line built around self-calibrating geometry.',
        category: 'Product Launch',
        result: '40% faster installation time versus the previous generation.',
        imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=500&fit=crop',
      },
      {
        title: 'EV Battery Assembly Automation',
        description: 'Deployed 200+ cobots on a single assembly line for a major EV battery manufacturer.',
        category: 'Automotive',
        result: '3x throughput with zero safety incidents in 18 months.',
        imageUrl: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&h=500&fit=crop',
      },
    ],
    resources: [
      { title: 'Cobot Integration Technical Guide', type: 'TECHNICAL', description: 'Step-by-step documentation for integrating NovaTech arms into an existing line.' },
    ],
    jobs: [
      { id: 'nt-1', title: 'Robotics Engineer', location: 'Nagoya, Japan', type: 'Full-time' },
      { id: 'nt-2', title: 'Field Automation Specialist', location: 'Shenzhen, China', type: 'Full-time' },
    ],
    recognitions: [
      { id: 'nt-r1', label: 'ISO 9001 Certified', sublabel: 'Quality Management · 2018' },
      { id: 'nt-r2', label: 'Manufacturing Innovation Award', sublabel: 'Japan Robotics Association · 2024' },
    ],
    milestones: [
      { id: 'nt-m1', period: '2026', title: 'Launched next-gen cobot line', org: 'Product Launch' },
      { id: 'nt-m2', period: '2022', title: 'Deployed 200+ cobots on EV battery assembly line', org: 'Automotive Partnership' },
      { id: 'nt-m3', period: '2015', title: 'Opened Shenzhen manufacturing hub', org: 'Manufacturing Hub' },
      { id: 'nt-m4', period: '2011', title: 'Company founded', org: 'Nagoya, Japan' },
    ],
    partnerSlugs: ['ecostream-solutions', 'global-logilink'],
  },

  'global-logilink': {
    id: 'global-logilink',
    name: 'Global LogiLink',
    tagline: 'Logistics & Supply Chain',
    foundedYear: 2008,
    employeeCount: '1,200',
    bio: 'We connect the world through efficient logistics. Our platform provides real-time tracking and optimization for complex global supply chains.',
    firmType: 'SERVICE',
    followersCount: 31000,
    posts: [
      {
        id: 'gl-post-1',
        title: 'Customs pre-clearance network live across 12 countries',
        content: 'Our new cross-border e-commerce customs pre-clearance network is fully live across 12 countries. Early numbers: customs delays down 45% for the clients on the network.\n\nThe era of "just-in-time" as a default is over — strategic buffers are a competitive differentiator now, not a luxury.',
        timestamp: '2026-07-14T10:00:00.000Z',
        reactions: { likes: 82, comments: 17 },
        mediaUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop',
      },
      {
        id: 'gl-post-2',
        content: 'Cold chain expansion into 6 new Latin American markets is complete. 99.7% on-time delivery for perishable goods in the first full quarter.\n\nTemperature-controlled logistics is unforgiving — there\'s no "close enough" when the cargo is fresh produce.',
        timestamp: '2026-07-02T09:45:00.000Z',
        reactions: { likes: 54, comments: 8 },
      },
    ],
    services: [
      { title: 'Logistics Optimization', description: 'AI-driven route planning that cuts delivery times by up to 20%.' },
      { title: 'Global Warehousing', description: 'Strategic storage and fulfillment across 50+ countries.' },
      { title: 'Real-Time Tracking Platform', description: 'End-to-end shipment visibility through a single API.' },
    ],
    team: [
      { name: 'Daniel Reyes', role: 'CEO', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' },
      { name: 'Monica Patel', role: 'COO', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
      { name: 'James Ferguson', role: 'Head of Network Operations', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face' },
    ],
    locations: [
      { city: 'New York', address: '123 Business Ave, NY 10001', type: 'Headquarters' },
      { city: 'Rotterdam', address: 'Havenweg 44, 3011 AB', type: 'European Hub' },
      { city: 'Singapore', address: '88 Marina Bay', type: 'Asia-Pacific Hub' },
    ],
    insights: { employeeGrowth: '+12%', avgTenure: '4.2 years' },
    portfolio: [
      {
        title: 'Cross-Border E-Commerce Network',
        description: 'Built a customs pre-clearance network spanning 12 countries for a major e-commerce client.',
        category: 'E-Commerce Logistics',
        result: 'Cut customs delays by 45%.',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop',
      },
      {
        title: 'Cold Chain Expansion — Latin America',
        description: 'Stood up temperature-controlled warehousing and last-mile delivery across 6 new markets.',
        category: 'Cold Chain',
        result: '99.7% on-time delivery for perishable goods.',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=500&fit=crop',
      },
    ],
    resources: [
      { title: '2026 Supply Chain Trends', type: 'WHITEPAPER', description: 'A comprehensive analysis of AI and automation in global logistics.' },
    ],
    subscriptions: [
      { name: 'Essential Support', price: 499, interval: 'MONTHLY', features: ['9/5 email support', 'Standard security updates', 'Monthly health checks'] },
      { name: 'Enterprise Plus', price: 1499, interval: 'MONTHLY', isPopular: true, features: ['24/7 priority support', 'Dedicated account manager', 'Custom integration support', 'Guaranteed 4-hour response time'] },
    ],
    jobs: [
      { id: 'gl-1', title: 'Senior Logistics Analyst', location: 'New York (Remote)', type: 'Full-time' },
      { id: 'gl-2', title: 'Supply Chain Coordinator', location: 'Chicago, IL', type: 'Full-time' },
      { id: 'gl-3', title: 'Warehouse Manager', location: 'New Jersey', type: 'Full-time' },
    ],
    recognitions: [
      { id: 'gl-r1', label: 'AEO Certified', sublabel: 'EU Customs Authority · 2020' },
      { id: 'gl-r2', label: 'Supply Chain Excellence Award', sublabel: 'Global Logistics Council · 2025' },
    ],
    milestones: [
      { id: 'gl-m1', period: '2026', title: 'Customs pre-clearance network live across 12 countries', org: 'Network Expansion' },
      { id: 'gl-m2', period: '2021', title: 'Cold chain expansion into Latin America', org: 'Market Expansion' },
      { id: 'gl-m3', period: '2014', title: 'Opened Singapore Asia-Pacific hub', org: 'Asia-Pacific Hub' },
      { id: 'gl-m4', period: '2008', title: 'Company founded', org: 'New York, USA' },
    ],
    partnerSlugs: ['novatech-robotics', 'meridian-capital'],
  },

  'azure-health': {
    id: 'azure-health',
    name: 'Azure Health Systems',
    tagline: 'Healthcare Technology',
    foundedYear: 2018,
    employeeCount: '95',
    bio: 'Azure Health provides modern software solutions for clinics and hospitals, focusing on patient experience and data security.',
    firmType: 'SERVICE',
    followersCount: 6100,
    posts: [
      {
        id: 'ah-post-1',
        title: 'Rural telehealth rollout reaches 40 communities in Ontario',
        content: 'Our rural telehealth rollout has now reached 40 communities across Ontario that previously had no local specialist access. Adoption is the easy part — the hard part is outcomes.\n\nWe\'re measuring follow-up completion rates next, not just first-visit counts.',
        timestamp: '2026-07-10T12:20:00.000Z',
        reactions: { likes: 47, comments: 11 },
        mediaUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&h=500&fit=crop',
      },
      {
        id: 'ah-post-2',
        content: 'Wrapped a zero-downtime EHR migration for a 12-clinic network off a 20-year-old records system this week. Every migration plan should assume the old system fails mid-cutover — because eventually, one will.',
        timestamp: '2026-06-25T08:00:00.000Z',
        reactions: { likes: 33, comments: 6 },
      },
    ],
    services: [
      { title: 'Telemedicine Platform', description: 'HIPAA and PIPEDA-compliant virtual care built for clinics of any size.' },
      { title: 'EHR Integration', description: 'Seamless records interoperability across providers and legacy systems.' },
      { title: 'Patient Portal', description: 'Self-service scheduling, billing, and secure messaging.' },
    ],
    team: [
      { name: 'Dr. Claire Bouchard', role: 'CEO & Founder', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' },
      { name: 'Ahmed Farouk', role: 'CTO', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=face' },
      { name: 'Rachel Kim', role: 'Head of Clinical Product', avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&h=200&fit=crop&crop=face' },
    ],
    locations: [
      { city: 'Toronto', address: '200 Bay Street, ON M5J 2J1', type: 'Headquarters' },
      { city: 'Vancouver', address: '555 Burrard Street, BC V7X 1M8', type: 'R&D Office' },
    ],
    insights: { employeeGrowth: '+15%', avgTenure: '3.5 years' },
    portfolio: [
      {
        title: 'Rural Telehealth Rollout — Ontario',
        description: 'Deployed telemedicine kiosks and virtual triage across underserved rural communities.',
        category: 'Telemedicine',
        result: 'Reached 40 communities with previously no local specialist access.',
        imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&h=500&fit=crop',
      },
      {
        title: 'EHR Migration — 12-Clinic Network',
        description: 'Migrated a regional clinic network off a 20-year-old records system with zero data loss.',
        category: 'Systems Integration',
        result: 'Zero-downtime cutover across all 12 sites.',
        imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=500&fit=crop',
      },
    ],
    resources: [
      { title: 'Patient Data Security Whitepaper', type: 'WHITEPAPER', description: 'How Azure Health approaches encryption, access control, and breach response.' },
    ],
    jobs: [
      { id: 'ah-1', title: 'Clinical Product Manager', location: 'Toronto, ON', type: 'Full-time' },
      { id: 'ah-2', title: 'Backend Engineer (Healthcare)', location: 'Remote (Canada)', type: 'Full-time' },
    ],
    recognitions: [
      { id: 'ah-r1', label: 'HIPAA & PIPEDA Compliant', sublabel: 'Certified 2021' },
      { id: 'ah-r2', label: 'Digital Health Innovator Award', sublabel: 'Canadian Health Tech Association · 2024' },
    ],
    milestones: [
      { id: 'ah-m1', period: '2026', title: 'Rural telehealth rollout reaches 40 Ontario communities', org: 'Telemedicine' },
      { id: 'ah-m2', period: '2023', title: 'Zero-downtime EHR migration for 12-clinic network', org: 'Systems Integration' },
      { id: 'ah-m3', period: '2020', title: 'Opened Vancouver R&D office', org: 'R&D Office' },
      { id: 'ah-m4', period: '2018', title: 'Company founded', org: 'Toronto, Canada' },
    ],
    partnerSlugs: ['deepcode-ai', 'meridian-capital'],
  },

  'solaris-energy': {
    id: 'solaris-energy',
    name: 'Solaris Energy',
    tagline: 'Renewable Energy',
    foundedYear: 2013,
    employeeCount: '260',
    bio: 'Solaris Energy is powering the transition to a sustainable future with large-scale solar installations across Europe and North Africa.',
    firmType: 'SERVICE',
    followersCount: 9800,
    posts: [
      {
        id: 'sl-post-1',
        title: '40th solar installation commissioned this year',
        content: 'Just commissioned our 40th large-scale solar installation this year — 280 MW added, powering roughly 190,000 households. Solar is now the cheapest form of electricity ever produced in human history. The economics have permanently shifted. ☀️',
        timestamp: '2026-07-11T15:00:00.000Z',
        reactions: { likes: 91, comments: 19 },
        mediaUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=500&fit=crop',
      },
      {
        id: 'sl-post-2',
        content: 'Delivered the region\'s first cross-border renewable power export agreement between Spain and Morocco this week. Grid interconnection is the unglamorous part of the energy transition that determines whether any of the rest of it actually works.',
        timestamp: '2026-06-29T11:30:00.000Z',
        reactions: { likes: 45, comments: 7 },
      },
    ],
    services: [
      { title: 'Utility-Scale Solar Development', description: 'Site assessment through grid connection for large-scale solar farms.' },
      { title: 'Energy Storage Systems', description: 'Battery integration for reliable 24/7 renewable supply.' },
      { title: 'Grid Integration Consulting', description: 'Regulatory strategy and interconnection support for renewable projects.' },
    ],
    team: [
      { name: 'Elena Ruiz', role: 'CEO', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face' },
      { name: 'Marco Bianchi', role: 'Chief Engineer', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face' },
      { name: 'Fatou Diop', role: 'Head of Grid Strategy', avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&h=200&fit=crop&crop=face' },
    ],
    locations: [
      { city: 'Valencia', address: 'Av. de Francia 15, 46023', type: 'Headquarters' },
      { city: 'Casablanca', address: 'Boulevard Zerktouni 88', type: 'North Africa Office' },
    ],
    insights: { employeeGrowth: '+20%', avgTenure: '4.6 years' },
    portfolio: [
      {
        title: '40th Solar Installation — Valencia',
        description: 'Commissioned the company\'s 40th large-scale installation this year alone.',
        category: 'Solar Development',
        result: '280 MW added, powering roughly 190,000 households.',
        imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=500&fit=crop',
      },
      {
        title: 'Morocco Grid Interconnection Project',
        description: 'Delivered the region\'s first cross-border renewable export agreement.',
        category: 'Grid Integration',
        result: 'First cross-border renewable power export deal in the corridor.',
        imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=500&fit=crop',
      },
    ],
    jobs: [
      { id: 'sl-1', title: 'Site Engineer', location: 'Valencia, Spain', type: 'Full-time' },
      { id: 'sl-2', title: 'Grid Integration Analyst', location: 'Casablanca, Morocco', type: 'Full-time' },
    ],
    recognitions: [
      { id: 'sl-r1', label: 'ISO 50001 Certified', sublabel: 'Energy Management · 2019' },
      { id: 'sl-r2', label: 'Renewable Project of the Year', sublabel: 'European Clean Energy Council · 2025' },
    ],
    milestones: [
      { id: 'sl-m1', period: '2026', title: 'First cross-border renewable export deal (Spain–Morocco)', org: 'Grid Integration' },
      { id: 'sl-m2', period: '2024', title: 'Opened Casablanca North Africa office', org: 'North Africa Office' },
      { id: 'sl-m3', period: '2020', title: '40th solar installation commissioned', org: 'Solar Development' },
      { id: 'sl-m4', period: '2013', title: 'Company founded', org: 'Valencia, Spain' },
    ],
    partnerSlugs: ['ecostream-solutions', 'global-logilink'],
  },

  'deepcode-ai': {
    id: 'deepcode-ai',
    name: 'DeepCode AI',
    tagline: 'AI & Code Security',
    foundedYear: 2022,
    employeeCount: '48',
    bio: 'DeepCode AI uses advanced neural networks to find bugs and security vulnerabilities in code before they reach production.',
    firmType: 'SERVICE',
    followersCount: 5200,
    posts: [
      {
        id: 'dc-post-1',
        title: 'We closed our Series A 🎉',
        content: 'We just closed our Series A. 🎉 $40M led by top-tier investors to expand our automated code security platform into Europe.\n\nThe gap between "AI-powered" marketing copy and what\'s actually running in production is enormous. We built the platform to close that gap for real engineering teams.',
        timestamp: '2026-07-16T09:00:00.000Z',
        reactions: { likes: 128, comments: 34 },
        mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop',
      },
      {
        id: 'dc-post-2',
        content: 'Just wrapped a continuous security scan across a Fortune 100 company\'s entire codebase — 40M+ lines, 1,200+ critical vulnerabilities caught before they ever reached production.\n\nCurrently hiring ML engineers and security researchers. Link in Firm Details.',
        timestamp: '2026-07-03T14:20:00.000Z',
        reactions: { likes: 61, comments: 9 },
      },
    ],
    services: [
      { title: 'Automated Code Review', description: 'ML-driven bug and vulnerability detection before merge.' },
      { title: 'Security Analysis Platform', description: 'Continuous scanning for supply-chain and dependency vulnerabilities.' },
      { title: 'Enterprise Deployment', description: 'On-prem and private cloud options for regulated industries.' },
    ],
    team: [
      { name: 'Oliver Bennett', role: 'CEO & Co-Founder', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
      { name: 'Dr. Priya Raman', role: 'Chief Scientist', avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&h=200&fit=crop&crop=face' },
      { name: 'Tomasz Kowalski', role: 'VP Engineering', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
    ],
    locations: [
      { city: 'London', address: '1 Shoreditch High Street, E1 6PN', type: 'Headquarters' },
      { city: 'Remote', address: 'Distributed across the EU', type: 'Engineering Team' },
    ],
    insights: { employeeGrowth: '+35%', avgTenure: '2.4 years' },
    portfolio: [
      {
        title: 'Series B Funding Close',
        description: 'Raised $40M to expand the automated code security platform into Europe.',
        category: 'Company Milestone',
        result: '$40M Series B led by top-tier investors.',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop',
      },
      {
        title: 'Fortune 100 Security Rollout',
        description: 'Deployed continuous scanning across a Fortune 100 company\'s entire codebase.',
        category: 'Enterprise Security',
        result: 'Scanned 40M+ lines of code, caught 1,200+ critical vulnerabilities.',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop',
      },
    ],
    resources: [
      { title: 'State of AI Code Security 2026', type: 'WHITEPAPER', description: 'Annual research report on ML-assisted vulnerability detection.' },
    ],
    jobs: [
      { id: 'dc-1', title: 'ML Engineer', location: 'London (Hybrid)', type: 'Full-time' },
      { id: 'dc-2', title: 'Security Researcher', location: 'Remote (EU)', type: 'Full-time' },
    ],
    recognitions: [
      { id: 'dc-r1', label: 'SOC 2 Type II Certified', sublabel: '2024' },
      { id: 'dc-r2', label: 'Best AI Security Startup', sublabel: 'TechCrunch Disrupt · 2026' },
    ],
    milestones: [
      { id: 'dc-m1', period: '2026', title: 'Closed $40M Series B', org: 'Funding Round' },
      { id: 'dc-m2', period: '2025', title: 'Fortune 100 security rollout — 40M+ lines scanned', org: 'Enterprise Security' },
      { id: 'dc-m3', period: '2023', title: 'Seed round closed', org: 'Funding Round' },
      { id: 'dc-m4', period: '2022', title: 'Company founded', org: 'London, UK' },
    ],
    partnerSlugs: ['azure-health', 'meridian-capital'],
  },

  'meridian-capital': {
    id: 'meridian-capital',
    name: 'Meridian Capital',
    tagline: 'Venture Capital',
    foundedYear: 2010,
    employeeCount: '35',
    bio: 'Meridian Capital partners with ambitious founders building the next generation of enterprise software. We bring capital, networks, and deep operational expertise.',
    firmType: 'SERVICE',
    followersCount: 18700,
    posts: [
      {
        id: 'mc-post-1',
        title: 'We just made our 41st investment',
        content: 'We just made our 41st investment — a company building ERP software specifically for trade finance intermediaries. $9T market, still running on manual processes and spreadsheets. The incumbent software is 25 years old.\n\nPerfect storm. Excited to partner with this team.',
        timestamp: '2026-07-09T10:30:00.000Z',
        reactions: { likes: 55, comments: 13 },
        mediaUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=800&h=500&fit=crop',
      },
      {
        id: 'mc-post-2',
        content: 'Closed a new $280M fund targeting B2B software and trade infrastructure companies this quarter. Grateful to our LPs for the continued conviction in this thesis.',
        timestamp: '2026-06-20T08:45:00.000Z',
        reactions: { likes: 43, comments: 5 },
      },
    ],
    services: [
      { title: 'Growth Equity Investment', description: '$5M–$50M checks for Series B+ B2B software companies.' },
      { title: 'M&A Advisory', description: 'Buy-side and sell-side support for portfolio companies.' },
      { title: 'Operational Support', description: 'Access to a network of go-to-market and finance operators.' },
    ],
    team: [
      { name: 'William Hartley', role: 'Managing Partner', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face' },
      { name: 'Sofia Alvarez', role: 'Partner', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
      { name: 'Grace Liu', role: 'Principal', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face' },
    ],
    locations: [
      { city: 'New York', address: '245 Park Avenue, NY 10167', type: 'Headquarters' },
      { city: 'San Francisco', address: '1 Market Street, CA 94105', type: 'West Coast Office' },
    ],
    insights: { employeeGrowth: '+9%', avgTenure: '5.1 years' },
    portfolio: [
      {
        title: '41st Portfolio Investment',
        description: 'Backed a company building ERP software specifically for trade finance intermediaries.',
        category: 'Enterprise Software',
        result: 'A $9T market still running on manual processes.',
        imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=500&fit=crop',
      },
      {
        title: '$280M Fund Close',
        description: 'Closed a new fund targeting B2B software and trade infrastructure companies.',
        category: 'Fund Milestone',
        result: '$280M in committed capital.',
        imageUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=800&h=500&fit=crop',
      },
    ],
    jobs: [
      { id: 'mc-1', title: 'Investment Associate', location: 'New York, NY', type: 'Full-time' },
      { id: 'mc-2', title: 'Portfolio Operations Manager', location: 'San Francisco, CA', type: 'Full-time' },
    ],
    recognitions: [
      { id: 'mc-r1', label: 'Top 50 B2B VC Firms', sublabel: 'PitchBook · 2025' },
      { id: 'mc-r2', label: 'ESG Investment Leadership Award', sublabel: '2024' },
    ],
    milestones: [
      { id: 'mc-m1', period: '2026', title: 'Closed $280M fund for B2B software & trade infrastructure', org: 'Fund Milestone' },
      { id: 'mc-m2', period: '2024', title: '41st portfolio investment — trade finance ERP', org: 'Enterprise Software' },
      { id: 'mc-m3', period: '2017', title: 'Opened San Francisco office', org: 'West Coast Office' },
      { id: 'mc-m4', period: '2010', title: 'Company founded', org: 'New York, USA' },
    ],
    partnerSlugs: ['deepcode-ai', 'global-logilink'],
  },

  'artisan-bloom': {
    id: 'artisan-bloom',
    name: 'Artisan Bloom',
    tagline: 'Sustainable Retail',
    foundedYear: 2021,
    employeeCount: '62',
    bio: 'Connecting local artisans with a global audience, Artisan Bloom celebrates craftsmanship and ethical fashion.',
    firmType: 'SERVICE',
    followersCount: 4300,
    posts: [
      {
        id: 'ab-post-1',
        title: 'Artisan spotlight: Tuscany Leatherworks',
        content: 'This month\'s artisan spotlight: a family-run leather workshop in Tuscany we\'ve featured in a dedicated storytelling campaign. 300% sales growth for the maker since launch.\n\nBrand isn\'t just aesthetics — it\'s the shortcut a buyer uses to decide if a small maker is worth their time.',
        timestamp: '2026-07-13T11:00:00.000Z',
        reactions: { likes: 62, comments: 10 },
        mediaUrl: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=500&fit=crop',
      },
      {
        id: 'ab-post-2',
        content: 'We finished replacing every shipping material across our catalog with compostable alternatives. 12 tons of plastic waste eliminated in year one. Zero-plastic shipping, permanently, not just for a launch campaign.',
        timestamp: '2026-06-22T09:15:00.000Z',
        reactions: { likes: 38, comments: 6 },
      },
    ],
    services: [
      { title: 'Curated Marketplace', description: 'Vetted artisans across 20+ countries, ethically sourced goods.' },
      { title: 'Artisan Partnership Program', description: 'Fair-trade sourcing and fulfillment support for independent makers.' },
      { title: 'Sustainable Packaging', description: 'Zero-plastic shipping across the entire catalog.' },
    ],
    team: [
      { name: 'Giulia Romano', role: 'Founder & CEO', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' },
      { name: 'Marco Conti', role: 'Head of Artisan Relations', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=face' },
      { name: 'Elena Marchetti', role: 'Creative Director', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' },
    ],
    locations: [
      { city: 'Florence', address: 'Via de\' Tornabuoni 12, 50123', type: 'Headquarters' },
      { city: 'Milan', address: 'Via Montenapoleone 8, 20121', type: 'Design Studio' },
    ],
    insights: { employeeGrowth: '+27%', avgTenure: '2.9 years' },
    portfolio: [
      {
        title: 'Artisan Spotlight — Tuscany Leatherworks',
        description: 'Featured a family-run leather workshop in a dedicated storytelling campaign.',
        category: 'Artisan Partnership',
        result: '300% sales growth for the partnered maker.',
        imageUrl: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=500&fit=crop',
      },
      {
        title: 'Zero-Plastic Packaging Rollout',
        description: 'Replaced all shipping materials across the catalog with compostable alternatives.',
        category: 'Sustainability',
        result: 'Eliminated 12 tons of plastic waste in year one.',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop',
      },
    ],
    jobs: [
      { id: 'ab-1', title: 'Artisan Partnerships Manager', location: 'Florence, Italy', type: 'Full-time' },
      { id: 'ab-2', title: 'Supply Chain Coordinator', location: 'Milan, Italy', type: 'Full-time' },
    ],
    recognitions: [
      { id: 'ab-r1', label: 'Fair Trade Certified', sublabel: '2022' },
      { id: 'ab-r2', label: 'Sustainable Retailer of the Year', sublabel: 'Italian Fashion Council · 2025' },
    ],
    milestones: [
      { id: 'ab-m1', period: '2026', title: 'Zero-plastic packaging rollout complete', org: 'Sustainability' },
      { id: 'ab-m2', period: '2024', title: 'Tuscany Leatherworks spotlight — 300% sales growth for maker', org: 'Artisan Partnership' },
      { id: 'ab-m3', period: '2022', title: 'Opened Milan design studio', org: 'Design Studio' },
      { id: 'ab-m4', period: '2021', title: 'Company founded', org: 'Florence, Italy' },
    ],
    partnerSlugs: ['ecostream-solutions', 'global-logilink'],
  },
};
