import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Loader2, MapPin, Globe, Calendar, FileText,
  Users, DollarSign, Lock, ImageIcon, Plus, X, Eye,
} from 'lucide-react';

const TAGS = [
  { emoji: '⛰️', label: 'adventure' }, { emoji: '🎒', label: 'backpacking' },
  { emoji: '🕺', label: 'party' },     { emoji: '😌', label: 'chill' },
  { emoji: '🏛️', label: 'culture' },   { emoji: '💎', label: 'luxury' },
  { emoji: '🌅', label: 'sunrise' },   { emoji: '🏄', label: 'surf' },
  { emoji: '🍜', label: 'food' },      { emoji: '📷', label: 'photography' },
  { emoji: '🌿', label: 'nature' },    { emoji: '🎭', label: 'festivals' },
];

const THEMES = [
  { label: 'Jungle',    value: 'adventure',   gradient: 'linear-gradient(135deg, #1a4a2e, #2d6a4f, #1b263b)' },
  { label: 'Ocean',     value: 'luxury',      gradient: 'linear-gradient(135deg, #0d3b66, #1b6ca8, #5ab4d6)' },
  { label: 'Desert',    value: 'backpacking', gradient: 'linear-gradient(135deg, #7b2d00, #b5451b, #e76f51)' },
  { label: 'Night Sky', value: 'party',       gradient: 'linear-gradient(135deg, #1a1a4e, #3a1c71, #6d28d9)' },
  { label: 'Sunset',    value: 'sunset',      gradient: 'linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)' },
  { label: 'Arctic',    value: 'arctic',      gradient: 'linear-gradient(135deg, #1e3a5f, #4a90d9, #a8d8f0)' },
];

function SectionLabel({ num, title }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-[var(--primary-dim)] text-[var(--primary)] w-fit border border-[var(--primary)]/20">
      {num} / {title}
    </span>
  );
}

export default function EditMeetway() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPreview, setCoverPreview]     = useState(null);

  const [form, setForm] = useState({
    title: '', destination: '', country: '', dateStart: '', dateEnd: '',
    description: '', maxPeople: 10, budgetMin: 200, budgetMax: 800,
    tags: [], privacy: 'public', coverTheme: 'adventure',
  });
  const [itinerary, setItinerary] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get(`/meetways/${id}`).then(res => {
      const m = res.data;
      if (m.hostId !== undefined && m.host?.id !== user.id) {
        navigate('/meetways');
        return;
      }
      setForm({
        title:       m.title       || '',
        destination: m.destination || '',
        country:     m.country     || '',
        dateStart:   m.startDate   ? m.startDate.slice(0, 10) : '',
        dateEnd:     m.endDate     ? m.endDate.slice(0, 10)   : '',
        description: m.description || '',
        maxPeople:   m.maxPeople   || 10,
        budgetMin:   m.budgetMin   || 200,
        budgetMax:   m.budgetMax   || 800,
        tags:        m.tags        || [],
        privacy:     m.privacy     || 'public',
        coverTheme:  m.coverTheme  || 'adventure',
      });
      setItinerary((m.itinerary || []).map(s => ({ ...s, id: Date.now() + Math.random() })));
      if (m.coverPhoto) setCoverPreview(m.coverPhoto);
      setLoading(false);
    }).catch(() => { setError('Failed to load meetway.'); setLoading(false); });
  }, [id, user]); // eslint-disable-line

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function toggleTag(t) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t],
    }));
  }

  function addStop() {
    const maxDay = itinerary.length > 0 ? Math.max(...itinerary.map(s => s.day)) : 0;
    setItinerary(prev => [...prev, { id: Date.now(), day: maxDay + 1, activity: '', location: '', notes: '' }]);
  }
  function updateStop(id, field, val) {
    setItinerary(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  }
  function removeStop(id) {
    setItinerary(prev => prev.filter(s => s.id !== id));
  }

  function onCoverPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverPhotoFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title || !form.destination || !form.dateStart || !form.dateEnd) {
      setError('Title, destination and dates are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/meetways/${id}`, {
        title:       form.title,
        destination: form.destination,
        country:     form.country,
        startDate:   form.dateStart,
        endDate:     form.dateEnd,
        description: form.description,
        maxPeople:   parseInt(form.maxPeople),
        budgetMin:   parseFloat(form.budgetMin),
        budgetMax:   parseFloat(form.budgetMax),
        tags:        form.tags,
        privacy:     form.privacy,
        coverTheme:  form.coverTheme,
        itinerary:   JSON.stringify(itinerary.map(({ id: _id, ...s }) => s)),
      });

      if (coverPhotoFile) {
        const fd = new FormData();
        fd.append('cover', coverPhotoFile);
        await api.post(`/meetways/${id}/cover`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      navigate(`/meetways/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  const theme = THEMES.find(t => t.value === form.coverTheme) || THEMES[0];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-5 sm:pb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-sm font-medium mb-5 sm:mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <h1 className="text-4xl sm:text-5xl font-black text-[var(--text)] tracking-tight leading-tight mb-2">
          Edit Meetway
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] font-medium mb-6">
          Refine your experience
        </p>
        <div className="w-full h-px bg-[var(--border)]" />
      </div>

      {/* ── Two-Column Layout ────────────────────────────────────── */}
      <form onSubmit={handleSave}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

            {/* ─────────────────── LEFT: Form ─────────────────────── */}
            <div className="lg:w-[60%] flex flex-col gap-8 md:gap-12 lg:gap-16 pb-8">

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm font-semibold"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 01 — Set the Vibe ────────────────────────────────── */}
              <section className="flex flex-col gap-6">
                <SectionLabel num="01" title="Set the Vibe" />
                <div className="flex flex-col gap-5">
                  <input
                    type="text"
                    placeholder="What's this meetway about?"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    required
                    className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-0 border-b-2 border-[var(--border)] focus:border-[var(--primary)] pb-3 text-[var(--text)] placeholder:text-[var(--text-muted)]/40 outline-none transition-colors"
                  />
                  <textarea
                    rows={5}
                    placeholder="Describe the experience — what makes this journey worth joining?"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--primary)] focus:bg-[var(--surface-hover)] transition-all outline-none resize-y min-h-[140px] leading-relaxed"
                  />
                </div>
              </section>

              {/* 02 — Where & When ────────────────────────────────── */}
              <section className="flex flex-col gap-6">
                <SectionLabel num="02" title="Where & When" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[var(--primary)]" /> Destination <span className="text-[var(--accent)]">*</span>
                    </label>
                    <input
                      type="text" placeholder="City / Region"
                      value={form.destination}
                      onChange={e => set('destination', e.target.value)}
                      required
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface-hover)] transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-[var(--primary)]" /> Country
                    </label>
                    <input
                      type="text" placeholder="Country"
                      value={form.country}
                      onChange={e => set('country', e.target.value)}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface-hover)] transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[var(--primary)]" /> Start Date <span className="text-[var(--accent)]">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.dateStart}
                      onChange={e => set('dateStart', e.target.value)}
                      required
                      style={{ colorScheme: 'auto' }}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface-hover)] transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[var(--primary)]" /> End Date <span className="text-[var(--accent)]">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.dateEnd}
                      onChange={e => set('dateEnd', e.target.value)}
                      required
                      style={{ colorScheme: 'auto' }}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface-hover)] transition-all outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* 03 — Who Should Join ─────────────────────────────── */}
              <section className="flex flex-col gap-6">
                <SectionLabel num="03" title="Who Should Join" />
                <div className="flex flex-col gap-5">
                  {/* Privacy */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { k: 'public',  icon: <Globe className="w-5 h-5" />,  title: 'Public',  desc: 'Anyone can join instantly' },
                      { k: 'private', icon: <Lock  className="w-5 h-5" />,  title: 'Private', desc: 'Request required to join' },
                    ].map(o => (
                      <button
                        key={o.k}
                        type="button"
                        onClick={() => set('privacy', o.k)}
                        className={`flex flex-col items-start gap-2 p-3 sm:p-5 rounded-2xl border-2 text-left transition-all ${
                          form.privacy === o.k
                            ? 'bg-[var(--primary-dim)] border-[var(--primary)] text-[var(--primary)]'
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        {o.icon}
                        <span className="font-bold text-sm">{o.title}</span>
                        <span className={`text-xs leading-relaxed ${form.privacy === o.k ? 'text-[var(--primary)] opacity-80' : 'text-[var(--text-muted)]'}`}>{o.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Max Travelers */}
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-[var(--primary)]" /> Max Travelers
                      </label>
                      <span className="text-xl font-black text-[var(--primary)]">{form.maxPeople}</span>
                    </div>
                    <input
                      type="range" min={1} max={100} value={form.maxPeople}
                      onChange={e => set('maxPeople', e.target.value)}
                      className="w-full accent-[var(--primary)]"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-[0.62rem] font-bold text-[var(--text-muted)] uppercase tracking-wider">1</span>
                      <span className="text-[0.62rem] font-bold text-[var(--text-muted)] uppercase tracking-wider">100</span>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-green-500" /> Budget Range
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 focus-within:border-[var(--primary)] transition-colors">
                        <span className="text-[var(--text-muted)] text-sm font-bold">₹</span>
                        <input
                          type="number" value={form.budgetMin}
                          onChange={e => set('budgetMin', e.target.value)}
                          placeholder="Min"
                          className="flex-1 bg-transparent border-0 outline-none text-sm text-[var(--text)] p-0"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 focus-within:border-[var(--primary)] transition-colors">
                        <span className="text-[var(--text-muted)] text-sm font-bold">₹</span>
                        <input
                          type="number" value={form.budgetMax}
                          onChange={e => set('budgetMax', e.target.value)}
                          placeholder="Max"
                          className="flex-1 bg-transparent border-0 outline-none text-sm text-[var(--text)] p-0"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Max People</label>
                        <input
                          type="number" min={1} max={100}
                          value={form.maxPeople}
                          onChange={e => set('maxPeople', e.target.value)}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text)] text-center focus:border-[var(--primary)] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 04 — Choose Your Vibe ────────────────────────────── */}
              <section className="flex flex-col gap-6">
                <SectionLabel num="04" title="Choose Your Vibe" />
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(t => {
                    const on = form.tags.includes(t.label);
                    return (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => toggleTag(t.label)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                          on
                            ? 'bg-[var(--primary-dim)] border-[var(--primary)] text-[var(--primary)] scale-105'
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                        }`}
                      >
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 05 — Plan the Experience ─────────────────────────── */}
              <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <SectionLabel num="05" title="Plan the Experience" />
                  <button
                    type="button"
                    onClick={addStop}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full btn-glass text-xs font-bold text-[var(--primary)] hover:text-white transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stop
                  </button>
                </div>

                {itinerary.length === 0 ? (
                  <motion.button
                    type="button"
                    onClick={addStop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-2 border-dashed border-[var(--border)] rounded-2xl p-5 sm:p-10 text-center hover:border-[var(--primary)]/40 hover:bg-[var(--surface-hover)] transition-all"
                  >
                    <p className="text-3xl mb-3">🗺️</p>
                    <p className="text-sm font-bold text-[var(--text)] mb-1">No stops yet</p>
                    <p className="text-xs font-semibold text-[var(--text-muted)]">Tap to add your day-by-day plan</p>
                  </motion.button>
                ) : (
                  <div className="border-l-2 border-dashed border-[var(--border)] ml-3 pl-6 sm:ml-4 sm:pl-8 flex flex-col">
                    <AnimatePresence mode="popLayout">
                      {[...itinerary].sort((a, b) => a.day - b.day).map((stop) => (
                        <motion.div
                          key={stop.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="relative mb-8"
                        >
                          <div className="absolute -left-[33px] sm:-left-[41px] top-4 w-4 h-4 rounded-full bg-[var(--primary)] border-4 border-[var(--bg)]" />
                          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4 hover:border-[var(--primary)]/40 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-[0.62rem] font-black uppercase tracking-wider text-[var(--primary)]">Day</span>
                                <input
                                  type="number" min={1} value={stop.day}
                                  onChange={e => updateStop(stop.id, 'day', parseInt(e.target.value) || 1)}
                                  className="w-14 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs font-bold text-center text-[var(--text)] focus:border-[var(--primary)] outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeStop(stop.id)}
                                className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                              ><X className="w-4 h-4" /></button>
                            </div>
                            <input
                              type="text"
                              placeholder="Activity"
                              value={stop.activity}
                              onChange={e => updateStop(stop.id, 'activity', e.target.value)}
                              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-all outline-none"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="relative">
                                <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text" placeholder="Location"
                                  value={stop.location}
                                  onChange={e => updateStop(stop.id, 'location', e.target.value)}
                                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-all outline-none"
                                />
                              </div>
                              <div className="relative">
                                <FileText className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text" placeholder="Notes (optional)"
                                  value={stop.notes}
                                  onChange={e => updateStop(stop.id, 'notes', e.target.value)}
                                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-all outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Inline add button */}
                    <div className="relative">
                      <div className="absolute -left-[33px] sm:-left-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--surface)] border-2 border-[var(--border)]" />
                      <button
                        type="button"
                        onClick={addStop}
                        className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-all w-full"
                      >
                        <Plus className="w-4 h-4" /> Add Another Stop
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* 06 — Cover & Style ───────────────────────────────── */}
              <section className="flex flex-col gap-6">
                <SectionLabel num="06" title="Cover & Style" />

                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Choose a theme</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
                    {THEMES.map(t => {
                      const on = form.coverTheme === t.value && !coverPreview?.startsWith('blob:');
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            set('coverTheme', t.value);
                            setCoverPhotoFile(null);
                            if (coverPreview?.startsWith('blob:')) { URL.revokeObjectURL(coverPreview); setCoverPreview(null); }
                          }}
                          style={{ background: t.gradient, opacity: coverPreview ? 0.4 : (on ? 1 : 0.8) }}
                          className={`aspect-square rounded-xl border-2 overflow-hidden relative transition-all ${
                            on ? 'border-[var(--primary)] scale-105 shadow-md' : 'border-transparent hover:scale-[1.03] hover:opacity-100'
                          }`}
                        >
                          <span className="absolute inset-0 flex items-end justify-start p-1.5 text-[0.55rem] font-black text-white/90 bg-gradient-to-t from-black/50 to-transparent uppercase tracking-wider">
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 text-center opacity-50">— or upload a photo —</p>

                  <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed rounded-2xl overflow-hidden relative flex items-center justify-center transition-all ${
                      coverPreview ? 'border-[var(--primary)]/50 h-48' : 'border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--surface)] hover:border-[var(--primary)]/50 h-24'
                    }`}>
                      {coverPreview ? (
                        <>
                          <img src={coverPreview} alt="Cover" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <span className="text-white text-sm font-bold bg-black/50 px-4 py-2 rounded-full border border-white/20">
                              Click to change photo
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs font-bold flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-[var(--accent)]" /> Upload custom cover photo
                        </span>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={onCoverPick} />
                  </label>
                </div>
              </section>

            </div>

            {/* ─────────────── RIGHT: Live Preview ─────────────────── */}
            <div className="lg:w-[40%] hidden lg:block">
              <div className="sticky top-24 flex flex-col gap-5">

                <div className="flex items-center justify-between">
                  <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-[var(--primary)]" /> Live Preview
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                    <span className="text-[0.58rem] font-bold text-[var(--primary)] uppercase tracking-wider">Editing</span>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-lg group">
                  <div className="h-48 relative overflow-hidden" style={{ background: coverPreview ? 'transparent' : theme.gradient }}>
                    {coverPreview && (
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 text-[0.6rem] text-white font-bold flex items-center gap-1 border border-white/10">
                      {form.privacy === 'private'
                        ? <><Lock className="w-2.5 h-2.5" /> Private</>
                        : <><Globe className="w-2.5 h-2.5" /> Public</>}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="m-0 text-lg font-black text-white leading-tight drop-shadow-md">
                        {form.title || <span className="opacity-40 font-medium italic text-base">Meetway title…</span>}
                      </h3>
                      <p className="m-0 mt-1.5 text-xs text-white/70 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-white/60 shrink-0" />
                        {form.destination || <span className="opacity-40">Destination</span>}
                        {form.country && `, ${form.country}`}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-[var(--text-muted)]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                        {form.dateStart ? new Date(form.dateStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                        {' → '}
                        {form.dateEnd ? new Date(form.dateEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                      <span className="font-black text-green-500">₹{form.budgetMin} – ₹{form.budgetMax}</span>
                    </div>

                    {form.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {form.tags.map(t => (
                          <span key={t} className="px-2.5 py-0.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[0.6rem] text-[var(--text-muted)] font-bold">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-[0.62rem] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Max {form.maxPeople} travelers
                      </span>
                      {itinerary.length > 0 && (
                        <span className="text-[0.62rem] font-bold text-[var(--text-muted)]">
                          🗺️ {itinerary.length} stop{itinerary.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ── Sticky Action Bar ──────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 glass backdrop-blur-2xl border-t border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4 z-50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 sm:flex-none text-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[var(--border)] text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm font-bold transition-all shadow-md ${
                  saving
                    ? 'bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed'
                    : 'btn-glow text-white'
                }`}
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save Changes</>
                }
              </button>
            </div>
          </div>
        </div>
      </form>

    </div>
  );
}
