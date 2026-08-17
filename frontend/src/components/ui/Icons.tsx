import React from 'react';

type IconProps = { size?: number; className?: string };

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconHome: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M3 9.5 10 3l7 6.5" />
    <path d="M5 8.5V17h10V8.5" />
    <path d="M8 17v-5h4v5" />
  </svg>
);

export const IconCircles: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="7" cy="7.5" r="3" />
    <circle cx="14" cy="9" r="2.4" />
    <path d="M2.5 17c.6-2.8 2.4-4.3 4.5-4.3s3.9 1.5 4.5 4.3" />
    <path d="M12 17c.4-1.9 1.6-3.1 3.2-3.1 1.4 0 2.5.9 3 2.4" />
  </svg>
);

export const IconInbox: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
    <path d="M2.5 5.5 10 11l7.5-5.5" />
  </svg>
);

export const IconBell: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M6 8a4 4 0 0 1 8 0c0 3.4 1 4.6 1.5 5.2H4.5C5 12.6 6 11.4 6 8Z" />
    <path d="M8.3 15.8a1.8 1.8 0 0 0 3.4 0" />
  </svg>
);

export const IconSuite: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="3" y="3" width="5.5" height="5.5" rx="0.8" />
    <rect x="11.5" y="3" width="5.5" height="5.5" rx="0.8" />
    <rect x="3" y="11.5" width="5.5" height="5.5" rx="0.8" />
    <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="0.8" />
  </svg>
);

export const IconLaurel: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M10 3v11" />
    <path d="M10 14l-2.2 2.4M10 14l2.2 2.4" />
    <path d="M4 6c1.6.3 2.6 1.6 2.4 3.4C6.2 11.4 4.7 12.4 3 12c1.6-.6 2-2 1.7-3.6C4.4 6.9 4.9 6.2 4 6Z" />
    <path d="M16 6c-1.6.3-2.6 1.6-2.4 3.4.2 2 1.7 3 3.4 2.6-1.6-.6-2-2-1.7-3.6.3-1.5-.2-2.2.7-2Z" />
  </svg>
);

export const IconMoon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M15.5 12.8A6.5 6.5 0 0 1 7.2 4.5a6.5 6.5 0 1 0 8.3 8.3Z" />
  </svg>
);

export const IconSun: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="10" cy="10" r="3.4" />
    <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
  </svg>
);

export const IconBuilding: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="4" y="3" width="9" height="14" rx="0.6" />
    <path d="M13 8.5h3v8.5h-3" />
    <path d="M6.5 6h1.5M9.5 6H11M6.5 9h1.5M9.5 9H11M6.5 12h1.5M9.5 12H11" />
  </svg>
);

export const IconBriefcase: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="2.5" y="6.5" width="15" height="9.5" rx="1.2" />
    <path d="M7 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 13 5v1.5" />
    <path d="M2.5 10.5h15" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="8.8" cy="8.8" r="5.3" />
    <path d="M16.5 16.5 13 13" />
  </svg>
);

export const IconUsers: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="7" cy="7" r="2.6" />
    <circle cx="14" cy="8.5" r="2" />
    <path d="M2.5 16c.5-2.6 2.2-4 4.5-4s4 1.4 4.5 4" />
    <path d="M12.5 12.6c1.8.2 3 1.4 3.4 3.4" />
  </svg>
);

export const IconCard: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="2.5" y="4.5" width="15" height="11" rx="1.3" />
    <path d="M2.5 8h15" />
    <path d="M5 12h4" />
  </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="10" cy="6.8" r="3" />
    <path d="M3.5 16.5c.8-3.4 3-5.2 6.5-5.2s5.7 1.8 6.5 5.2" />
  </svg>
);

export const IconChart: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M3 17V3" />
    <path d="M3 17h14" />
    <path d="M6 14v-4M10 14V7M14 14v-6" />
  </svg>
);

export const IconEdit: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M12.9 3.6 16.4 7.1 6.8 16.7 3 17.5l.8-3.8Z" />
    <path d="M11.3 5.2 14.8 8.7" />
  </svg>
);

export const IconSpark: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M10 2.5c.6 3 1.9 4.3 4.9 4.9-3 .6-4.3 1.9-4.9 4.9-.6-3-1.9-4.3-4.9-4.9 3-.6 4.3-1.9 4.9-4.9Z" />
    <path d="M15.5 13c.3 1.4.9 2 2.3 2.3-1.4.3-2 .9-2.3 2.3-.3-1.4-.9-2-2.3-2.3 1.4-.3 2-.9 2.3-2.3Z" />
  </svg>
);

export const IconGraduationCap: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M2 7.5 10 4l8 3.5-8 3.5-8-3.5Z" />
    <path d="M5.5 9.2v3.6c0 1 2 2.2 4.5 2.2s4.5-1.2 4.5-2.2V9.2" />
    <path d="M17 7.5v4.5" />
  </svg>
);

export const IconTrophy: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M6 3h8v4.5a4 4 0 0 1-8 0V3Z" />
    <path d="M6 4H3.5a1.5 1.5 0 0 0 0 3H6M14 4h2.5a1.5 1.5 0 0 1 0 3H14" />
    <path d="M10 11.5V14M7 17h6M7.5 14h5l.5 3h-6l.5-3Z" />
  </svg>
);

export const IconHandshake: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M2 9.5 5.5 6l3 2 1.5-1.3a1.6 1.6 0 0 1 2.2.1l3.3 3.3" />
    <path d="M8.5 8 12 11.3a1.3 1.3 0 0 1-1.8 1.9L8 11" />
    <path d="M10.2 13.2 9 14.4a1.3 1.3 0 0 1-1.9-1.8" />
    <path d="M2 9.5 5 15l1.8-1.2M18 10l-2.8 5.3-1.7-1" />
  </svg>
);

export const IconGlobe: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="10" cy="10" r="7.2" />
    <path d="M2.8 10h14.4M10 2.8c2.4 2 3.7 4.6 3.7 7.2s-1.3 5.2-3.7 7.2c-2.4-2-3.7-4.6-3.7-7.2S7.6 4.8 10 2.8Z" />
  </svg>
);

export const IconLink: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M8.5 11.5 11.5 8.5" />
    <path d="M9 6.2 10.4 4.8a3 3 0 0 1 4.2 4.2L13.2 10.4M11 13.8 9.6 15.2a3 3 0 0 1-4.2-4.2L6.8 9.6" />
  </svg>
);

export const IconVerified: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} fill="currentColor" stroke="none">
    <path d="M10 1.6 12 3l2.5-.3 1 2.3 2.3 1-.3 2.5 1.4 2-1.4 2 .3 2.5-2.3 1-1 2.3L12 17l-2 1.4-2-1.4-2.5.3-1-2.3-2.3-1 .3-2.5L1.1 10l1.4-2-.3-2.5 2.3-1 1-2.3L8 1.6l2 .4Z" />
    <path d="M7 10.2l2 2 4-4.4" stroke="#111111" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconMail: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
    <path d="M3 5.5 10 11l7-5.5" />
  </svg>
);

export const IconPhone: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M4.5 3h2.7l1 3.4-1.7 1.4a10 10 0 0 0 4.7 4.7l1.4-1.7 3.4 1v2.7a1.5 1.5 0 0 1-1.6 1.5A13.5 13.5 0 0 1 3 5.6 1.5 1.5 0 0 1 4.5 3Z" />
  </svg>
);

export const IconDownload: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M10 3v9.5M6.3 9 10 12.7 13.7 9" />
    <path d="M3.5 15h13" />
  </svg>
);

export const IconCompass: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M12.8 7.2 11.3 11.3 7.2 12.8 8.7 8.7Z" strokeLinejoin="round" />
  </svg>
);

export const IconLayers: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M10 2.5 17.5 7 10 11.5 2.5 7Z" strokeLinejoin="round" />
    <path d="M2.5 10.5 10 15l7.5-4.5M2.5 14 10 18.5 17.5 14" />
  </svg>
);

export const IconArticle: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="3.5" y="2.5" width="13" height="15" rx="1.2" />
    <path d="M6.5 6.5h7M6.5 9.5h7M6.5 12.5h4.5" />
  </svg>
);

export const IconCalendar: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="2.5" y="4" width="15" height="13.5" rx="1.2" />
    <path d="M2.5 8h15M6.5 2v4M13.5 2v4" />
  </svg>
);

export const IconBag: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M4.5 6.5h11l-.9 10a1.5 1.5 0 0 1-1.5 1.4H6.9a1.5 1.5 0 0 1-1.5-1.4Z" strokeLinejoin="round" />
    <path d="M7 6.5V5a3 3 0 0 1 6 0v1.5" />
  </svg>
);

export const IconTrendingUp: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M2.5 14 8 8.5l3 3 6-6" strokeLinejoin="round" />
    <path d="M13.5 5.5H17V9" />
  </svg>
);

export const IconGroups: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="7" cy="6.5" r="2.3" />
    <circle cx="14" cy="7.5" r="1.9" />
    <path d="M2.3 16.5c.5-3 2.2-4.7 4.7-4.7s4.2 1.7 4.7 4.7" />
    <path d="M12.5 12.3c1.9.2 3.1 1.6 3.5 4.2" />
  </svg>
);

export const IconBookmark: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M5.5 3h9a.5.5 0 0 1 .5.5v13l-5-3.5-5 3.5v-13a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
  </svg>
);

export const IconHeadset: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M4 10.5v-1a6 6 0 0 1 12 0v1" />
    <rect x="2.5" y="10" width="3.5" height="5" rx="1.2" />
    <rect x="14" y="10" width="3.5" height="5" rx="1.2" />
    <path d="M16 15v.5a2.5 2.5 0 0 1-2.5 2.5H11" />
  </svg>
);

export const IconLock: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="4.5" y="9" width="11" height="8" rx="1.3" />
    <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
  </svg>
);

export const IconImage: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="2.5" y="4" width="15" height="12" rx="1.3" />
    <circle cx="7" cy="8.2" r="1.4" />
    <path d="M3 15l4.5-4.5 3 2.8L15 8.5l2.3 2.3" />
  </svg>
);

export const IconHash: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M7.5 2.5 5 17.5M14.5 2.5 12 17.5M3 7.5h14M2.5 12.5h14" />
  </svg>
);

export const IconAt: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="10" cy="10.5" r="3.2" />
    <path d="M13.2 10.5V12a2 2 0 0 0 4 0V10a7.2 7.2 0 1 0-3 5.85" />
  </svg>
);

export const IconPaperclip: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M13.5 6.2 7.6 12.1a2.3 2.3 0 0 0 3.3 3.3l6.2-6.2a3.8 3.8 0 0 0-5.4-5.4L5.5 10a5.3 5.3 0 0 0 7.5 7.5l5-5" />
  </svg>
);

export const IconSave: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M4 3.5h9.5L16 6v10a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
    <path d="M6.5 3.5V8h6V3.5M6.5 16.5V12h7v4.5" />
  </svg>
);

export const IconLogout: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M8.5 3H5a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 5 17h3.5" />
    <path d="M13 13.5 17 10l-4-3.5" />
    <path d="M17 10H8" />
  </svg>
);

export const IconCart: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M2.5 3h2l1.7 9.4a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.2L17 6.5H5.3" />
    <circle cx="8" cy="17" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="17" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconClock: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 5.5V10l3 2" />
  </svg>
);

export const IconMapPin: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M10 18s6-5.6 6-10.2A6 6 0 0 0 4 7.8C4 12.4 10 18 10 18Z" strokeLinejoin="round" />
    <circle cx="10" cy="7.8" r="2.2" />
  </svg>
);

export const IconShare: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} {...base}>
    <circle cx="12.5" cy="3.5" r="1.8" />
    <circle cx="3.5" cy="8" r="1.8" />
    <circle cx="12.5" cy="12.5" r="1.8" />
    <path d="M5.1 7.1 11 4.3M5.1 8.9 11 11.7" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} {...base}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} {...base}>
    <path d="M3.5 5.5 8 10l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCloud: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M6 15.5a3.5 3.5 0 0 1-.6-6.95A4.5 4.5 0 0 1 14 7.1 3.5 3.5 0 0 1 13.5 15.5H6Z" strokeLinejoin="round" />
  </svg>
);

export const IconFolder: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M2.5 5.5a1 1 0 0 1 1-1H8l1.6 2h7a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1Z" strokeLinejoin="round" />
  </svg>
);

export const IconVideo: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="2.5" y="5" width="10.5" height="10" rx="1.2" />
    <path d="M13 8.3 17.5 5.5v9L13 11.7" strokeLinejoin="round" />
  </svg>
);

export const IconMusic: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M8 14V4.5l8-1.5V12" strokeLinejoin="round" />
    <circle cx="6" cy="14.5" r="2.2" />
    <circle cx="14" cy="12.5" r="2.2" />
  </svg>
);

export const IconArchive: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="2.5" y="3" width="15" height="4" rx="0.8" />
    <path d="M3.5 7v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V7" />
    <path d="M8.3 10.2h3.4" />
  </svg>
);

export const IconFile: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M5 2.5h6.5L15.5 6.5V17a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5v-14a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
    <path d="M11.5 2.5V6.5h4" />
  </svg>
);

export const IconSettings: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="10" cy="10" r="2.6" />
    <path d="M10 3.3v1.9M10 14.8v1.9M16.7 10h-1.9M5.2 10H3.3M14.7 5.3l-1.3 1.3M6.6 13.4l-1.3 1.3M14.7 14.7l-1.3-1.3M6.6 6.6 5.3 5.3" />
  </svg>
);

export const IconSend: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M17.5 2.5 2.5 8.8l6 2.7 2.7 6Z" strokeLinejoin="round" />
    <path d="M17.5 2.5 8.5 11.5" />
  </svg>
);

export const IconMessageCircle: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M2.5 10a7.5 7.5 0 1 1 3 6L2.5 17l1-3.4A7.4 7.4 0 0 1 2.5 10Z" strokeLinejoin="round" />
  </svg>
);

export const IconStar: React.FC<IconProps & { filled?: boolean }> = ({ size = 16, className, filled }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base} fill={filled ? 'currentColor' : 'none'}>
    <path d="M10 2.5 12.4 7.7 18 8.4l-4.1 3.8 1.1 5.6L10 14.9l-5 2.9 1.1-5.6L2 8.4l5.6-.7Z" strokeLinejoin="round" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M5 5l10 10M15 5 5 15" />
  </svg>
);

export const IconAlertTriangle: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M10 3 18 16.5H2Z" strokeLinejoin="round" />
    <path d="M10 8v3.5" />
    <circle cx="10" cy="14" r="0.15" fill="currentColor" />
  </svg>
);

export const IconTarget: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="10" cy="10" r="7.5" />
    <circle cx="10" cy="10" r="4.2" />
    <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconMindmap: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <circle cx="10" cy="10" r="2.2" />
    <circle cx="3.5" cy="4.5" r="1.8" />
    <circle cx="16.5" cy="4.5" r="1.8" />
    <circle cx="3.5" cy="15.5" r="1.8" />
    <circle cx="16.5" cy="15.5" r="1.8" />
    <path d="M8.4 8.6 4.9 5.7M11.6 8.6l3.5-2.9M8.4 11.4l-3.5 2.9M11.6 11.4l3.5 2.9" />
  </svg>
);

export const IconUndo: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <path d="M4 8.5H12a4 4 0 0 1 0 8H8" />
    <path d="M6.7 5 4 8.5l3 2.8" strokeLinejoin="round" />
  </svg>
);

export const IconClipboard: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
    <rect x="4" y="3.5" width="12" height="14" rx="1.2" />
    <path d="M7.5 3.5V2.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v.7" />
    <path d="M7 8.5h6M7 11.5h6M7 14.5h4" />
  </svg>
);
