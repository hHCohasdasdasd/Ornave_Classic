import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { eventService, OrnaveEvent, EventMediaItem, getEventMedia } from '@/services/eventService';
import { storeService, Product } from '@/services/storeService';
import { Navbar } from '@/components/ui/Navbar';
import { IconSearch, IconCalendar, IconClock, IconMapPin, IconGlobe, IconImage, IconUsers, IconLink, IconBookmark, IconShare, IconCheck } from '@/components/ui/Icons';
import './EventsPage.css';

const formatMonth = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
const formatDay = (iso: string) => new Date(iso).getDate();
const formatFullDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const formatPrice = (price: number, currency: string): string => {
  if (price <= 0) return 'Free';
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${price.toFixed(2)}`;
};

const getMapEmbedUrl = (mapUrl: string): string => {
  try {
    const url = new URL(mapUrl);
    if (url.searchParams.get('output') === 'embed') return mapUrl;
    const query = url.searchParams.get('q') || mapUrl;
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  } catch {
    return `https://www.google.com/maps?q=${encodeURIComponent(mapUrl)}&output=embed`;
  }
};

interface CreateEventFormState {
  title: string;
  description: string;
  detailedDescription: string;
  coverImage: string;
  category: string;
  date: string;
  time: string;
  endTime: string;
  isVirtual: boolean;
  location: string;
  mapUrl: string;
  externalLink: string;
  price: string;
  capacity: string;
  ticketProductId: string;
  isPromoted: boolean;
}

const EMPTY_FORM: CreateEventFormState = {
  title: '',
  description: '',
  detailedDescription: '',
  coverImage: '',
  category: '',
  date: '',
  time: '',
  endTime: '',
  isVirtual: false,
  location: '',
  mapUrl: '',
  externalLink: '',
  price: '',
  capacity: '',
  ticketProductId: '',
  isPromoted: false,
};

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, triggerAuthModal } = useAuth();
  const [events, setEvents] = useState<OrnaveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [viewMode, setViewMode] = useState<'browse' | 'mine'>('browse');
  const [selectedEvent, setSelectedEvent] = useState<OrnaveEvent | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateEventFormState>(EMPTY_FORM);
  const [mediaItems, setMediaItems] = useState<EventMediaItem[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [companyProducts, setCompanyProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null);
  const [saveBusyId, setSaveBusyId] = useState<string | null>(null);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [ticketQty, setTicketQty] = useState(1);
  const [promotedEvents, setPromotedEvents] = useState<OrnaveEvent[]>([]);
  const [promoIndex, setPromoIndex] = useState(0);
  const [promoAutoplay, setPromoAutoplay] = useState(true);
  const canPromote = !!user && user.userType === 'COMPANY_USER' && user.id !== 'guest';

  useEffect(() => {
    eventService.getPromotedEvents().then(setPromotedEvents);
  }, []);

  useEffect(() => {
    if (!promoAutoplay || promotedEvents.length < 2) return;
    const interval = setInterval(() => {
      setPromoIndex((i) => (i + 1) % promotedEvents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promoAutoplay, promotedEvents.length]);

  const goToPromo = (index: number) => {
    setPromoIndex(index);
    setPromoAutoplay(false);
  };

  const goToPromoPrev = () => {
    setPromoIndex((i) => (i - 1 + promotedEvents.length) % promotedEvents.length);
    setPromoAutoplay(false);
  };

  const goToPromoNext = () => {
    setPromoIndex((i) => (i + 1) % promotedEvents.length);
    setPromoAutoplay(false);
  };

  useEffect(() => {
    if (viewMode === 'browse') {
      loadEvents();
    } else {
      loadMyEvents();
    }
  }, [when, viewMode]);

  useEffect(() => {
    document.body.style.overflow = (selectedEvent || showCreateModal) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedEvent, showCreateModal]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventService.listEvents({ when });
      setEvents(data.items);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyEvents = async () => {
    if (!user || user.id === 'guest') {
      setEvents([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [hosting, attending, saved] = await Promise.all([
        eventService.getMyEvents(),
        eventService.getAttendingEvents(),
        eventService.getSavedEvents(),
      ]);
      const merged = new Map<string, OrnaveEvent>();
      [...hosting, ...attending, ...saved].forEach((e) => merged.set(e.id, e));
      const now = Date.now();
      const list = Array.from(merged.values()).filter((e) => when === 'upcoming' ? new Date(e.startAt).getTime() >= now : new Date(e.startAt).getTime() < now);
      list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      setEvents(list);
    } catch (error) {
      console.error('Failed to load your events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = useMemo(() => {
    const unique = new Set(events.map((e) => e.category || 'Other'));
    return ['All', ...Array.from(unique).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((e) => {
      const matchesCategory = activeCategory === 'All' || (e.category || 'Other') === activeCategory;
      const matchesSearch = !q
        || e.title.toLowerCase().includes(q)
        || (e.description || '').toLowerCase().includes(q)
        || `${e.author.firstName} ${e.author.lastName}`.toLowerCase().includes(q)
        || (e.author.companyName || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [events, activeCategory, searchQuery]);

  const openEvent = (event: OrnaveEvent) => {
    setGalleryIndex(0);
    setTicketQty(1);
    setSelectedEvent(event);
  };
  const closeEvent = () => setSelectedEvent(null);

  useEffect(() => {
    const eventId = searchParams.get('event');
    if (!eventId) return;
    eventService.getEvent(eventId).then((event) => {
      if (event) openEvent(event);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetTickets = (event: OrnaveEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!event.ticketProduct) return;
    closeEvent();
    navigate(`/store?product=${event.ticketProduct.id}`);
  };

  const handleBookTickets = (event: OrnaveEvent) => {
    if (!event.ticketProduct) return;
    if (!user || user.id === 'guest') {
      triggerAuthModal('Sign in to book tickets for this event.');
      return;
    }
    closeEvent();
    navigate(`/store?addToCart=${event.ticketProduct.id}&qty=${ticketQty}`);
  };

  const handleShareEvent = async (event: OrnaveEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/events?event=${event.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.description || undefined, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiedEventId(event.id);
      setTimeout(() => setCopiedEventId(null), 2000);
    } catch {
      // Share sheet dismissed or clipboard denied — nothing to recover.
    }
  };

  const handleRsvp = async (event: OrnaveEvent, status: 'GOING' | 'INTERESTED', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user || user.id === 'guest') {
      triggerAuthModal('Sign in to RSVP to this event.');
      return;
    }
    try {
      setRsvpBusyId(event.id);
      const updated = event.myRsvp === status
        ? await eventService.cancelRsvp(event.id)
        : await eventService.rsvp(event.id, status);
      setEvents((prev) => prev.map((e2) => e2.id === updated.id ? updated : e2));
      setPromotedEvents((prev) => prev.map((e2) => e2.id === updated.id ? updated : e2));
      setSelectedEvent((prev) => (prev && prev.id === updated.id ? updated : prev));
    } catch (error) {
      console.error('RSVP failed:', error);
    } finally {
      setRsvpBusyId(null);
    }
  };

  const handleToggleSave = async (event: OrnaveEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user || user.id === 'guest') {
      triggerAuthModal('Sign in to save this event.');
      return;
    }
    try {
      setSaveBusyId(event.id);
      const updated = event.isSaved
        ? await eventService.unsaveEvent(event.id)
        : await eventService.saveEvent(event.id);
      setEvents((prev) => prev.map((e2) => e2.id === updated.id ? updated : e2));
      setPromotedEvents((prev) => prev.map((e2) => e2.id === updated.id ? updated : e2));
      setSelectedEvent((prev) => (prev && prev.id === updated.id ? updated : prev));
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaveBusyId(null);
    }
  };

  const openCreateModal = () => {
    if (!user || user.id === 'guest') {
      triggerAuthModal('Sign in to create an event.');
      return;
    }
    if (!canPromote) {
      return;
    }
    setForm(EMPTY_FORM);
    setMediaItems([]);
    setMediaType('image');
    setMediaUrl('');
    setShowCreateModal(true);
    if ((user as any).companyId) {
      storeService.getCompanyProducts((user as any).companyId).then(setCompanyProducts);
    }
  };

  const closeCreateModal = () => setShowCreateModal(false);

  const addMediaItem = () => {
    if (!mediaUrl.trim()) return;
    setMediaItems((prev) => [...prev, { type: mediaType, url: mediaUrl.trim() }]);
    setMediaUrl('');
  };

  const removeMediaItem = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit = form.title.trim().length > 0 && form.date && form.time;

  const handleCreateEvent = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      const startAt = new Date(`${form.date}T${form.time}`).toISOString();
      const endAt = form.endTime ? new Date(`${form.date}T${form.endTime}`).toISOString() : undefined;
      await eventService.createEvent({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        detailedDescription: form.detailedDescription.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        media: mediaItems.length ? mediaItems : undefined,
        category: form.category.trim() || undefined,
        startAt,
        endAt,
        isVirtual: form.isVirtual,
        location: form.location.trim() || undefined,
        mapUrl: form.mapUrl.trim() || undefined,
        externalLink: form.externalLink.trim() || undefined,
        price: form.price ? parseFloat(form.price) : 0,
        capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
        ticketProductId: form.ticketProductId || undefined,
        isPromoted: canPromote ? form.isPromoted : undefined,
      });
      setShowCreateModal(false);
      loadEvents();
      eventService.getPromotedEvents().then(setPromotedEvents);
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="events-page">
      <Navbar />
      <div className="events-page__container">
        <header className="events-page__header">
          <div>
            <h1 className="events-page__title">{viewMode === 'mine' ? 'My Events' : 'Events'}</h1>
            <p className="events-page__subtitle">
              {viewMode === 'mine'
                ? "Events you're hosting or attending."
                : 'Discover meetups, webinars, and gatherings hosted across your network.'}
            </p>
          </div>
          <div className="events-page__header-actions">
            <button
              className="events-page__my-events-btn"
              onClick={() => setViewMode((m) => (m === 'mine' ? 'browse' : 'mine'))}
            >
              <IconCalendar size={14} />
              {viewMode === 'mine' ? 'All Events' : 'My Events'}
            </button>
            {(!user || user.id === 'guest' || canPromote) && (
              <button className="events-page__create-btn" onClick={openCreateModal}>
                + Create Event
              </button>
            )}
          </div>
        </header>

        {viewMode === 'browse' && promotedEvents.length > 0 && (
          <div className="promo-carousel">
            <div className="promo-carousel__track">
              {promotedEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`promo-carousel__slide ${index === promoIndex ? 'active' : ''}`}
                  onClick={() => openEvent(event)}
                >
                  {event.coverImage ? (
                    <img className="promo-carousel__image" src={event.coverImage} alt={event.title} />
                  ) : (
                    <div className="promo-carousel__image-placeholder" />
                  )}
                  <div className="promo-carousel__overlay" />
                  <span className="promo-carousel__badge">★ Promoted</span>
                  <div className="promo-carousel__content">
                    {event.category && <span className="promo-carousel__category">{event.category}</span>}
                    <h2 className="promo-carousel__title">{event.title}</h2>
                    <div className="promo-carousel__meta">
                      <span><IconCalendar size={13} /> {formatMonth(event.startAt)} {formatDay(event.startAt)} · {formatTime(event.startAt)}</span>
                      <span>{event.isVirtual ? <IconGlobe size={13} /> : <IconMapPin size={13} />} {event.isVirtual ? 'Virtual' : (event.location || 'Location TBA')}</span>
                    </div>
                    <p className="promo-carousel__host">Hosted by {event.author.companyName || `${event.author.firstName} ${event.author.lastName}`}</p>
                    <button className="promo-carousel__cta" onClick={(e) => { e.stopPropagation(); openEvent(event); }}>
                      View Event
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {promotedEvents.length > 1 && (
              <>
                <button className="promo-carousel__nav promo-carousel__nav--prev" onClick={goToPromoPrev} aria-label="Previous">‹</button>
                <button className="promo-carousel__nav promo-carousel__nav--next" onClick={goToPromoNext} aria-label="Next">›</button>
                <div className="promo-carousel__dots">
                  {promotedEvents.map((_, i) => (
                    <button
                      key={i}
                      className={`promo-carousel__dot ${i === promoIndex ? 'active' : ''}`}
                      onClick={() => goToPromo(i)}
                      aria-label={`Featured event ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="events-page__toolbar">
          <div className="events-page__toolbar-row">
            <div className="events-page__search">
              <span className="events-page__search-icon"><IconSearch size={15} /></span>
              <input
                className="events-page__search-input"
                type="text"
                placeholder="Search events…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="events-page__when-toggle">
              <button className={`events-page__when-pill ${when === 'upcoming' ? 'active' : ''}`} onClick={() => setWhen('upcoming')}>Upcoming</button>
              <button className={`events-page__when-pill ${when === 'past' ? 'active' : ''}`} onClick={() => setWhen('past')}>Past</button>
            </div>
          </div>
          {categories.length > 1 && (
            <div className="events-page__categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`events-page__category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {!isLoading && (
          <p className="events-page__result-count">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </p>
        )}

        <div className="events-page__grid">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="event-card event-card--skeleton">
                <div className="event-card__image-placeholder" />
                <div className="event-card__body">
                  <div className="events-page__skeleton-line" style={{ width: '40%' }} />
                  <div className="events-page__skeleton-line" style={{ width: '80%', height: 14 }} />
                  <div className="events-page__skeleton-line" style={{ width: '60%' }} />
                </div>
              </div>
            ))
          ) : filteredEvents.length === 0 ? (
            <div className="events-page__empty">
              <div className="events-page__empty-icon"><IconCalendar size={36} /></div>
              <h3 className="events-page__empty-title">No events found</h3>
              <p className="events-page__empty-text">
                {events.length === 0
                  ? viewMode === 'mine'
                    ? (when === 'upcoming' ? "You're not hosting or attending any upcoming events." : 'No past events to show.')
                    : (when === 'upcoming' ? (canPromote ? 'No upcoming events yet — be the first to host one.' : 'No upcoming events yet — check back once a firm you follow posts one.') : 'No past events to show.')
                  : 'Try a different search term or category.'}
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="event-card" onClick={() => openEvent(event)}>
                <div className="event-card__media">
                  {event.coverImage ? (
                    <img className="event-card__image" src={event.coverImage} alt={event.title} />
                  ) : (
                    <div className="event-card__image-placeholder"><IconImage size={26} /></div>
                  )}
                  <div className="event-card__date-badge">
                    <span className="event-card__date-month">{formatMonth(event.startAt)}</span>
                    <span className="event-card__date-day">{formatDay(event.startAt)}</span>
                  </div>
                  {getEventMedia(event).length > 1 && (
                    <span className="event-card__media-count">+{getEventMedia(event).length - 1}</span>
                  )}
                  <button
                    className="event-card__share-btn"
                    onClick={(e) => handleShareEvent(event, e)}
                    aria-label="Share event"
                  >
                    {copiedEventId === event.id ? <IconCheck size={13} /> : <IconShare size={13} />}
                  </button>
                  <button
                    className={`event-card__save-btn ${event.isSaved ? 'saved' : ''}`}
                    disabled={saveBusyId === event.id}
                    onClick={(e) => handleToggleSave(event, e)}
                    aria-label={event.isSaved ? 'Unsave event' : 'Save event'}
                  >
                    <IconBookmark size={14} />
                  </button>
                </div>
                <div className="event-card__body">
                  {event.category && <span className="event-card__category">{event.category}</span>}
                  <h3 className="event-card__name">{event.title}</h3>
                  <p className="event-card__host">{event.author.companyName || `${event.author.firstName} ${event.author.lastName}`}</p>
                  <span className="event-card__meta">
                    {event.isVirtual ? <IconGlobe size={12} /> : <IconMapPin size={12} />}
                    {event.isVirtual ? 'Virtual event' : (event.location || 'Location TBA')}
                  </span>
                  <div className="event-card__footer">
                    <span className="event-card__attendees">{event.attendeeCount} going</span>
                    {event.ticketProduct ? (
                      <button
                        className="event-card__rsvp-btn event-card__rsvp-btn--tickets"
                        onClick={(e) => handleGetTickets(event, e)}
                      >
                        Get Tickets
                      </button>
                    ) : (
                      <button
                        className={`event-card__rsvp-btn ${event.myRsvp === 'GOING' ? 'going' : ''}`}
                        disabled={rsvpBusyId === event.id}
                        onClick={(e) => handleRsvp(event, 'GOING', e)}
                      >
                        {event.myRsvp === 'GOING' ? 'Going ✓' : 'RSVP'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedEvent && (() => {
        const media = getEventMedia(selectedEvent);
        const current = media[galleryIndex] || media[0];
        const goPrev = (e: React.MouseEvent) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + media.length) % media.length); };
        const goNext = (e: React.MouseEvent) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % media.length); };
        return (
        <div className="event-modal-overlay" onClick={closeEvent}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <button className="event-modal__close" onClick={closeEvent}>×</button>
            <button
              className={`event-modal__save-btn ${selectedEvent.isSaved ? 'saved' : ''}`}
              disabled={saveBusyId === selectedEvent.id}
              onClick={(e) => handleToggleSave(selectedEvent, e)}
              aria-label={selectedEvent.isSaved ? 'Unsave event' : 'Save event'}
            >
              <IconBookmark size={16} />
            </button>
            <button
              className="event-modal__share-btn"
              onClick={(e) => handleShareEvent(selectedEvent, e)}
              aria-label="Share event"
            >
              {copiedEventId === selectedEvent.id ? <IconCheck size={16} /> : <IconShare size={16} />}
            </button>

            <div className="event-modal__media">
              {current ? (
                current.type === 'video' ? (
                  <video className="event-modal__image" src={current.url} controls muted />
                ) : (
                  <img className="event-modal__image" src={current.url} alt={selectedEvent.title} />
                )
              ) : (
                <div className="event-modal__image-placeholder"><IconImage size={48} /></div>
              )}
              <div className="event-modal__date-badge">
                <span className="event-modal__date-month">{formatMonth(selectedEvent.startAt)}</span>
                <span className="event-modal__date-day">{formatDay(selectedEvent.startAt)}</span>
              </div>
              {selectedEvent.category && <span className="event-modal__category">{selectedEvent.category}</span>}
              {media.length > 1 && (
                <>
                  <button className="event-modal__nav event-modal__nav--prev" onClick={goPrev} aria-label="Previous">‹</button>
                  <button className="event-modal__nav event-modal__nav--next" onClick={goNext} aria-label="Next">›</button>
                  <div className="event-modal__dots">
                    {media.map((_, i) => (
                      <button
                        key={i}
                        className={`event-modal__dot ${i === galleryIndex ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex(i); }}
                        aria-label={`Media ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="event-modal__body">
              <h2 className="event-modal__name">{selectedEvent.title}</h2>

              <button
                className="event-modal__host"
                onClick={() => { closeEvent(); navigate(`/profile?view=${selectedEvent.authorId}`); }}
              >
                <span className="event-modal__host-avatar">
                  {(selectedEvent.author.companyName || selectedEvent.author.firstName).charAt(0).toUpperCase()}
                </span>
                <span className="event-modal__host-text">
                  <span className="event-modal__host-label">Hosted by</span>
                  <span className="event-modal__host-name">{selectedEvent.author.companyName || `${selectedEvent.author.firstName} ${selectedEvent.author.lastName}`}</span>
                </span>
                <span className="event-modal__host-link">View Profile ›</span>
              </button>

              <div className="event-modal__facts">
                <div className="event-modal__fact">
                  <IconClock size={16} />
                  {formatFullDate(selectedEvent.startAt)} · {formatTime(selectedEvent.startAt)}
                  {selectedEvent.endAt ? ` – ${formatTime(selectedEvent.endAt)}` : ''}
                </div>
                <div className="event-modal__fact">
                  {selectedEvent.isVirtual ? <IconGlobe size={16} /> : <IconMapPin size={16} />}
                  {selectedEvent.isVirtual ? (selectedEvent.location || 'Virtual event') : (selectedEvent.location || 'Location TBA')}
                </div>
                <div className="event-modal__fact">
                  <IconUsers size={16} />
                  {selectedEvent.attendeeCount} going{selectedEvent.capacity ? ` · ${selectedEvent.capacity} spots total` : ''}
                </div>
              </div>

              {(selectedEvent.detailedDescription || selectedEvent.description) && (
                <div className="event-modal__description">
                  {(selectedEvent.detailedDescription || selectedEvent.description || '')
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                </div>
              )}

              {selectedEvent.mapUrl && (
                <div className="event-modal__map">
                  <iframe
                    src={getMapEmbedUrl(selectedEvent.mapUrl)}
                    title="Event location map"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a className="event-modal__map-link" href={selectedEvent.mapUrl} target="_blank" rel="noopener noreferrer">
                    <IconMapPin size={12} /> Open in Maps ›
                  </a>
                </div>
              )}

              {selectedEvent.externalLink && (
                <div className="event-modal__links">
                  <a className="event-modal__link-btn" href={selectedEvent.externalLink} target="_blank" rel="noopener noreferrer">
                    <IconLink size={14} /> Event website
                  </a>
                </div>
              )}
            </div>

            <div className="event-modal__ticket">
              <span className="event-modal__ticket-notch event-modal__ticket-notch--left" />
              <span className="event-modal__ticket-notch event-modal__ticket-notch--right" />
              <div className="event-modal__ticket-info">
                <div className="event-modal__ticket-price">
                  <span className="event-modal__price-label">{selectedEvent.ticketProduct ? 'Tickets from' : 'Price'}</span>
                  <span className="event-modal__price">
                    {selectedEvent.ticketProduct
                      ? formatPrice(selectedEvent.ticketProduct.price, selectedEvent.currency)
                      : formatPrice(selectedEvent.price, selectedEvent.currency)}
                  </span>
                </div>
                <span className="event-modal__attendee-count">{selectedEvent.attendeeCount} going · {selectedEvent.interestedCount} interested</span>
              </div>
              {selectedEvent.ticketProduct ? (
                <div className="event-modal__ticket-purchase">
                  <div className="event-modal__rsvp-actions">
                    <div className="event-modal__ticket-stepper">
                      <button type="button" onClick={() => setTicketQty((q) => Math.max(1, q - 1))}>−</button>
                      <span>{ticketQty}</span>
                      <button
                        type="button"
                        onClick={() => setTicketQty((q) => Math.min(selectedEvent.ticketProduct!.stock || 99, q + 1))}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="event-modal__rsvp-btn event-modal__rsvp-btn--primary"
                      disabled={selectedEvent.ticketProduct.stock <= 0}
                      onClick={() => handleBookTickets(selectedEvent)}
                    >
                      {selectedEvent.ticketProduct.stock <= 0 ? 'Sold Out' : 'Add to Cart'}
                    </button>
                  </div>
                  <button className="event-modal__ticket-external" onClick={() => handleGetTickets(selectedEvent)}>
                    View in Marketplace ›
                  </button>
                </div>
              ) : (
                <div className="event-modal__rsvp-actions">
                  <button
                    className={`event-modal__rsvp-btn event-modal__rsvp-btn--primary ${selectedEvent.myRsvp === 'GOING' ? 'active' : ''}`}
                    disabled={rsvpBusyId === selectedEvent.id}
                    onClick={() => handleRsvp(selectedEvent, 'GOING')}
                  >
                    {selectedEvent.myRsvp === 'GOING' ? "You're Going ✓" : "I'm Going"}
                  </button>
                  <button
                    className={`event-modal__rsvp-btn ${selectedEvent.myRsvp === 'INTERESTED' ? 'active' : ''}`}
                    disabled={rsvpBusyId === selectedEvent.id}
                    onClick={() => handleRsvp(selectedEvent, 'INTERESTED')}
                  >
                    {selectedEvent.myRsvp === 'INTERESTED' ? 'Interested ✓' : 'Interested'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {showCreateModal && (
        <div className="create-event-modal-overlay" onClick={closeCreateModal}>
          <div className="create-event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-event-modal__header">
              <h2>Create an Event</h2>
              <button className="create-event-modal__close" onClick={closeCreateModal}>×</button>
            </div>

            <div className="create-event-modal__content">
              <div className="create-event-modal__field-group">
                <label className="create-event-modal__label">Title</label>
                <input
                  className="create-event-modal__input"
                  type="text"
                  placeholder="e.g. Founders Networking Mixer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="create-event-modal__field-group">
                <label className="create-event-modal__label">Short description</label>
                <input
                  className="create-event-modal__input"
                  type="text"
                  placeholder="Shown on the event card"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="create-event-modal__field-group">
                <label className="create-event-modal__label">Detailed description</label>
                <textarea
                  className="create-event-modal__textarea"
                  placeholder="Give attendees the full picture — agenda, what to bring, who it's for…"
                  rows={5}
                  value={form.detailedDescription}
                  onChange={(e) => setForm({ ...form, detailedDescription: e.target.value })}
                />
              </div>

              <div className="create-event-modal__row">
                <div className="create-event-modal__field-group">
                  <label className="create-event-modal__label">Date</label>
                  <input
                    className="create-event-modal__input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="create-event-modal__field-group">
                  <label className="create-event-modal__label">Start time</label>
                  <input
                    className="create-event-modal__input"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
                <div className="create-event-modal__field-group">
                  <label className="create-event-modal__label">End time</label>
                  <input
                    className="create-event-modal__input"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>

              <label className="create-event-modal__checkbox-row">
                <input
                  type="checkbox"
                  checked={form.isVirtual}
                  onChange={(e) => setForm({ ...form, isVirtual: e.target.checked })}
                />
                This is a virtual event
              </label>

              {canPromote && (
                <label className="create-event-modal__checkbox-row create-event-modal__checkbox-row--promote">
                  <input
                    type="checkbox"
                    checked={form.isPromoted}
                    onChange={(e) => setForm({ ...form, isPromoted: e.target.checked })}
                  />
                  Promote this event in the featured carousel
                </label>
              )}

              <div className="create-event-modal__field-group">
                <label className="create-event-modal__label">{form.isVirtual ? 'Meeting link' : 'Location'}</label>
                <input
                  className="create-event-modal__input"
                  type="text"
                  placeholder={form.isVirtual ? 'https://…' : 'Address or venue name'}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              {!form.isVirtual && (
                <div className="create-event-modal__field-group">
                  <label className="create-event-modal__label">Map link (optional)</label>
                  <input
                    className="create-event-modal__input"
                    type="text"
                    placeholder="Paste a Google Maps link"
                    value={form.mapUrl}
                    onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
                  />
                </div>
              )}

              <div className="create-event-modal__field-group">
                <label className="create-event-modal__label">Website / registration link (optional)</label>
                <input
                  className="create-event-modal__input"
                  type="text"
                  placeholder="https://…"
                  value={form.externalLink}
                  onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
                />
              </div>

              <div className="create-event-modal__row">
                <div className="create-event-modal__field-group">
                  <label className="create-event-modal__label">Category</label>
                  <input
                    className="create-event-modal__input"
                    type="text"
                    placeholder="e.g. Networking"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="create-event-modal__field-group">
                  <label className="create-event-modal__label">Price (USD, blank = free)</label>
                  <input
                    className="create-event-modal__input"
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="create-event-modal__field-group">
                  <label className="create-event-modal__label">Capacity (optional)</label>
                  <input
                    className="create-event-modal__input"
                    type="number"
                    placeholder="Unlimited"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                </div>
              </div>

              {companyProducts.length > 0 && (
                <div className="create-event-modal__field-group">
                  <label className="create-event-modal__label">Tickets (optional)</label>
                  <select
                    className="create-event-modal__select"
                    value={form.ticketProductId}
                    onChange={(e) => setForm({ ...form, ticketProductId: e.target.value })}
                  >
                    <option value="">Open event — RSVP only</option>
                    {companyProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.price > 0 ? `$${p.price.toFixed(2)}` : 'Free'}</option>
                    ))}
                  </select>
                  <p className="create-event-modal__hint">
                    Link a product from your store to sell tickets. Attendees will be sent to checkout instead of RSVPing directly.
                  </p>
                </div>
              )}

              <div className="create-event-modal__field-group">
                <label className="create-event-modal__label">Photos &amp; videos (optional)</label>
                <div className="create-event-modal__media-row">
                  <select
                    className="create-event-modal__select"
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <input
                    className="create-event-modal__input"
                    type="text"
                    placeholder={mediaType === 'video' ? 'Video URL' : 'Image URL'}
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMediaItem(); } }}
                  />
                  <button type="button" className="create-event-modal__media-add" onClick={addMediaItem}>Add</button>
                </div>
                {mediaItems.length > 0 && (
                  <div className="create-event-modal__media-list">
                    {mediaItems.map((item, i) => (
                      <div key={i} className="create-event-modal__media-item">
                        <span className="create-event-modal__media-type">{item.type}</span>
                        <span className="create-event-modal__media-url">{item.url}</span>
                        <button type="button" onClick={() => removeMediaItem(i)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="create-event-modal__footer">
              <button className="create-event-modal__cancel" onClick={closeCreateModal}>Cancel</button>
              <button className="create-event-modal__submit" onClick={handleCreateEvent} disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
