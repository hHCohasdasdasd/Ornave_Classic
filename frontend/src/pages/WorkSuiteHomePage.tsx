import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, WorkSuiteSummary, WorkSuiteInsight } from '@/services/workSuiteService';
import './WorkSuite.css';

const GROWTH_MODULES = [
  { icon: '🧭', title: 'Personal Growth', description: 'Your board, goals, and achievements — all in one place.', route: '/work-suite/personal' },
];

const FREELANCE_MODULES = [
  { icon: '📁', title: 'Projects', description: 'Track initiatives from kickoff to completion.', route: '/work-suite/projects' },
  { icon: '🤝', title: 'Clients', description: 'A lightweight CRM for the people and firms you work with.', route: '/work-suite/clients' },
  { icon: '🧾', title: 'Invoices', description: 'Bill clients and track what is owed.', route: '/work-suite/invoices' },
];

const COMPANY_MODULES = [
  { icon: '📁', title: 'Projects', description: 'Track initiatives from kickoff to completion.', route: '/work-suite/projects' },
  { icon: '✅', title: 'Tasks', description: 'Everything on your plate, organized by status and priority.', route: '/work-suite/personal?tab=board' },
  { icon: '🤝', title: 'Clients', description: 'A lightweight CRM for the people and firms you work with.', route: '/work-suite/clients' },
  { icon: '🧾', title: 'Invoices', description: 'Bill clients and track what is owed.', route: '/work-suite/invoices' },
];

const COMPANY_TOOLS = [
  { icon: '🧩', title: 'ERP Modules', description: 'Configure internal workflow modules.', route: '/modules' },
  { icon: '📄', title: 'Page Builder', description: 'Build structured internal pages.', route: '/pages' },
  { icon: '💼', title: 'Transactions', description: 'Track B2B orders and payments.', route: '/transactions' },
  { icon: '🏬', title: 'Manage Store', description: 'Manage your storefront products and orders.', route: '/manage-store' },
  { icon: '👥', title: 'Client Management', description: 'Followers, service usage, and engagement.', route: '/firm/clients' },
  { icon: '⚙️', title: 'Company Settings', description: 'Update company information and settings.', route: '/company-settings' },
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
    ? `Your assistant for running ${company?.name || 'the business'} — projects, tasks, clients, and invoicing, plus the full company ERP below.`
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
            <div className="worksuite-assistant__avatar">✦</div>
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
              <div className="worksuite-stat-card">
                <div className="worksuite-stat-card__label">Clients</div>
                <div className="worksuite-stat-card__value">{summary?.clients ?? '—'}</div>
              </div>
              <div className="worksuite-stat-card">
                <div className="worksuite-stat-card__label">Outstanding</div>
                <div className="worksuite-stat-card__value">
                  {summary ? `$${summary.outstandingAmount.toLocaleString()}` : '—'}
                </div>
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
              <h2>Personal Growth</h2>
            </div>
            <ModuleGrid items={GROWTH_MODULES} onNavigate={navigate} />

            {summary && summary.recentAchievements.length > 0 && (
              <>
                <div className="worksuite-section-header">
                  <h2>Recent Achievements</h2>
                  <button className="worksuite-btn" onClick={() => navigate('/work-suite/personal?tab=achievements')}>View all</button>
                </div>
                {summary.recentAchievements.map((a) => (
                  <div key={a.id} className="worksuite-achievement">
                    <div className="worksuite-achievement__icon">{a.category === 'Milestone' ? '🥇' : '🏆'}</div>
                    <div className="worksuite-achievement__main">
                      <div className="worksuite-achievement__title">{a.title}</div>
                      <div className="worksuite-achievement__meta">
                        <span>{new Date(a.achievedAt).toLocaleDateString()}</span>
                        {a.category && <span>{a.category}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="worksuite-section-header">
              <h2>Freelance Tools</h2>
            </div>
            <ModuleGrid items={FREELANCE_MODULES} onNavigate={navigate} />
          </>
        )}
      </div>
    </div>
  );
};
