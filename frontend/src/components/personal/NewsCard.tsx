import React, { useState, useEffect, useRef } from 'react';
import './NewsCard.css';

interface NewsItem {
  id: number;
  category: string;
  headline: string;
  source: string;
  minutesAgo: number;
  isNew?: boolean;
}

const INITIAL_NEWS: NewsItem[] = [
  { id: 1, category: 'Markets', headline: 'Global trade volumes rebound 8% in Q2 as supply chains stabilize after Red Sea disruptions', source: 'Reuters', minutesAgo: 4 },
  { id: 2, category: 'Technology', headline: 'DeepCode AI raises $40M Series B to expand its automated code security platform into Europe', source: 'TechCrunch', minutesAgo: 11 },
  { id: 3, category: 'Energy', headline: 'Solar capacity additions hit record 420 GW globally in first half of 2026, led by Spain and India', source: 'Bloomberg', minutesAgo: 18 },
  { id: 4, category: 'Finance', headline: 'Meridian Capital closes $280M fund targeting B2B software and trade infrastructure companies', source: 'WSJ', minutesAgo: 26 },
  { id: 5, category: 'Logistics', headline: 'Last-mile delivery costs fall 14% as autonomous vehicle pilots scale across 20 cities', source: 'FT', minutesAgo: 34 },
  { id: 6, category: 'Healthcare', headline: 'AI-assisted diagnostics platform receives EU regulatory approval for radiology applications', source: 'MedCity', minutesAgo: 47 },
  { id: 7, category: 'Manufacturing', headline: 'NovaTech Robotics announces next-gen cobot line with 40% faster installation time', source: 'Industry Week', minutesAgo: 58 },
  { id: 8, category: 'Hiring', headline: 'Tech sector adds 340K jobs in June — ML engineers and cloud architects remain most in demand', source: 'LinkedIn', minutesAgo: 72 },
  { id: 9, category: 'ESG', headline: 'New EU carbon border tax comes into full effect — importers now face mandatory reporting', source: 'Euractiv', minutesAgo: 89 },
  { id: 10, category: 'Markets', headline: 'Cross-border e-commerce between Europe and Southeast Asia grows 31% year-over-year', source: 'CNBC', minutesAgo: 103 },
  { id: 11, category: 'Startups', headline: 'West African fintech sector sees $1.2B in VC funding in H1 2026, doubling 2025 totals', source: 'Quartz', minutesAgo: 120 },
  { id: 12, category: 'Cybersecurity', headline: 'Supply chain software attacks up 67% — security teams urged to audit third-party dependencies', source: 'Wired', minutesAgo: 145 },
];

const NEW_FLASHES: Omit<NewsItem, 'id' | 'minutesAgo'>[] = [
  { category: 'Breaking', headline: 'Federal Reserve signals rate hold through Q3 as inflation nears 2% target', source: 'Bloomberg', isNew: true },
  { category: 'Markets', headline: 'EUR/USD hits six-month high amid strong eurozone manufacturing data', source: 'Reuters', isNew: true },
  { category: 'Technology', headline: 'OpenAI announces enterprise API pricing cuts of up to 60% for high-volume customers', source: 'TechCrunch', isNew: true },
  { category: 'Logistics', headline: 'Port of Rotterdam sets new weekly throughput record as European demand surges', source: 'FT', isNew: true },
  { category: 'ESG', headline: 'G7 nations agree on unified carbon accounting standard for cross-border trade', source: 'Guardian', isNew: true },
];

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  return `${h}h ago`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Breaking: '#7a2731',
  Markets: '#1f4e5f',
  Technology: '#5b4a6f',
  Energy: '#0b3d2e',
  Finance: '#b8955f',
  Logistics: '#4a6670',
  Healthcare: '#0d6b5f',
  Manufacturing: '#6b6558',
  Hiring: '#6b4423',
  ESG: '#0d6b5f',
  Startups: '#5b4a6f',
  Cybersecurity: '#7a2731',
};

export const NewsCard: React.FC = () => {
  const [items, setItems] = useState<NewsItem[]>(INITIAL_NEWS);
  const [flashIndex, setFlashIndex] = useState(0);
  const [tickerText, setTickerText] = useState(INITIAL_NEWS[0].headline);
  const [tickerIdx, setTickerIdx] = useState(0);
  const idCounter = useRef(100);

  // Rotate ticker every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setTickerIdx(i => {
        const next = (i + 1) % items.length;
        setTickerText(items[next].headline);
        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, [items]);

  // Flash a new item in every 20s
  useEffect(() => {
    const t = setInterval(() => {
      const template = NEW_FLASHES[flashIndex % NEW_FLASHES.length];
      const newItem: NewsItem = {
        ...template,
        id: ++idCounter.current,
        minutesAgo: 0,
        isNew: true,
      };
      setItems(prev => [newItem, ...prev.slice(0, 14)]);
      setFlashIndex(i => i + 1);

      // Remove "new" badge after 8s
      setTimeout(() => {
        setItems(prev =>
          prev.map(it => it.id === newItem.id ? { ...it, isNew: false, minutesAgo: 1 } : it)
        );
      }, 8000);
    }, 20000);
    return () => clearInterval(t);
  }, [flashIndex]);

  return (
    <div className="news-card">
      {/* Header */}
      <div className="news-card__header">
        <div className="news-card__title-row">
          <span className="news-card__title">News</span>
          <span className="news-card__live">
            <span className="news-card__live-dot" />
            Live
          </span>
        </div>
        {/* Ticker strip */}
        <div className="news-card__ticker">
          <span className="news-card__ticker-label">NOW</span>
          <div className="news-card__ticker-text" key={tickerIdx}>
            {tickerText}
          </div>
        </div>
      </div>

      {/* News list */}
      <div className="news-card__list">
        {items.map((item) => (
          <div
            key={item.id}
            className={`news-card__item ${item.isNew ? 'news-card__item--new' : ''}`}
          >
            <div className="news-card__item-top">
              <span
                className="news-card__category"
                style={{ color: CATEGORY_COLORS[item.category] ?? 'var(--color-primary)' }}
              >
                {item.category}
              </span>
              {item.isNew ? (
                <span className="news-card__new-badge">NEW</span>
              ) : (
                <span className="news-card__time">{formatTime(item.minutesAgo)}</span>
              )}
            </div>
            <p className="news-card__headline">{item.headline}</p>
            <span className="news-card__source">{item.source}</span>
          </div>
        ))}
      </div>

      <div className="news-card__footer">
        Powered by Ornave Intelligence
      </div>
    </div>
  );
};
