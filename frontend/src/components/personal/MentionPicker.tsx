import React, { useState, useRef, useEffect } from 'react';
import { mentionService } from '@/services/mentionService';
import { Mention, MentionCandidate } from '@/types/feed';
import './MentionPicker.css';

interface MentionPickerProps {
  selected: Mention[];
  onChange: (mentions: Mention[]) => void;
}

export const MentionPicker: React.FC<MentionPickerProps> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MentionCandidate[]>([]);
  const [suggestions, setSuggestions] = useState<MentionCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && suggestions.length === 0) {
      mentionService.getNetworkSuggestions().then(setSuggestions);
    }
  }, [open, suggestions.length]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      const found = await mentionService.search(query);
      setResults(found.filter((r) => !selected.some((s) => s.id === r.id && s.type === r.type)));
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, selected]);

  const addMention = (mention: Mention) => {
    onChange([...selected, mention]);
    setQuery('');
    setResults([]);
    setExpandedId(null);
    inputRef.current?.focus();
  };

  const removeMention = (mention: Mention) => {
    onChange(selected.filter((s) => !(s.id === mention.id && s.type === mention.type)));
  };

  const visibleList = query.trim()
    ? results
    : suggestions.filter((s) => !selected.some((sel) => sel.id === s.id && sel.type === s.type));

  const renderResult = (r: MentionCandidate) => {
    const key = `${r.type}-${r.id}`;
    const isExpanded = expandedId === key;
    const previewLine = r.type === 'company'
      ? [r.headline, r.location].filter(Boolean).join(' · ')
      : [r.companyName || r.headline, r.location].filter(Boolean).join(' · ');

    return (
      <div
        key={key}
        className={`mention-picker__result${isExpanded ? ' mention-picker__result--expanded' : ''}`}
        onMouseEnter={() => setExpandedId(key)}
        onMouseLeave={() => setExpandedId((cur) => (cur === key ? null : cur))}
        onClick={() => addMention(r)}
      >
        <div className="mention-picker__result-row">
          <div className="mention-picker__result-avatar">
            {r.avatarUrl ? <img src={r.avatarUrl} alt={r.name} /> : r.name.charAt(0).toUpperCase()}
          </div>
          <div className="mention-picker__result-info">
            <strong>
              {r.name}
              {r.isConnection && <span className="mention-picker__connected-badge">Connected</span>}
            </strong>
            <span>{previewLine || (r.type === 'company' ? 'Company' : 'Person')}</span>
          </div>
        </div>
        {isExpanded && (r.bio || r.headline) && (
          <div className="mention-picker__preview">
            {r.headline && <div className="mention-picker__preview-headline">{r.headline}</div>}
            {r.bio && <div className="mention-picker__preview-bio">{r.bio}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mention-picker" ref={wrapRef}>
      <button
        type="button"
        className="mention-picker__toggle"
        onClick={() => { setOpen((v) => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        @ {selected.length > 0 ? `Tagged (${selected.length})` : 'Tag people or companies'}
      </button>

      {selected.length > 0 && (
        <div className="mention-picker__chips">
          {selected.map((m) => (
            <span key={`${m.type}-${m.id}`} className="mention-picker__chip">
              {m.avatarUrl && <img src={m.avatarUrl} alt={m.name} />}
              {m.name}
              <button type="button" onClick={() => removeMention(m)}>×</button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="mention-picker__dropdown">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search people or companies…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mention-picker__results">
            {!query.trim() && (
              <div className="mention-picker__section-label">
                {suggestions.length > 0 ? 'From your network' : 'Start typing to search'}
              </div>
            )}
            {isSearching ? (
              <div className="mention-picker__empty">Searching…</div>
            ) : query.trim() && visibleList.length === 0 ? (
              <div className="mention-picker__empty">No matches</div>
            ) : (
              visibleList.map(renderResult)
            )}
          </div>
        </div>
      )}
    </div>
  );
};
