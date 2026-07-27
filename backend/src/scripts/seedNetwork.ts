import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const firms = [
  {
    name: 'EcoStream Solutions',
    slug: 'ecostream-solutions',
    description: 'Sustainable water management and filtration systems for industrial applications.',
    industry: 'Environmental Services',
    country: 'Germany',
    capabilities: ['Filtration', 'Water Recycling', 'Consulting'],
    about: 'Founded in 2015, EcoStream has been at the forefront of sustainable industrial solutions. We help companies reduce their environmental footprint while optimizing operational efficiency.',
    website: 'https://ecostream.solutions',
    logo: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop',
  },
  {
    name: 'NovaTech Robotics',
    slug: 'novatech-robotics',
    description: 'Advanced automation and robotic arms for precision manufacturing.',
    industry: 'Manufacturing',
    country: 'Japan',
    capabilities: ['Robotics', 'AI', 'Automation'],
    about: 'NovaTech Robotics is a leader in precision manufacturing automation. Our robotic arms are used by the world\'s leading automotive and electronics manufacturers.',
    website: 'https://novatech.jp',
    logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
  },
  {
    name: 'Global LogiLink',
    slug: 'global-logilink',
    description: 'Next-generation logistics and supply chain optimization for global enterprises.',
    industry: 'Logistics',
    country: 'USA',
    capabilities: ['Shipping', 'Warehousing', 'Last-mile Delivery'],
    about: 'We connect the world through efficient logistics. Our platform provides real-time tracking and optimization for complex global supply chains.',
    website: 'https://logilink.com',
    logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=400&fit=crop',
  },
  {
    name: 'Azure Health Systems',
    slug: 'azure-health',
    description: 'Integrated healthcare technology and patient management software.',
    industry: 'Healthcare',
    country: 'Canada',
    capabilities: ['Telemedicine', 'EHR', 'Patient Portal'],
    about: 'Azure Health provides modern software solutions for clinics and hospitals, focusing on patient experience and data security.',
    website: 'https://azurehealth.ca',
    logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop',
  },
  {
    name: 'Solaris Energy',
    slug: 'solaris-energy',
    description: 'Renewable energy infrastructure and large-scale solar farm development.',
    industry: 'Energy',
    country: 'Spain',
    capabilities: ['Solar Panels', 'Energy Storage', 'Grid Integration'],
    about: 'Solaris Energy is powering the transition to a sustainable future with large-scale solar installations across Europe and North Africa.',
    website: 'https://solaris-energy.es',
    logo: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=400&fit=crop',
  },
  {
    name: 'DeepCode AI',
    slug: 'deepcode-ai',
    description: 'Machine learning platforms for automated code review and security analysis.',
    industry: 'Technology',
    country: 'UK',
    capabilities: ['Machine Learning', 'Cybersecurity', 'SaaS'],
    about: 'DeepCode AI uses advanced neural networks to find bugs and security vulnerabilities in code before they reach production.',
    website: 'https://deepcode.ai',
    logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=400&fit=crop',
  },
  {
    name: 'Meridian Capital',
    slug: 'meridian-capital',
    description: 'Growth equity and venture capital for B2B technology companies.',
    industry: 'Finance',
    country: 'USA',
    capabilities: ['Venture Capital', 'Growth Equity', 'M&A Advisory'],
    about: 'Meridian Capital partners with ambitious founders building the next generation of enterprise software. We bring capital, networks, and deep operational expertise.',
    website: 'https://meridiancapital.com',
    logo: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=400&fit=crop',
  },
  {
    name: 'Artisan Bloom',
    slug: 'artisan-bloom',
    description: 'Curated marketplace for sustainable fashion and handcrafted goods.',
    industry: 'Retail',
    country: 'Italy',
    capabilities: ['Fashion', 'Handmade', 'Eco-friendly'],
    about: 'Connecting local artisans with a global audience, Artisan Bloom celebrates craftsmanship and ethical fashion.',
    website: 'https://artisanbloom.it',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
  },
  {
    name: 'Ember & Oak',
    slug: 'ember-and-oak',
    description: 'Wood-fired American cuisine in the heart of downtown Austin.',
    industry: 'Restaurant & Food Service',
    country: 'USA',
    capabilities: ['Wood-Fired Cooking', 'Craft Cocktails', 'Private Dining'],
    about: 'Founded in 2018, Ember & Oak brings live-fire cooking to downtown Austin — everything from the ribeye to the mushrooms passes over an open oak fire. We work directly with regional farms and source seasonally, changing the menu with the harvest.',
    website: 'https://emberandoak.com',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop',
  },
];

// Products keyed by firm slug — gives each firm's "Request Service" card
// real, industry-specific offerings instead of the generic consulting
// fallback the UI shows when a company has none.
const productsBySlug: Record<string, Array<{ name: string; description: string; price: number; currency?: string; category: string; imageUrl?: string; stock?: number }>> = {
  'ecostream-solutions': [
    { name: 'Industrial Filtration System', description: 'Custom-engineered filtration unit sized for high-volume manufacturing plants.', price: 48000, category: 'Equipment', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop' },
    { name: 'Closed-Loop Water Recycling Retrofit', description: 'End-to-end redesign of intake/discharge pipelines around a closed-loop recycling core.', price: 125000, category: 'Installation', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&h=400&fit=crop' },
    { name: 'Environmental Compliance Audit', description: 'Site audit and regulatory compliance strategy for water-intensive industries.', price: 9500, category: 'Consulting' },
  ],
  'novatech-robotics': [
    { name: 'Precision Robotic Arm — Series 7', description: 'Sub-millimeter accuracy robotic arm for automotive and electronics assembly lines.', price: 62000, category: 'Hardware', imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop' },
    { name: 'Automation Integration Package', description: 'Full deployment, calibration, and line integration for factory floors.', price: 35000, category: 'Integration' },
    { name: 'Predictive Maintenance Subscription', description: 'Sensor-driven uptime monitoring across your robotic fleet, billed annually.', price: 8400, currency: 'USD', category: 'Subscription' },
  ],
  'global-logilink': [
    { name: 'Global Freight Forwarding — Standard Lane', description: 'Door-to-door freight across our core ocean and air lanes.', price: 2200, category: 'Shipping' },
    { name: 'Warehousing & Fulfillment Package', description: 'Strategic storage and pick-pack-ship across 50+ countries.', price: 4800, category: 'Warehousing', imageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&h=400&fit=crop' },
    { name: 'Real-Time Tracking API License', description: 'End-to-end shipment visibility through a single API, annual license.', price: 12000, category: 'Software' },
  ],
  'azure-health': [
    { name: 'Telemedicine Platform License', description: 'HIPAA/PIPEDA-compliant virtual care platform, per-clinic annual license.', price: 18000, category: 'Software', imageUrl: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=600&h=400&fit=crop' },
    { name: 'EHR Integration Package', description: 'Seamless records interoperability rollout across providers and legacy systems.', price: 42000, category: 'Integration' },
    { name: 'Patient Portal Setup', description: 'Self-service scheduling, billing, and secure messaging, configured for your clinic.', price: 9000, category: 'Software' },
  ],
  'solaris-energy': [
    { name: 'Utility-Scale Solar Installation (per MW)', description: 'Site assessment through grid connection for large-scale solar farms.', price: 780000, category: 'Installation', imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop' },
    { name: 'Battery Energy Storage System', description: 'Grid-scale battery integration for reliable 24/7 renewable supply.', price: 210000, category: 'Equipment' },
    { name: 'Grid Interconnection Consulting', description: 'Regulatory strategy and interconnection support for renewable projects.', price: 22000, category: 'Consulting' },
  ],
  'deepcode-ai': [
    { name: 'Code Security Scan — Enterprise', description: 'Continuous ML-driven vulnerability scanning across your entire codebase, annual.', price: 36000, category: 'Subscription', imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop' },
    { name: 'On-Prem Enterprise Deployment', description: 'Private cloud / on-prem deployment for regulated industries.', price: 65000, category: 'Deployment' },
    { name: 'Dependency & Supply-Chain Audit', description: 'One-time deep audit of third-party dependencies and supply-chain risk.', price: 14000, category: 'Consulting' },
  ],
  'meridian-capital': [
    { name: 'Growth Equity Investment (Series B+)', description: '$5M–$50M check size for B2B software companies, terms negotiated per deal.', price: 5000000, category: 'Investment' },
    { name: 'M&A Advisory Engagement', description: 'Buy-side or sell-side advisory support for a portfolio company transaction.', price: 85000, category: 'Advisory' },
    { name: 'Operational Support Retainer', description: 'Monthly access to our go-to-market and finance operator network.', price: 6000, category: 'Retainer' },
  ],
  'artisan-bloom': [
    { name: 'Handwoven Leather Tote', description: 'Full-grain leather tote, handcrafted by a partner workshop in Tuscany.', price: 285, category: 'Bags', imageUrl: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&h=400&fit=crop' },
    { name: 'Hand-Thrown Ceramic Vase Set', description: 'Set of 3 stoneware vases, glazed and fired by independent ceramicists.', price: 145, category: 'Home', imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600&h=400&fit=crop' },
    { name: 'Undyed Wool Throw Blanket', description: 'Hand-loomed wool throw from a family cooperative, naturally undyed.', price: 165, category: 'Home', imageUrl: 'https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=600&h=400&fit=crop' },
  ],
  'ember-and-oak': [
    { name: 'Wood-Fired Ribeye', description: '16oz dry-aged ribeye, charred over oak, bone marrow butter.', price: 52, category: 'Mains', imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop' },
    { name: 'Charred Octopus', description: 'Wood-fired octopus, smoked paprika aioli, fingerling potatoes.', price: 18, category: 'Starters', imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop' },
    { name: 'Wine Dinner Series — Seat', description: 'Four courses, four wines, one long table. Last Thursday of the month.', price: 145, category: 'Events' },
  ],
};

// Open roles keyed by firm slug — gives each firm's new "Jobs" tab real,
// industry-specific listings instead of showing up empty.
interface JobSeed {
  title: string;
  location?: string;
  type?: string;
  description?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  benefits?: string[];
  qualifications?: string[];
}

const STANDARD_BENEFITS = ['Health, dental & vision insurance', 'Paid time off', '401(k) / retirement matching', 'Remote-friendly hybrid schedule'];

const jobsBySlug: Record<string, JobSeed[]> = {
  'ecostream-solutions': [
    { title: 'Water Treatment Process Engineer', location: 'Hamburg, Germany', type: 'Full-time', description: 'Design and optimize closed-loop filtration systems for industrial clients, from feasibility studies through commissioning.', salaryMin: 65000, salaryMax: 85000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ["Bachelor's degree in Chemical, Environmental, or Process Engineering", '3+ years designing industrial water treatment systems', 'Familiarity with EU environmental compliance standards'] },
    { title: 'Environmental Compliance Analyst', location: 'Hamburg, Germany (Hybrid)', type: 'Full-time', description: 'Track evolving water-discharge regulations across our EU deployments and translate them into engineering requirements.', salaryMin: 52000, salaryMax: 68000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['2+ years in environmental compliance or regulatory affairs', 'Strong written German and English', 'Experience with ISO 14001 a plus'] },
    { title: 'Field Service Technician', location: 'Remote (EU travel)', type: 'Full-time', description: 'Install and maintain filtration hardware on-site at client plants across Western Europe, roughly 60% travel.', salaryMin: 42000, salaryMax: 54000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['Valid EU driver\'s license and passport for regular travel', 'Mechanical or industrial maintenance background', 'Comfortable working independently on client sites'] },
  ],
  'novatech-robotics': [
    { title: 'Robotics Engineer', location: 'Nagoya, Japan', type: 'Full-time', description: 'Design and build precision cobot arms for automotive assembly lines, working across mechanical, electrical, and controls.', salaryMin: 7200000, salaryMax: 9800000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ["Bachelor's or Master's in Robotics, Mechatronics, or Mechanical Engineering", '3+ years designing robotic manipulators', 'Proficiency with CAD (SolidWorks or similar)'] },
    { title: 'Firmware Engineer, Motion Control', location: 'Nagoya, Japan (Hybrid)', type: 'Full-time', description: 'Own the real-time control loop firmware for our Series 7 robotic arm, from motor drivers up through the motion planner.', salaryMin: 6800000, salaryMax: 9200000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['Strong C/C++ on embedded real-time systems', 'Experience with motor control (FOC, servo tuning)', 'Familiarity with ROS or similar robotics middleware'] },
    { title: 'Manufacturing Test Intern', location: 'Nagoya, Japan', type: 'Internship', description: 'Support calibration and QA testing on the production floor alongside our manufacturing engineering team.', salaryMin: 220000, salaryMax: 220000, salaryPeriod: 'month', benefits: ['Mentorship from senior robotics engineers', 'Potential full-time offer at internship end'], qualifications: ['Currently pursuing a degree in engineering or a related field', 'Basic understanding of electronics or mechanical systems', 'Available for a minimum 3-month term'] },
  ],
  'global-logilink': [
    { title: 'Senior Logistics Analyst', location: 'New York, NY (Remote)', type: 'Full-time', description: 'Model and optimize multi-modal shipping lanes for enterprise clients using our real-time tracking platform.', salaryMin: 85000, salaryMax: 110000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['4+ years in logistics or supply chain analytics', 'Advanced Excel/SQL; Python a plus', "Bachelor's degree in Supply Chain, Business, or related field"] },
    { title: 'Supply Chain Coordinator', location: 'Chicago, IL', type: 'Full-time', description: 'Coordinate day-to-day freight and warehousing operations across our carrier network.', salaryMin: 55000, salaryMax: 70000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['2+ years in freight coordination or logistics operations', 'Comfortable working across multiple carrier systems', 'Strong written and verbal communication'] },
    { title: 'Warehouse Operations Manager', location: 'Newark, NJ', type: 'Full-time', description: 'Run daily operations for our largest East Coast fulfillment hub, leading a team of 20+ associates.', salaryMin: 68000, salaryMax: 88000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['5+ years warehouse or distribution center management', 'Experience with WMS software', 'Forklift certification preferred'] },
  ],
  'azure-health': [
    { title: 'Full-Stack Engineer, Patient Portal', location: 'Toronto, Canada (Hybrid)', type: 'Full-time', description: 'Build patient-facing scheduling and billing features on our EHR platform using React and Node.', salaryMin: 95000, salaryMax: 125000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['4+ years full-stack web development', 'Experience with React, Node.js, and PostgreSQL', 'Healthcare/HIPAA-adjacent experience a plus'] },
    { title: 'Clinical Implementation Specialist', location: 'Remote (Canada)', type: 'Full-time', description: 'Onboard new clinics onto our telemedicine and EHR products, training staff and configuring workflows.', salaryMin: 60000, salaryMax: 78000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['Clinical or healthcare IT background', 'Comfortable leading live training sessions', 'Willingness to travel occasionally within Canada'] },
    { title: 'HIPAA/PIPEDA Compliance Officer', location: 'Toronto, Canada', type: 'Full-time', description: 'Azure Health Systems builds the telemedicine and EHR infrastructure that clinics across Canada and the US rely on to see patients, bill insurers, and keep records straight — which means privacy and security compliance isn\'t a side function here, it\'s core to the product. We\'re looking for a Compliance Officer to own that function end to end, reporting directly to our VP of Engineering and working closely with Legal, Product, and Customer Success.\n\nWhat you\'ll do:\n• Own our HIPAA (US) and PIPEDA (Canada) compliance programs in their entirety, including policy authorship, employee training, and breach-response procedures.\n• Lead our annual third-party security audits and SOC 2 Type II renewal, coordinating with external auditors and internal engineering leads.\n• Review new features pre-launch for privacy impact, working with Product and Engineering to build compliance in from the start rather than bolting it on afterward.\n• Maintain and continuously improve our Business Associate Agreements (BAAs) with clinic customers and vendor Data Processing Agreements (DPAs) with subprocessors.\n• Run tabletop breach-response exercises with the security and support teams at least twice a year.\n• Serve as the primary point of contact for customer security questionnaires and enterprise procurement reviews.\n• Track evolving provincial and state-level health privacy regulation and translate changes into concrete engineering and policy requirements.\n• Partner with our Clinical Implementation team to make sure new clinic onboarding meets data handling and consent requirements from day one.\n\nWhat success looks like in the first 6 months:\nYou\'ll have completed a full audit of our current BAA/DPA coverage across all active clinic customers, closed any gaps you find, and led that year\'s SOC 2 renewal without any major findings. By month six, Product and Engineering will be looping you into feature design earlier because they\'ve seen the value you add, not because a checklist requires it.\n\nWhy this role matters:\nA single mishandled patient record isn\'t just a compliance line item for us — it\'s someone\'s medical history, and a breach could mean real harm to real patients and real damage to the clinics that trust us with their operations. This role exists because we take that seriously, and we\'re giving it real authority and a seat at the table to match.', salaryMin: 88000, salaryMax: 115000, salaryPeriod: 'year', benefits: [...STANDARD_BENEFITS, 'Annual professional certification & conference budget ($3,000 CAD)', 'Fully covered CIPP/CIPM recertification', 'Hybrid schedule (2 days/week in our Toronto office)', 'Parental leave top-up to 100% salary for 17 weeks'], qualifications: ['5+ years in healthcare data privacy, compliance, or information security', 'Deep working knowledge of PIPEDA and HIPAA (HITECH Act familiarity a plus)', 'Experience leading or directly supporting a SOC 2 Type II audit', 'CIPP/C or CIPP/US certification preferred (CIPM a plus)', 'Comfortable reading technical architecture diagrams well enough to spot privacy risk', 'Excellent written communication — you\'ll be drafting policy that both engineers and auditors need to understand', 'Prior experience in a healthtech, fintech, or other regulated SaaS environment strongly preferred'] },
  ],
  'solaris-energy': [
    { title: 'Solar Installation Project Manager', location: 'Madrid, Spain', type: 'Full-time', description: 'Lead utility-scale solar farm builds from permitting through grid connection, managing subcontractors on site.', salaryMin: 48000, salaryMax: 62000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['5+ years managing utility-scale construction projects', 'PMP certification preferred', 'Fluent Spanish and English'] },
    { title: 'Grid Interconnection Engineer', location: 'Madrid, Spain (Hybrid)', type: 'Full-time', description: 'Manage interconnection studies and utility negotiations for new renewable energy sites across Iberia.', salaryMin: 52000, salaryMax: 70000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ["Bachelor's in Electrical Engineering or related field", '3+ years in grid interconnection or transmission planning', 'Familiarity with Spanish/EU grid codes'] },
    { title: 'Battery Storage Systems Intern', location: 'Madrid, Spain', type: 'Internship', description: 'Support commissioning of grid-scale battery energy storage systems alongside our engineering team.', salaryMin: 1400, salaryMax: 1400, salaryPeriod: 'month', benefits: ['Mentorship from senior energy engineers', 'Hands-on exposure to live commissioning sites'], qualifications: ['Currently pursuing a degree in Electrical or Energy Engineering', 'Interest in renewable energy and grid storage', 'Available for a minimum 6-month term'] },
  ],
  'deepcode-ai': [
    { title: 'Machine Learning Engineer, Security', location: 'London, UK (Remote)', type: 'Full-time', description: 'Train and ship models that detect vulnerabilities in production codebases, working across the full ML lifecycle.', salaryMin: 75000, salaryMax: 105000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['3+ years in applied ML or NLP', 'Strong Python and PyTorch/TensorFlow experience', 'Interest in software security a plus'] },
    { title: 'Security Researcher', location: 'London, UK', type: 'Full-time', description: 'Hunt for novel vulnerability classes to feed our detection models, and publish findings to our research blog.', salaryMin: 80000, salaryMax: 115000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['4+ years in application security or vulnerability research', 'Track record of CVE disclosures a plus', 'Comfortable reverse engineering unfamiliar codebases'] },
    { title: 'Enterprise Solutions Architect', location: 'Remote (EU)', type: 'Full-time', description: 'Own on-prem and private-cloud deployments for regulated enterprise customers, from scoping through go-live.', salaryMin: 90000, salaryMax: 120000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['5+ years in enterprise solutions architecture or DevOps', 'Experience with Kubernetes and private cloud deployments', 'Strong client-facing communication skills'] },
  ],
  'meridian-capital': [
    { title: 'Investment Associate', location: 'New York, NY', type: 'Full-time', description: 'Source and evaluate Series B+ growth equity opportunities in B2B software, and support diligence on live deals.', salaryMin: 110000, salaryMax: 150000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['2-4 years in investment banking, private equity, or venture capital', 'Strong financial modeling skills', "Bachelor's degree in Finance, Economics, or related field"] },
    { title: 'M&A Advisory Analyst', location: 'New York, NY', type: 'Full-time', description: 'Support buy-side and sell-side transactions for portfolio companies, building models and materials for live deals.', salaryMin: 90000, salaryMax: 120000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['1-3 years in investment banking or transaction advisory', 'Advanced Excel and PowerPoint skills', 'Ability to work under tight deal timelines'] },
    { title: 'Platform Operations Associate', location: 'Remote (US)', type: 'Full-time', description: 'Run the go-to-market and finance operator network for portfolio founders, connecting them with the right operators.', salaryMin: 75000, salaryMax: 95000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['2+ years in operations, GTM, or portfolio support roles', 'Strong project management and relationship-building skills', 'Comfortable working with early- and growth-stage founders'] },
  ],
  'artisan-bloom': [
    { title: 'Artisan Partnerships Manager', location: 'Florence, Italy', type: 'Full-time', description: 'Build relationships with independent workshops across Italy and expand our maker network into new regions.', salaryMin: 32000, salaryMax: 42000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['3+ years in partnerships, sourcing, or vendor management', 'Fluent Italian and English', 'Genuine interest in artisan craft and sustainable fashion'] },
    { title: 'E-commerce Marketing Specialist', location: 'Florence, Italy (Hybrid)', type: 'Full-time', description: 'Grow our marketplace storefront through content and paid channels, owning the calendar end to end.', salaryMin: 28000, salaryMax: 38000, salaryPeriod: 'year', benefits: STANDARD_BENEFITS, qualifications: ['2+ years in e-commerce or digital marketing', 'Experience with Meta/Google Ads and email platforms', 'Portfolio of content work a plus'] },
    { title: 'Quality & Sourcing Coordinator', location: 'Remote (EU)', type: 'Part-time', description: 'Vet new artisan partners for craftsmanship and ethical sourcing standards before they join the marketplace.', salaryMin: 18, salaryMax: 24, salaryPeriod: 'hour', benefits: ['Flexible remote schedule'], qualifications: ['Background in textiles, ceramics, or a related craft field', 'Detail-oriented with strong written communication', 'Available roughly 20 hours per week'] },
  ],
  'ember-and-oak': [
    { title: 'Sous Chef', location: 'Austin, TX', type: 'Full-time', description: 'Run the wood-fire line and help shape our seasonal menu alongside the executive chef.', salaryMin: 55000, salaryMax: 68000, salaryPeriod: 'year', benefits: ['Health insurance', 'Paid time off', 'Staff meals', 'Employee dining discount'], qualifications: ['3+ years as a sous chef or senior line cook', 'Live-fire/wood-fired cooking experience preferred', 'ServSafe certification'] },
    { title: 'Front of House Manager', location: 'Austin, TX', type: 'Full-time', description: 'Lead the floor team and own the guest experience during service, from reservations through closing.', salaryMin: 52000, salaryMax: 62000, salaryPeriod: 'year', benefits: ['Health insurance', 'Paid time off', 'Staff meals', 'Employee dining discount'], qualifications: ['2+ years restaurant management experience', 'Strong leadership and conflict-resolution skills', 'Flexible evening and weekend availability'] },
    { title: 'Pastry Cook', location: 'Austin, TX', type: 'Part-time', description: 'Develop and execute our rotating dessert menu, including the Basque cheesecake.', salaryMin: 19, salaryMax: 24, salaryPeriod: 'hour', benefits: ['Staff meals', 'Employee dining discount'], qualifications: ['1+ years pastry or bakery experience', 'Comfortable working early-morning prep shifts', 'Portfolio or trail welcomed'] },
  ],
};

const users = [
  {
    email: 'alex.rivera@example.com',
    firstName: 'Alex',
    lastName: 'Rivera',
    headline: 'Senior Supply Chain Consultant',
    bio: 'Helping businesses optimize their logistics through AI and sustainable practices. 10+ years in global operations.',
    address: 'Chicago, Illinois',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    website: 'https://alexrivera.consulting',
  },
  {
    email: 'sarah.chen@example.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    headline: 'Product Designer · UX Lead at NovaTech',
    bio: 'Focused on human-centric design for the next generation of industrial robotics and enterprise tools.',
    address: 'San Francisco, California',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    website: 'https://sarahchen.design',
  },
  {
    email: 'marcus.thorn@example.com',
    firstName: 'Marcus',
    lastName: 'Thorn',
    headline: 'VP of Operations · Manufacturing & Industry 4.0',
    bio: 'Driving operational excellence and digital transformation. Former McKinsey. Now building the future of smart manufacturing.',
    address: 'Berlin, Germany',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'elena.rodriguez@example.com',
    firstName: 'Elena',
    lastName: 'Rodriguez',
    headline: 'Sustainability Lead · Climate Tech Advisor',
    bio: 'Dedicated to implementing green energy solutions for global enterprises. Speaker, author, and climate advocate.',
    address: 'Madrid, Spain',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    website: 'https://elenasustainability.com',
  },
  {
    email: 'james.okafor@example.com',
    firstName: 'James',
    lastName: 'Okafor',
    headline: 'CTO & Co-founder · Building the future of fintech',
    bio: 'Serial entrepreneur with 3 exits. Currently building AI-powered payment infrastructure for emerging markets.',
    address: 'Lagos, Nigeria',
    avatarUrl: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&h=200&fit=crop&crop=face',
    website: 'https://jamesokafor.tech',
  },
  {
    email: 'priya.nair@example.com',
    firstName: 'Priya',
    lastName: 'Nair',
    headline: 'Data Scientist · ML Engineer · AI Researcher',
    bio: 'PhD in Computer Science. Passionate about applied ML in healthcare and logistics. Open to collaborations.',
    address: 'Bangalore, India',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'lucas.fontaine@example.com',
    firstName: 'Lucas',
    lastName: 'Fontaine',
    headline: 'Head of Growth · B2B SaaS · Revenue Operations',
    bio: 'Scaled three SaaS companies from 0 to $10M ARR. Now advising early-stage startups on go-to-market strategy.',
    address: 'Paris, France',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'yuki.tanaka@example.com',
    firstName: 'Yuki',
    lastName: 'Tanaka',
    headline: 'Robotics Engineer · Automation Specialist',
    bio: 'Building next-gen robotic systems at the intersection of AI and mechanical engineering. 8 patents filed.',
    address: 'Tokyo, Japan',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'anna.kowalski@example.com',
    firstName: 'Anna',
    lastName: 'Kowalski',
    headline: 'CFO · Strategic Finance · Venture-backed Startups',
    bio: 'Finance executive specializing in hypergrowth companies. Helping founders build financial infrastructure that scales.',
    address: 'Warsaw, Poland',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'omar.hassan@example.com',
    firstName: 'Omar',
    lastName: 'Hassan',
    headline: 'Global Trade & Logistics Director',
    bio: 'Specializing in cross-border trade compliance and supply chain resilience. Based in Dubai, operating globally.',
    address: 'Dubai, UAE',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'camille.dupont@example.com',
    firstName: 'Camille',
    lastName: 'Dupont',
    headline: 'Brand Strategist · Marketing Director',
    bio: 'Crafting brand narratives that resonate. 12 years helping B2B companies turn their story into pipeline.',
    address: 'Lyon, France',
    avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'david.kim@example.com',
    firstName: 'David',
    lastName: 'Kim',
    headline: 'Software Architect · Cloud Infrastructure',
    bio: 'Building resilient distributed systems at scale. Previously at Google and AWS. Open source contributor.',
    address: 'Seoul, South Korea',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'fatima.al-rashid@example.com',
    firstName: 'Fatima',
    lastName: 'Al-Rashid',
    headline: 'Healthcare Innovation Lead · Digital Health',
    bio: 'Working at the intersection of medicine and technology to make healthcare more equitable and accessible.',
    address: 'Riyadh, Saudi Arabia',
    avatarUrl: 'https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'tom.bradley@example.com',
    firstName: 'Tom',
    lastName: 'Bradley',
    headline: 'Venture Partner · Early Stage Investor',
    bio: 'Invested in 40+ companies across SaaS, fintech, and climate tech. Thesis: boring industries, interesting software.',
    address: 'London, UK',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'isabella.santos@example.com',
    firstName: 'Isabella',
    lastName: 'Santos',
    headline: 'People Operations · Culture & Talent Lead',
    bio: 'Helping fast-growing companies build cultures where people do their best work. Former Spotify, Notion.',
    address: 'São Paulo, Brazil',
    avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'nikolai.petrov@example.com',
    firstName: 'Nikolai',
    lastName: 'Petrov',
    headline: 'Cybersecurity Expert · CISO · Threat Intelligence',
    bio: 'Protecting enterprises from the evolving threat landscape. 15 years in offensive and defensive security.',
    address: 'Amsterdam, Netherlands',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'mei.zhang@example.com',
    firstName: 'Mei',
    lastName: 'Zhang',
    headline: 'E-commerce Director · Cross-border Trade',
    bio: 'Building e-commerce bridges between Asia and Western markets. Passionate about empowering SMEs to go global.',
    address: 'Shanghai, China',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop&crop=face',
  },
  {
    email: 'carlos.mendes@example.com',
    firstName: 'Carlos',
    lastName: 'Mendes',
    headline: 'Sales Director EMEA · Enterprise Software',
    bio: 'Revenue leader with a track record of building high-performance enterprise sales teams across Europe.',
    address: 'Lisbon, Portugal',
    avatarUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face',
  },
];

// Posts keyed by author email
const postTemplates = [
  {
    authorEmail: 'alex.rivera@example.com',
    posts: [
      {
        content: `Just wrapped up a 6-month supply chain audit for a Fortune 500 manufacturer. Key finding: 34% of their delays came from 3 supplier bottlenecks they had zero visibility into.\n\nThe fix wasn't technology — it was communication protocols. We set up weekly supplier scorecards and response SLAs. Delays dropped 40% in the first month.\n\nSometimes the best supply chain solution is a well-structured conversation. 🤝`,
      },
      {
        content: `Hot take: Most companies don't have a supply chain problem. They have a data visibility problem.\n\nYou can't optimize what you can't see. Before buying another logistics platform, ask yourself: do your procurement, ops, and finance teams even look at the same numbers?\n\nFix the data first. The optimization follows.`,
      },
      {
        content: `Attending the Global Logistics Summit in Chicago next week. If you're working on supply chain resilience or nearshoring strategies, let's find time to connect.\n\nAlways happy to exchange notes on what's actually working in 2026 vs. what looks good in a deck.`,
        mediaUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop',
      },
    ],
  },
  {
    authorEmail: 'sarah.chen@example.com',
    posts: [
      {
        content: `Design principle I keep coming back to: the best interfaces don't feel like software.\n\nSpent this week watching factory floor workers use an app we designed. The ones who struggled weren't struggling with "UX" — they were fighting their own muscle memory.\n\nWe redesigned the primary action to match the physical gesture they already use to operate the machine. Adoption went from 23% to 91% in two weeks. Design is context.`,
      },
      {
        content: `We just shipped a redesigned dashboard for our robotics monitoring platform and the feedback from operators has been incredible.\n\nMy favorite comment: "It finally looks like something I want to look at."\n\nEnterprise software doesn't have to be ugly. That's a choice, not a constraint.`,
        mediaUrl: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&h=500&fit=crop',
      },
      {
        title: '5 things I learned designing for factory floors',
        content: `1. Gloves make precise taps impossible — design for fat fingers\n2. Bright ambient light washes out screens — test your contrast ratios in daylight\n3. Workers check dashboards in 3-second bursts — hierarchy is everything\n4. Error messages need to tell you what to DO, not what went wrong\n5. If you have to explain it, you've already lost\n\nIndustrial UX is underrated and underserviced. Huge opportunity here.`,
      },
    ],
  },
  {
    authorEmail: 'marcus.thorn@example.com',
    posts: [
      {
        content: `Digital transformation stat that should keep every ops director up at night:\n\nOnly 16% of digital transformation initiatives in manufacturing reach their original goals. (McKinsey, 2025)\n\nThe failure pattern is almost always the same: great technology, terrible change management. The machine learns faster than the organization.\n\nWhat are you doing differently?`,
      },
      {
        content: `I used to believe the future of manufacturing was fully autonomous. After 15 years on factory floors across 3 continents, I've changed my mind.\n\nThe future is collaborative automation — where humans and machines each do what they're best at. The challenge isn't replacing people. It's redesigning roles.\n\nWe need more process designers, exception managers, and quality arbiters. Fewer button-pushers, more system thinkers.`,
        mediaUrl: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=500&fit=crop',
      },
    ],
  },
  {
    authorEmail: 'elena.rodriguez@example.com',
    posts: [
      {
        content: `Just back from Valencia where we commissioned our 40th solar installation this year.\n\n Total capacity added: 280 MW\nHouseholds powered: ~190,000\nCO₂ offset (annual): ~120,000 tonnes\n\nNumbers matter. But the real milestone is that solar is now the cheapest form of electricity ever produced in human history. The economics have permanently shifted. 🌍☀️`,
        mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop',
      },
      {
        content: `Controversial opinion: ESG reporting, as it's currently done, does more harm than good.\n\nMost companies treat it as a compliance exercise. 80-page reports full of frameworks nobody reads. Zero accountability. Zero feedback loops.\n\nWhat if companies published a single, audited metric: tonnes of CO₂ per million EUR of revenue, year over year. That's it. One number. Make it comparable. Make it consequential.\n\nSimplicity creates accountability.`,
      },
      {
        content: `Speaking at the European Clean Energy Forum in Berlin next month on "The Pragmatic Path to Net Zero."\n\nThe biggest thing I've learned after 12 years in this space: perfection is the enemy of progress. Companies waiting for the perfect carbon accounting framework will still be waiting in 2040.\n\nStart messy. Measure something. Improve it.`,
      },
    ],
  },
  {
    authorEmail: 'james.okafor@example.com',
    posts: [
      {
        content: `We just closed our Series A. 🎉\n\nI've been sitting on this news for two weeks because it still doesn't feel real.\n\n$12M led by Meridian Capital to expand our payment rails across West and East Africa. The problem we're solving: 600 million people on this continent move money through informal channels because the formal ones are too slow, too expensive, or simply unavailable.\n\nWe're changing that. More soon.`,
        mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop',
      },
      {
        content: `Something nobody talks about when building in emerging markets: the infrastructure is the feature.\n\nIn markets where internet is spotty and smartphones are shared, the UX playbook from Silicon Valley doesn't apply. We've built our payment flow to work on 2G, with USSD fallback, in 14 languages.\n\nThe constraint IS the innovation.`,
      },
    ],
  },
  {
    authorEmail: 'priya.nair@example.com',
    posts: [
      {
        content: `New paper dropped from our research team: "Federated Learning for Healthcare Data Without Compromising Patient Privacy."\n\nThe core idea: hospitals can train a shared ML model without ever sharing patient records. Each site trains locally, only model weights are aggregated.\n\nWe tested across 8 hospitals in 4 countries. Accuracy matched centralized training within 2%. GDPR-compliant by design.\n\nOpen access link in comments 👇`,
        mediaUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=500&fit=crop',
      },
      {
        content: `Reminder that "AI" in most enterprise software is just:\n- Linear regression with a better UI\n- A large lookup table\n- SQL queries with extra steps\n\nNone of this is bad! It's powerful and practical. But let's call it what it is.\n\nThe gap between "AI-powered" marketing copy and what's actually running in production is enormous. Buyers deserve better transparency.`,
      },
      {
        content: `Currently hiring: ML Engineers (remote, strong preference for candidates with NLP or time-series forecasting background).\n\nWe're a small, research-focused team. You'll work on real problems with real data, not toy datasets. Publication encouraged.\n\nDM me or check the link in my profile. 🚀`,
      },
    ],
  },
  {
    authorEmail: 'lucas.fontaine@example.com',
    posts: [
      {
        content: `Growth channel that nobody talks about enough in B2B SaaS: your existing customers.\n\nWe ran an experiment: instead of increasing our outbound budget, we invested the same amount in a customer success program specifically designed to generate referrals.\n\nResult after 90 days: CAC from referrals = 1/6th of outbound. Close rate = 3x higher. Time to close = 40% shorter.\n\nYour best salespeople are your happiest customers. Are you investing in making them talk?`,
        mediaUrl: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=800&h=500&fit=crop',
      },
      {
        content: `Hot take: Most B2B companies don't have a marketing problem. They have a positioning problem.\n\nIf your ICP can't articulate why they chose you over the alternative in one sentence, you haven't done the positioning work yet.\n\n"We're better" is not positioning. "We're the only platform that does X for Y in Z minutes" — that's positioning.`,
      },
    ],
  },
  {
    authorEmail: 'yuki.tanaka@example.com',
    posts: [
      {
        content: `Filed patent #8 today — a new approach to force-feedback calibration in collaborative robot arms that reduces setup time from 45 minutes to under 4 minutes.\n\nThe breakthrough was surprisingly simple: instead of factory calibration, we let the robot learn its own geometry through a standardized handling sequence on first install.\n\nSometimes the elegant solution hides in the obvious place.`,
        mediaUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=500&fit=crop',
      },
      {
        content: `Visited a car manufacturing plant in Nagoya last week. They're running 200+ cobots alongside human workers on the same assembly line.\n\nMost striking observation: the workers weren't afraid of the robots. They treated them like tools. Because they were involved in the design process.\n\nTechnology adoption is a social problem, not a technical one.`,
      },
    ],
  },
  {
    authorEmail: 'anna.kowalski@example.com',
    posts: [
      {
        content: `CFO lesson I wish I'd learned earlier: your burn rate is not your biggest risk. Your unit economics are.\n\nCompanies with great burn control and broken unit economics die slowly and expensively. Companies with great unit economics and high burn can always raise more capital.\n\nKnow your LTV:CAC. By segment. By channel. By cohort. Everything else is noise.`,
      },
      {
        content: `We just closed our books on Q2 and our gross margin expanded 400bps YoY — without any price increases.\n\nHow: we systematically identified the 20% of customers that consumed 60% of our support costs. Rebuilt onboarding for that segment specifically. Support tickets dropped 35%.\n\nOperational leverage is built one friction point at a time.`,
        mediaUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop',
      },
    ],
  },
  {
    authorEmail: 'omar.hassan@example.com',
    posts: [
      {
        content: `The Red Sea shipping disruptions are still rippling through global trade — 8 months later.\n\nWhat I'm telling clients: the era of "just-in-time" as a default is over. Strategic inventory buffers are no longer a luxury. They're a competitive differentiator.\n\nThe companies that reacted fastest in late 2024 aren't the ones with the most ships. They're the ones with the best data.`,
        mediaUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=500&fit=crop',
      },
      {
        content: `Trade compliance is the unsexy backbone of global commerce.\n\nI've seen $50M deals stall for 3 months because of a misclassified HS code. I've seen companies fined more than their quarterly profit over documentation gaps.\n\nIf your compliance team reports to legal instead of operations, fix that first.`,
      },
    ],
  },
  {
    authorEmail: 'camille.dupont@example.com',
    posts: [
      {
        content: `Unpopular opinion: most B2B companies are terrible at storytelling because they're afraid of having a point of view.\n\nEvery landing page sounds the same. "Powerful platform." "Seamless integration." "Scale with confidence."\n\nThose words mean nothing. What do you actually believe? What are you against? What's the problem you're obsessed with solving?\n\nConviction is a competitive moat. More companies should use it.`,
      },
      {
        content: `Just wrapped a brand sprint with a logistics startup that had the most genuinely interesting product I've seen in years — and the most forgettable brand.\n\nSix weeks later, new positioning, new visual identity, new website. Pipeline doubled in month one after launch.\n\nBrand isn't just aesthetics. It's the shortcut your buyer uses to decide if you're worth their time.`,
        mediaUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=500&fit=crop',
      },
    ],
  },
  {
    authorEmail: 'david.kim@example.com',
    posts: [
      {
        content: `We migrated our entire infrastructure to a multi-region active-active setup last quarter. Zero downtime. Here's what actually made it work:\n\n1. We didn't try to do it all at once\n2. We built the observability first, not last\n3. We practiced the rollback before the rollout\n4. We had one person whose only job was watching dashboards\n\nComplexity is manageable. Surprise is not.`,
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=500&fit=crop',
      },
      {
        content: `Reminder: "serverless" doesn't mean no servers. It means somebody else's servers with somebody else's pricing model.\n\nBefore you go all-in on any managed service, model your costs at 10x current volume. I've seen three startups surprise themselves with cloud bills that exceeded revenue.\n\nThe architecture decision is also a financial decision. Treat it that way.`,
      },
    ],
  },
  {
    authorEmail: 'fatima.al-rashid@example.com',
    posts: [
      {
        content: `Digital health in the Gulf is at an inflection point.\n\nWhen I started in this field 7 years ago, telemedicine adoption in Saudi Arabia was under 2%. Post-pandemic: 67%.\n\nBut adoption is the easy part. The hard part is outcomes. We don't just need more apps. We need better incentive structures that reward health, not just healthcare visits.`,
        mediaUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&h=500&fit=crop',
      },
      {
        content: `Genuinely excited about what AI-assisted diagnostics can do for physician productivity — not replacement, augmentation.\n\nA radiologist can read ~40 scans per day with high accuracy. AI-assisted radiologists are reviewing 120+ with comparable accuracy.\n\nThat's not a job replacement story. That's a capacity story. In a world with a shortage of 18 million healthcare workers, that matters enormously.`,
      },
    ],
  },
  {
    authorEmail: 'tom.bradley@example.com',
    posts: [
      {
        content: `Investment thesis update: I'm increasingly excited about "boring" industries disrupted by software.\n\nFleet management. Commercial insurance. Trade finance. B2B procurement.\n\nThese are trillion-dollar markets still running on spreadsheets and phone calls. Switching costs are high. Competition is low. Margins for well-positioned SaaS are exceptional.\n\nThe next Salesforce won't be in CRM. It'll be somewhere nobody is currently looking.`,
      },
      {
        content: `Founder red flags I watch for in first meetings:\n\n❌ Pitch starts with market size, not problem\n❌ Can't name three customers and what they actually said\n❌ "We have no competition" (you always have competition)\n❌ Roadmap is 3 years of features, 0 mentions of customer feedback loops\n❌ The team is all technical or all commercial, never both\n\nGreen flags:\n✅ They've changed their mind about something important\n✅ They know their churn reasons by name`,
      },
      {
        content: `We just made our 41st investment — a company building ERP software specifically for trade finance intermediaries.\n\nWhy: $9T market. Manual processes everywhere. The incumbent software is 25 years old. The founders have 30 years combined experience in the industry.\n\nPerfect storm. Excited to partner with this team.`,
        mediaUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=500&fit=crop',
      },
    ],
  },
  {
    authorEmail: 'isabella.santos@example.com',
    posts: [
      {
        content: `The "return to office" debate is still going. But here's what I observe in the companies I work with:\n\nThe best teams aren't fully remote or fully in-office. They're intentionally hybrid — meaning they have a clear opinion on WHEN to be together and WHY.\n\nCollaboration that benefits from presence: creative work, onboarding, difficult conversations, culture-building.\n\nWork that doesn't: deep focus, individual output, async communication.\n\nBe intentional. The default of "3 days a week" solves nothing.`,
      },
      {
        content: `Hottest skill in People Ops right now that nobody is talking about: workforce analytics.\n\nNot engagement surveys. Actual behavioral data — when people quit, who leaves first, what signals predict it 6 months before it happens.\n\nThe companies using this data are reducing attrition by 20-30%. The ones ignoring it are still throwing pizza parties and wondering why people leave.`,
        mediaUrl: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=500&fit=crop',
      },
    ],
  },
  {
    authorEmail: 'nikolai.petrov@example.com',
    posts: [
      {
        content: `Threat landscape update: ransomware groups are increasingly targeting supply chain software — not end targets, but the tools those targets use.\n\nIf you're a software vendor with enterprise customers, your security posture IS your customers' security posture. Treat it that way.\n\nThe question isn't "could we be attacked?" It's "would we know within 4 hours if we were?"`,
        mediaUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop',
      },
      {
        content: `The most common security mistake I see in mid-market companies: treating cybersecurity as an IT problem.\n\nIt's a business risk problem. The CISO should have a direct line to the board. Every new product decision should include a security review. Every vendor contract should include breach notification requirements.\n\nWhen it's just an IT budget line, the first cut always comes from security.`,
      },
    ],
  },
  {
    authorEmail: 'mei.zhang@example.com',
    posts: [
      {
        content: `China cross-border e-commerce update for H1 2026:\n\nVolume is up 34% YoY but margins are compressing — logistics costs, customs complexity, and platform fees are all rising.\n\nThe brands winning are the ones who invested in local partnerships 2-3 years ago. The ones who tried to run it all centrally from Shanghai are struggling.\n\nGo-local is not a strategy. It's table stakes now.`,
        mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=500&fit=crop',
      },
      {
        content: `What most Western companies get wrong about entering Asian markets:\n\n1. Assuming one "Asia strategy" works across 15 very different markets\n2. Underinvesting in localization (not just language — payments, packaging, customer service)\n3. Applying Western partnership models to relationship-driven cultures\n4. Expecting LinkedIn-style outreach to work where WeChat is the default\n\nThe opportunity is massive. The learning curve is real.`,
      },
    ],
  },
  {
    authorEmail: 'carlos.mendes@example.com',
    posts: [
      {
        content: `EMEA enterprise sales observation: the buying committee has gotten bigger.\n\nTwo years ago, I averaged 3-4 stakeholders in an enterprise deal. This year: 6-8, sometimes 12.\n\nBudget scrutiny is real. Everyone wants to be involved. The reps who are winning are the ones who map the buying committee from day one and actively help each stakeholder get what they need.\n\nMultithreading isn't a technique anymore. It's the baseline.`,
      },
      {
        content: `My team just hit 140% of quota for H1. 🎉\n\nWhat actually drove it:\n\n- We stopped chasing every inbound and got ruthless about ICP\n- We rebuilt our discovery process to focus on business outcomes, not product features\n- We created a "deal review" ritual where we pressure-test every deal over €200K before moving to proposal\n\nThe fundamentals compound. Patience is a sales strategy.`,
        mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop',
      },
    ],
  },
];

// Sector groups — user-creatable communities that both people and firms can
// join. Discussions are regular posts scoped to the group; publications
// surface here by tag match (see productBySlug-style seeding below).
const groupSeeds = [
  {
    name: 'Science',
    description: 'A community for scientists, researchers, and R&D teams to share findings, methodology, and early results.',
    createdBy: 'priya.nair@example.com',
    members: ['priya.nair@example.com', 'david.kim@example.com', 'fatima.al-rashid@example.com', 'yuki.tanaka@example.com'],
    discussions: [
      { author: 'priya.nair@example.com', content: `Just open-sourced our federated learning benchmark suite — the same one behind the healthcare paper we published last month.\n\nIf you're working on privacy-preserving ML and want a standardized way to compare approaches across hospital-style data splits, it's ready to use. Link in my profile.` },
      { author: 'fatima.al-rashid@example.com', content: `Question for the group: has anyone here evaluated AI-assisted diagnostics against a genuinely blinded radiologist panel, not just retrospective accuracy on a fixed dataset?\n\nMost papers I'm seeing compare against historical reads, which overstates real-world performance. Curious what rigor looks like elsewhere.` },
    ],
    publications: [
      {
        author: 'priya.nair@example.com',
        title: 'Federated Learning for Healthcare Data Without Compromising Patient Privacy',
        content: `We tested federated learning across 8 hospitals in 4 countries. The core idea: each site trains locally on its own patient data, and only model weights — never raw records — are aggregated centrally.\n\nResults: accuracy matched centralized training within 2%, and the entire pipeline is GDPR-compliant by design since patient data never leaves the originating hospital's infrastructure.\n\nWe're releasing the benchmark suite and a reference implementation. This is early-stage work, but we think the privacy/accuracy tradeoff is now good enough for production pilots, not just research demos.`,
        coverImage: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=900&h=500&fit=crop',
      },
    ],
  },
  {
    name: 'Finance',
    description: 'Executives, investors, and finance leaders discussing capital markets, fundraising, and financial strategy.',
    createdBy: 'anna.kowalski@example.com',
    members: ['anna.kowalski@example.com', 'tom.bradley@example.com', 'james.okafor@example.com'],
    discussions: [
      { author: 'anna.kowalski@example.com', content: `Unpopular finance opinion: most Series B startups are tracking the wrong North Star metric.\n\nGrowth at all costs made sense in 2021. In this market, the boards I sit on care far more about the path to a 3x LTV:CAC ratio than raw top-line growth. Curious if others are seeing the same shift from their investors.` },
      { author: 'tom.bradley@example.com', content: `We just closed our 41st investment. Happy to answer questions from founders in this group about what actually gets a deal across the finish line at the partner meeting stage — ask away.` },
    ],
    publications: [
      {
        author: 'james.okafor@example.com',
        title: 'Building Payment Rails for Markets Legacy Fintech Ignores',
        content: `600 million people across West and East Africa move money through informal channels because the formal ones are too slow, too expensive, or simply unavailable. We just closed a $12M Series A to fix that.\n\nThe lesson that surprised us most: in these markets, the infrastructure IS the feature. We built our payment flow to work on 2G with USSD fallback, in 14 languages, because the Silicon Valley UX playbook simply doesn't apply where smartphones are shared and internet is spotty.\n\nIf you're building fintech for emerging markets, the constraint is the innovation — design for the network you actually have, not the one you wish you had.`,
        coverImage: 'https://images.unsplash.com/photo-1554260570-83f8a5a9d5d5?w=900&h=500&fit=crop',
      },
    ],
  },
  {
    name: 'Technology',
    description: 'Engineers, architects, and technical founders talking about what they\'re actually building.',
    createdBy: 'yuki.tanaka@example.com',
    members: ['yuki.tanaka@example.com', 'david.kim@example.com', 'nikolai.petrov@example.com', 'mei.zhang@example.com'],
    discussions: [
      { author: 'david.kim@example.com', content: `Migrated our entire infrastructure to a multi-region active-active setup last quarter with zero downtime. Happy to do a deep-dive post on the runbook if there's interest — the short version is we practiced the rollback before we ever practiced the rollout.` },
      { author: 'nikolai.petrov@example.com', content: `Ransomware groups are increasingly targeting supply chain software vendors, not the end targets directly. If you ship software to enterprise customers, your security posture IS their security posture now. Worth an internal audit if you haven't done one this year.` },
    ],
    publications: [
      {
        author: 'yuki.tanaka@example.com',
        title: 'Self-Calibrating Robot Geometry: Cutting Cobot Setup Time by 90%',
        content: `Filed patent #8 this year for a new approach to force-feedback calibration in collaborative robot arms. The old way: a 45-minute manual factory calibration pass for every new install.\n\nThe breakthrough was simpler than expected — instead of calibrating at the factory, we let the robot learn its own geometry through a standardized handling sequence on first install at the customer site. Setup time drops from 45 minutes to under 4.\n\nSometimes the elegant solution really is hiding in the obvious place: let the machine measure itself instead of measuring it for the machine.`,
        coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&h=500&fit=crop',
      },
    ],
  },
  {
    name: 'Logistics',
    description: 'Supply chain, freight, and operations professionals comparing notes on what\'s actually working in global trade.',
    createdBy: 'alex.rivera@example.com',
    members: ['alex.rivera@example.com', 'omar.hassan@example.com', 'mei.zhang@example.com'],
    discussions: [
      { author: 'omar.hassan@example.com', content: `The Red Sea shipping disruptions are still rippling through global trade — 8 months later. The companies that reacted fastest weren't the ones with the most ships, they were the ones with the best data. Strategic inventory buffers are a competitive differentiator now, not a luxury.` },
      { author: 'alex.rivera@example.com', content: `Just wrapped a 6-month supply chain audit for a Fortune 500 manufacturer. 34% of their delays traced back to 3 supplier bottlenecks they had zero visibility into. The fix wasn't new software — it was weekly supplier scorecards and response SLAs. Delays dropped 40% in month one.` },
    ],
    publications: [],
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding Ornave network data...\n');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Seed firms
  const seededFirms: Record<string, any> = {};
  for (const firm of firms) {
    const company = await prisma.company.upsert({
      where: { slug: firm.slug },
      update: {
        name: firm.name,
        description: firm.description,
        industry: firm.industry,
        country: firm.country,
        logo: firm.logo,
        isPublicProfile: true,
        isVerified: true,
        isActive: true,
        capabilities: JSON.stringify(firm.capabilities),
      },
      create: {
        name: firm.name,
        slug: firm.slug,
        description: firm.description,
        industry: firm.industry,
        country: firm.country,
        logo: firm.logo,
        isPublicProfile: true,
        isVerified: true,
        isActive: true,
        capabilities: JSON.stringify(firm.capabilities),
      },
    });

    await prisma.companyProfile.upsert({
      where: { companyId: company.id },
      update: {
        industry: firm.industry,
        country: firm.country,
        capabilities: JSON.stringify(firm.capabilities),
        about: firm.about,
        website: firm.website,
        verificationStatus: 'VERIFIED',
      },
      create: {
        companyId: company.id,
        industry: firm.industry,
        country: firm.country,
        capabilities: JSON.stringify(firm.capabilities),
        about: firm.about,
        website: firm.website,
        verificationStatus: 'VERIFIED',
      },
    });

    seededFirms[firm.slug] = company;
    console.log(`  ✅ Firm: ${firm.name}`);
  }

  // Seed products so each firm's "Request Service" offerings reflect its
  // actual industry instead of falling back to generic consulting packages.
  console.log('\n🛍️  Seeding products...');
  let productCount = 0;
  for (const [slug, products] of Object.entries(productsBySlug)) {
    const company = seededFirms[slug];
    if (!company) continue;

    for (const product of products) {
      const existing = await prisma.product.findFirst({
        where: { companyId: company.id, name: product.name },
      });
      if (existing) continue;

      await prisma.product.create({
        data: {
          companyId: company.id,
          name: product.name,
          description: product.description,
          price: product.price,
          currency: product.currency ?? 'USD',
          category: product.category,
          imageUrl: product.imageUrl ?? null,
          stock: product.stock ?? 25,
          isActive: true,
        },
      });
      productCount++;
    }
  }
  console.log(`  ✅ Created ${productCount} products`);

  // Seed open job listings so each firm's "Jobs" tab has real, industry-
  // specific roles instead of showing up empty.
  console.log('\n💼 Seeding job listings...');
  let jobCount = 0;
  for (const [slug, jobs] of Object.entries(jobsBySlug)) {
    const company = seededFirms[slug];
    if (!company) continue;

    for (const job of jobs) {
      const data = {
        companyId: company.id,
        title: job.title,
        location: job.location,
        type: job.type ?? 'Full-time',
        description: job.description,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryPeriod: job.salaryPeriod ?? 'year',
        benefits: JSON.stringify(job.benefits ?? []),
        qualifications: JSON.stringify(job.qualifications ?? []),
        isActive: true,
      };

      const existing = await prisma.job.findFirst({
        where: { companyId: company.id, title: job.title },
      });

      if (existing) {
        await prisma.job.update({ where: { id: existing.id }, data });
      } else {
        await prisma.job.create({ data });
        jobCount++;
      }
    }
  }
  console.log(`  ✅ Created ${jobCount} job listings`);

  // Seed individual users + profiles + posts
  const seededUsers: Record<string, any> = {};
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
      create: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: 'INDIVIDUAL',
        role: 'EMPLOYEE',
      },
    });

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: `${userData.firstName} ${userData.lastName}`,
        headline: userData.headline,
        bio: userData.bio,
        avatarUrl: userData.avatarUrl,
        address: userData.address ?? null,
        website: (userData as any).website ?? null,
      },
      create: {
        userId: user.id,
        displayName: `${userData.firstName} ${userData.lastName}`,
        headline: userData.headline,
        bio: userData.bio,
        avatarUrl: userData.avatarUrl,
        address: userData.address ?? null,
        website: (userData as any).website ?? null,
      },
    });

    seededUsers[userData.email] = user;
    console.log(`  ✅ User: ${userData.firstName} ${userData.lastName}`);
  }

  // Seed posts
  console.log('\n📝 Seeding posts...');
  let postCount = 0;
  for (const authorData of postTemplates) {
    const author = seededUsers[authorData.authorEmail];
    if (!author) continue;

    for (const postData of authorData.posts) {
      // Spread posts over the last 30 days with randomish timestamps
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date(Date.now() - (daysAgo * 86400 + hoursAgo * 3600) * 1000);

      const reactions = JSON.stringify({
        likes: Math.floor(Math.random() * 120) + 5,
        comments: Math.floor(Math.random() * 30),
      });

      await prisma.post.create({
        data: {
          authorId: author.id,
          title: (postData as any).title ?? null,
          content: postData.content,
          visibility: 'public',
          type: 'post',
          reactions,
          createdAt,
          updatedAt: createdAt,
        },
      });

      postCount++;
    }
  }
  console.log(`  ✅ Created ${postCount} posts`);

  // Seed a few connections between users so the network feels alive
  console.log('\n🤝 Seeding connections...');
  const connectionPairs = [
    ['alex.rivera@example.com', 'omar.hassan@example.com'],
    ['alex.rivera@example.com', 'marcus.thorn@example.com'],
    ['sarah.chen@example.com', 'yuki.tanaka@example.com'],
    ['sarah.chen@example.com', 'camille.dupont@example.com'],
    ['james.okafor@example.com', 'tom.bradley@example.com'],
    ['james.okafor@example.com', 'anna.kowalski@example.com'],
    ['priya.nair@example.com', 'david.kim@example.com'],
    ['priya.nair@example.com', 'fatima.al-rashid@example.com'],
    ['elena.rodriguez@example.com', 'marcus.thorn@example.com'],
    ['lucas.fontaine@example.com', 'carlos.mendes@example.com'],
    ['lucas.fontaine@example.com', 'camille.dupont@example.com'],
    ['tom.bradley@example.com', 'anna.kowalski@example.com'],
    ['nikolai.petrov@example.com', 'david.kim@example.com'],
    ['mei.zhang@example.com', 'omar.hassan@example.com'],
    ['isabella.santos@example.com', 'lucas.fontaine@example.com'],
  ];

  let connCount = 0;
  for (const [emailA, emailB] of connectionPairs) {
    const userA = seededUsers[emailA];
    const userB = seededUsers[emailB];
    if (!userA || !userB) continue;

    try {
      await prisma.userConnection.upsert({
        where: { requesterId_addresseeId: { requesterId: userA.id, addresseeId: userB.id } },
        update: { status: 'ACCEPTED' },
        create: {
          requesterId: userA.id,
          addresseeId: userB.id,
          status: 'ACCEPTED',
        },
      });
      connCount++;
    } catch {
      // ignore duplicate
    }
  }
  console.log(`  ✅ Created ${connCount} connections`);

  // Seed sector groups: the group itself, its members, discussion posts
  // (regular Posts scoped via groupId), and publications (a separate entity
  // that surfaces here purely by tag match, exactly like the real feature).
  console.log('\n🗂️  Seeding sector groups...');
  const slugify = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const tagify = (name: string) => name.toUpperCase().trim().replace(/[^A-Z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  let groupCount = 0;
  let groupMemberCount = 0;
  let discussionCount = 0;
  let publicationCount = 0;

  for (const groupSeed of groupSeeds) {
    const creator = seededUsers[groupSeed.createdBy];
    if (!creator) continue;

    const slug = slugify(groupSeed.name);
    const tag = tagify(groupSeed.name);

    const group = await prisma.group.upsert({
      where: { slug },
      update: { description: groupSeed.description, tag },
      create: {
        name: groupSeed.name,
        slug,
        tag,
        description: groupSeed.description,
        createdById: creator.id,
      },
    });
    groupCount++;

    for (const memberEmail of groupSeed.members) {
      const member = seededUsers[memberEmail];
      if (!member) continue;
      await prisma.groupMember.upsert({
        where: { groupId_userId: { groupId: group.id, userId: member.id } },
        update: {},
        create: {
          groupId: group.id,
          userId: member.id,
          role: memberEmail === groupSeed.createdBy ? 'ADMIN' : 'MEMBER',
        },
      });
      groupMemberCount++;
    }

    for (const discussion of groupSeed.discussions) {
      const author = seededUsers[discussion.author];
      if (!author) continue;
      const daysAgo = Math.floor(Math.random() * 14);
      const createdAt = new Date(Date.now() - daysAgo * 86400 * 1000);
      await prisma.post.create({
        data: {
          authorId: author.id,
          groupId: group.id,
          content: discussion.content,
          visibility: 'public',
          type: 'post',
          reactions: JSON.stringify({ likes: Math.floor(Math.random() * 30) + 2, comments: 0 }),
          createdAt,
          updatedAt: createdAt,
        },
      });
      discussionCount++;
    }

    for (const publication of groupSeed.publications) {
      const author = seededUsers[publication.author];
      if (!author) continue;
      const existing = await prisma.publication.findFirst({ where: { authorId: author.id, title: publication.title } });
      if (existing) continue;
      const daysAgo = Math.floor(Math.random() * 10);
      const createdAt = new Date(Date.now() - daysAgo * 86400 * 1000);
      await prisma.publication.create({
        data: {
          authorId: author.id,
          title: publication.title,
          content: publication.content,
          coverImage: publication.coverImage,
          tags: JSON.stringify([tag]),
          visibility: 'public',
          reactions: JSON.stringify({ likes: Math.floor(Math.random() * 60) + 10, comments: 0 }),
          createdAt,
          updatedAt: createdAt,
        },
      });
      publicationCount++;
    }

    console.log(`  ✅ Sector: ${groupSeed.name}`);
  }
  console.log(`  ✅ Created ${groupCount} sectors | ${groupMemberCount} memberships | ${discussionCount} discussions | ${publicationCount} publications`);

  console.log('\n✨ Seeding complete!');
  console.log(`   ${firms.length} firms | ${productCount} products | ${users.length} users | ${postCount} posts | ${connCount} connections | ${groupCount} sectors`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
