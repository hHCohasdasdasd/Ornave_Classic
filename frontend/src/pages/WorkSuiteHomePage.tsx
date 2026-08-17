import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, WorkSuiteSummary, WorkSuiteInsight } from '@/services/workSuiteService';
import { IconCompass, IconBriefcase, IconTrophy, IconCloud, IconHandshake, IconCheck, IconLayers, IconArticle, IconBag, IconUsers, IconSettings, IconSpark, IconCalendar } from '@/components/ui/Icons';
import './WorkSuite.css';

const GROWTH_MODULES = [
  { icon: <IconCompass size={22} />, title: 'Planning', description: 'Your board, goals, notes, and focus timer — all in one place.', route: '/work-suite/personal' },
  { icon: <IconCalendar size={22} />, title: 'Calendar', description: 'Every task, goal, and application deadline in one place.', route: '/work-suite/calendar' },
  { icon: <IconBriefcase size={22} />, title: 'Jobs', description: 'Track the roles you\'re pursuing, from application to offer.', route: '/work-suite/jobs' },
  { icon: <IconTrophy size={22} />, title: 'Achievements', description: 'Every win worth remembering, logged in one place.', route: '/work-suite/achievements' },
];

const FREELANCE_MODULES = [
  { icon: <IconCloud size={22} />, title: 'Files', description: 'Your own cloud — upload, store, and get back anything, anytime.', route: '/work-suite/files' },
  { icon: <IconHandshake size={22} />, title: 'Connections', description: "Your network — the people you're connected with on Ornave.", route: '/work-suite/connections' },
];

const COMPANY_MODULES = [
  { icon: <IconCloud size={22} />, title: 'Files', description: 'Your own cloud — upload, store, and get back anything, anytime.', route: '/work-suite/files' },
  { icon: <IconCheck size={22} />, title: 'Tasks', description: 'Everything on your plate, organized by status and priority.', route: '/work-suite/personal?tab=board' },
  { icon: <IconCalendar size={22} />, title: 'Calendar', description: 'Every task and goal deadline in one place.', route: '/work-suite/calendar' },
  { icon: <IconHandshake size={22} />, title: 'Connections', description: "Your network — the people you're connected with on Ornave.", route: '/work-suite/connections' },
];

const COMPANY_TOOLS = [
  { icon: <IconLayers size={22} />, title: 'ERP Modules', description: 'Configure internal workflow modules.', route: '/modules' },
  { icon: <IconArticle size={22} />, title: 'Page Builder', description: 'Build structured internal pages.', route: '/pages' },
  { icon: <IconBriefcase size={22} />, title: 'Transactions', description: 'Track B2B orders and payments.', route: '/transactions' },
  { icon: <IconBag size={22} />, title: 'Manage Store', description: 'Manage your storefront products and orders.', route: '/manage-store' },
  { icon: <IconUsers size={22} />, title: 'Client Management', description: 'Followers, service usage, and engagement.', route: '/firm/clients' },
  { icon: <IconSettings size={22} />, title: 'Company Settings', description: 'Update company information and settings.', route: '/company-settings' },
];

const ModuleGrid: React.FC<{ items: typeof GROWTH_MODULES; onNavigate: (route: string) => void }> = ({ items, onNavigate }) => (
  <div className="worksuite-modules">
    {items.map((m) => (
      <button key={m.route} className="worksuite-module-tile" onClick={() => onNavigate(m.route)}>
        <div className="worksuite-module-tile__icon">{m.icon}</div>
        <div className="worksuite-module-tile__title">{m.title}</div>
        <p className="worksuite-module-tile__description">{m.description}</p>
      </button>
    ))}
  </div>
);

const timeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const WorkSuiteHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [summary, setSummary] = useState<WorkSuiteSummary | null>(null);
  const [insights, setInsights] = useState<WorkSuiteInsight[] | null>(null);
  const [quickAdd, setQuickAdd] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const isGuest = !user || user.id === 'guest';
  const isCompany = user?.userType === 'COMPANY_USER';

  const refresh = () => {
    workSuiteService.getSummary().then(setSummary).catch(() => setSummary(null));
    workSuiteService.getInsights().then(setInsights).catch(() => setInsights([]));
  };

  useEffect(() => {
    if (isGuest) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdd.trim()) return;
    setIsAdding(true);
    try {
      await workSuiteService.createTask({ title: quickAdd.trim() });
      setQuickAdd('');
      refresh();
    } finally {
      setIsAdding(false);
    }
  };

  const eyebrow = isCompany ? 'Company Workspace' : 'Personal Workspace';
  const title = isCompany ? (company?.name || 'Your Company') : `${timeGreeting()}, ${user?.firstName || 'there'}`;
  const subtitle = isCompany
    ? `Your assistant for running ${company?.name || 'the business'} — files, tasks, and connections, plus the full company ERP below.`
    : "I'm here to help you stay on top of things — tasks, goals, and everything in between.";

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <div className="worksuite-page__eyebrow">{eyebrow}</div>
          <h1 className="worksuite-page__title">{title}</h1>
          <p className="worksuite-page__subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-assistant">
          <div className="worksuite-assistant__header">
            <div className="worksuite-assistant__avatar"><IconSpark size={16} /></div>
            <div className="worksuite-assistant__lead">
              {insights === null
                ? 'Taking a look at things…'
                : insights.length === 0
                ? "Nothing needs your attention right now — you're all caught up."
                : "Here's what I'd take care of first:"}
            </div>
          </div>

          {insights && insights.length > 0 && (
            <div className="worksuite-assistant__insights">
              {insights.map((insight) => (
                <div key={insight.id} className="worksuite-assistant__insight">
                  <span className="worksuite-assistant__insight-icon">{insight.icon}</span>
                  <span className="worksuite-assistant__insight-message">{insight.message}</span>
                  <button className="worksuite-btn" onClick={() => navigate(insight.actionRoute)}>{insight.actionLabel}</button>
                </div>
              ))}
            </div>
          )}

          <form className="worksuite-assistant__quickadd" onSubmit={handleQuickAdd}>
            <input
              value={quickAdd}
              onChange={(e) => setQuickAdd(e.target.value)}
              placeholder="Tell me what you need to do…"
              maxLength={160}
            />
            <button type="submit" disabled={!quickAdd.trim() || isAdding}>
              {isAdding ? 'Adding…' : 'Add Task'}
            </button>
          </form>
        </div>

        <div className="worksuite-stats">
          {isCompany ? (
            <>
              <div className="worksuite-stat-card">
                <div className="worksuite-stat-card__label">Active Projects</div>
                <div className="worksuite-stat-card__value">{summary?.activeProjects ?? '—'}</div>
              </div>
              <div className="worksuite-stat-card">
                <div className="worksuite-stat-card__label">Open Tasks</div>
                <div className="worksuite-stat-card__value">{summary?.openTasks ?? '—'}</div>
              </div>
            </>
          ) : (
            <>
              <div className="worksuite-stat-card">
                <div className="worksuite-stat-card__label">Open Tasks</div>
                <div className="worksuite-stat-card__value">{summary?.openTasks ?? '—'}</div>
              </div>
              <div className="worksuite-stat-card">
                <div className="worksuite-stat-card__label">Active Goals</div>
                <div className="worksuite-stat-card__value">{summary?.activeGoals ?? '—'}</div>
              </div>
              <div className="worksuite-stat-card">
                <div className="worksuite-stat-card__label">Achievements</div>
                <div className="worksuite-stat-card__value">{summary?.achievements ?? '—'}</div>
              </div>
              <div className="worksuite-stat-card">
                <div className="worksuite-stat-card__label">Active Projects</div>
                <div className="worksuite-stat-card__value">{summary?.activeProjects ?? '—'}</div>
              </div>
            </>
          )}
        </div>

        {isCompany ? (
          <>
            <div className="worksuite-section-header">
              <h2>Modules</h2>
            </div>
            <ModuleGrid items={COMPANY_MODULES} onNavigate={navigate} />

            <div className="worksuite-section-header">
              <h2>Company Tools</h2>
            </div>
            <ModuleGrid items={COMPANY_TOOLS} onNavigate={navigate} />
          </>
        ) : (
          <>
            <div className="worksuite-section-header">
              <h2>Planning</h2>
            </div>
            <ModuleGrid items={GROWTH_MODULES} onNavigate={navigate} />

            <div className="worksuite-section-header">
              <h2>Tools</h2>
            </div>
            <ModuleGrid items={FREELANCE_MODULES} onNavigate={navigate} />
          </>
        )}
      </div>
    </div>
  );
};
