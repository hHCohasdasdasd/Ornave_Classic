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

  console.log('\n✨ Seeding complete!');
  console.log(`   ${firms.length} firms | ${users.length} users | ${postCount} posts | ${connCount} connections`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
