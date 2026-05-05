import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  ArrowLeft, Send, Image as ImageIcon, Calendar, Users, DollarSign,
  FileText, Lock, Globe, File, Plus, X, Loader2, MapPin, Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function CreateMeetway() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const { user }      = useAuth();
  const prefill       = location.state?.prefill || null;

  const [saving, setSaving]         = useState(false);
  const [apiError, setApiError]     = useState('');
  const [prefillLoading, setPrefillLoading] = useState(Boolean(prefill));

  const [form, setForm] = useState({
    title:       prefill?.title       || '',
    destination: prefill?.destination || '',
    country:     '',
    dateStart:   prefill?.dateStart   || '',
    dateEnd:     prefill?.dateEnd     || '',
    description: '',
    maxPeople:   10,
    budgetMin:   200,
    budgetMax:   800,
    tags:        [],
    privacy:     'public',
    coverTheme:  'adventure',
  });
  const [itinerary, setItinerary]         = useState([]);
  const [documents, setDocuments]         = useState([]);
  const [dragOver, setDragOver]           = useState(false);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPreview, setCoverPreview]   = useState(null);

  // Fetch journal data when copying
  useEffect(() => {
    if (!prefill?.journalId) return;
    api.get(`/journals/${prefill.journalId}`)
      .then(async res => {
        const j = res.data;
        const stops = j.itinerary || [];
        setItinerary(stops.map(s => ({ ...s, id: Date.now() + Math.random() })));
        if (j.content) set('description', j.content);
        const firstPhoto = j.photos?.[0];
        if (firstPhoto) {
          try {
            const resp = await fetch(firstPhoto);
            const blob = await resp.blob();
            const ext  = blob.type.split('/')[1] || 'jpg';
            const file = new File([blob], `cover.${ext}`, { type: blob.type });
            setCoverPhotoFile(file);
            setCoverPreview(URL.createObjectURL(blob));
          } catch { /* photo fetch failed — skip */ }
        }
      })
      .catch(() => {})
      .finally(() => setPrefillLoading(false));
  }, []); // eslint-disable-line

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleTag = (t) => set('tags', form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]);

  function addStop() {
    const maxDay = itinerary.length ? Math.max(...itinerary.map(i => i.day)) : 0;
    setItinerary(p => [...p, { id: Date.now(), day: maxDay + 1, activity: '', location: '', notes: '' }]);
  }
  function updateStop(id, field, value) {
    setItinerary(p => p.map(s => s.id === id ? { ...s, [field]: value } : s));
  }
  function removeStop(id) {
    setItinerary(p => p.filter(s => s.id !== id));
  }

  const ALLOWED = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
  function addFiles(files) {
    const valid = Array.from(files).filter(f => ALLOWED.includes(f.type));
    setDocuments(p => [...p, ...valid.map(f => ({ id: Date.now() + Math.random(), file: f, name: f.name }))]);
  }
  function removeDoc(id) { setDocuments(p => p.filter(d => d.id !== id)); }

  async function handleSubmit() {
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    setApiError('');
    try {
      const payload = {
        title:       form.title,
        destination: form.destination,
        country:     form.country || undefined,
        startDate:   form.dateStart,
        endDate:     form.dateEnd,
        description: form.description,
        maxPeople:   form.maxPeople,
        budgetMin:   form.budgetMin,
        budgetMax:   form.budgetMax,
        tags:        form.tags,
        privacy:     form.privacy,
        coverTheme:  coverPhotoFile ? null : form.coverTheme,
        itinerary:   itinerary.map(({ day, activity, location, notes }) => ({ day, activity, location, notes })),
      };
      const res = await api.post('/meetways', payload);
      const meetwayId = res.data.id;

      if (coverPhotoFile) {
        const fd = new FormData();
        fd.append('cover', coverPhotoFile);
        await api.post(`/meetways/${meetwayId}/cover`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      if (documents.length > 0) {
        const fd = new FormData();
        documents.forEach(d => fd.append('documents', d.file));
        await api.post(`/meetways/${meetwayId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate(`/meetways/${meetwayId}`);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  const theme = THEMES.find(t => t.value === form.coverTheme) || THEMES[0];

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-5 sm:pb-6">
        <button
          onClick={() => navigate('/meetways')}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-sm font-medium mb-5 sm:mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Meetways
        </button>

        <AnimatePresence>
          {prefill && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--primary-dim)] border border-[var(--primary)]/30">
                {prefillLoading
                  ? <span className="text-sm font-semibold text-[var(--primary)] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading itinerary…</span>
                  : <>
                      <span className="text-xl shrink-0">📋</span>
                      <div>
                        <p className="m-0 text-sm font-bold text-[var(--primary)]">Copied from "{prefill.sourceTitle}"</p>
                        <p className="m-0 text-xs font-semibold text-[var(--text-muted)]">Fields prefilled — edit freely and launch your own meetway</p>
                      </div>
                    </>
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <h1 className="text-4xl sm:text-5xl font-black text-[var(--text)] tracking-tight leading-tight mb-2">
          Create a Meetway
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] font-medium mb-6">
          Invite others into your journey
        </p>
        <div className="w-full h-px bg-[var(--border)]" />
      </div>

      {/* ── Two-Column Layout ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          {/* ─────────────────── LEFT: Form ─────────────────────── */}
          <div className="lg:w-[60%] flex flex-col gap-8 md:gap-12 lg:gap-16 pb-8">

            {/* 01 — Set the Vibe ──────────────────────────────── */}
            <section className="flex flex-col gap-6">
              <SectionLabel num="01" title="Set the Vibe" />
              <div className="flex flex-col gap-5">
                <input
                  type="text"
                  placeholder="What's this meetway about?"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
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

            {/* 02 — Where & When ──────────────────────────────── */}
            <section className="flex flex-col gap-6">
              <SectionLabel num="02" title="Where & When" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[var(--primary)]" /> Destination <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="City / Region"
                    value={form.destination}
                    onChange={e => set('destination', e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface-hover)] transition-all outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-[var(--primary)]" /> Country
                  </label>
                  <input
                    type="text"
                    placeholder="Country"
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
                    style={{ colorScheme: 'auto' }}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface-hover)] transition-all outline-none"
                  />
                </div>
              </div>
            </section>

            {/* 03 — Who Should Join ───────────────────────────── */}
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
                    type="range" min={2} max={30} value={form.maxPeople}
                    onChange={e => set('maxPeople', Number(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[0.62rem] font-bold text-[var(--text-muted)] uppercase tracking-wider">2 (Intimate)</span>
                    <span className="text-[0.62rem] font-bold text-[var(--text-muted)] uppercase tracking-wider">30 (Group)</span>
                  </div>
                </div>

                {/* Budget */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3 text-green-500" /> Budget Range
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 focus-within:border-[var(--primary)] transition-colors">
                      <span className="text-[var(--text-muted)] text-sm font-bold">₹</span>
                      <input
                        type="number" min={0} step={50} value={form.budgetMin}
                        onChange={e => set('budgetMin', Number(e.target.value))}
                        placeholder="Min"
                        className="flex-1 bg-transparent border-0 outline-none text-sm text-[var(--text)] p-0"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 focus-within:border-[var(--primary)] transition-colors">
                      <span className="text-[var(--text-muted)] text-sm font-bold">₹</span>
                      <input
                        type="number" min={0} step={50} value={form.budgetMax}
                        onChange={e => set('budgetMax', Number(e.target.value))}
                        placeholder="Max"
                        className="flex-1 bg-transparent border-0 outline-none text-sm text-[var(--text)] p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 04 — Choose Your Vibe ──────────────────────────── */}
            <section className="flex flex-col gap-6">
              <SectionLabel num="04" title="Choose Your Vibe" />
              <p className="text-xs text-[var(--text-muted)] font-semibold -mt-2">
                Pick at least one <span className="text-[var(--accent)]">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(({ emoji, label: l }) => {
                  const sel = form.tags.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleTag(l)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                        sel
                          ? 'bg-[var(--primary-dim)] border-[var(--primary)] text-[var(--primary)] scale-105'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span>{emoji}</span> {l}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 05 — Plan the Experience ───────────────────────── */}
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
                                onChange={e => updateStop(stop.id, 'day', Math.max(1, Number(e.target.value)))}
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
                            placeholder="Activity / Stop name"
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
                                type="text" placeholder="Notes"
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

            {/* 06 — Cover & Style ─────────────────────────────── */}
            <section className="flex flex-col gap-6">
              <SectionLabel num="06" title="Cover & Style" />

              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Choose a theme</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
                  {THEMES.map(t => {
                    const on = form.coverTheme === t.value && !coverPhotoFile;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          set('coverTheme', t.value);
                          if (coverPreview?.startsWith('blob:')) { URL.revokeObjectURL(coverPreview); setCoverPreview(null); }
                          setCoverPhotoFile(null);
                        }}
                        style={{ background: t.gradient, opacity: coverPhotoFile ? 0.4 : (on ? 1 : 0.8) }}
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

                {coverPreview ? (
                  <div className="relative rounded-2xl overflow-hidden h-48 border border-[var(--border)] group">
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <button
                      type="button"
                      onClick={() => { setCoverPhotoFile(null); setCoverPreview(null); }}
                      className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 rounded-full p-2 text-white transition-all"
                    ><X className="w-4 h-4" /></button>
                    <span className="absolute bottom-3 left-4 text-xs font-bold text-white/90 bg-black/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> {coverPhotoFile?.name || 'Cover photo'}
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={() => document.getElementById('cover-upload').click()}
                    className="border-2 border-dashed border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--surface)] hover:border-[var(--primary)]/50 rounded-2xl p-5 sm:p-10 text-center cursor-pointer transition-all"
                  >
                    <div className="w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text)] mb-1">Upload a cover photo</p>
                    <p className="text-xs font-semibold text-[var(--text-muted)]">JPG · PNG · WEBP · max 5 MB</p>
                  </div>
                )}
                <input
                  id="cover-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setCoverPhotoFile(f); setCoverPreview(URL.createObjectURL(f)); }
                    e.target.value = '';
                  }}
                />
              </div>
            </section>

            {/* 07 — Attach Documents ──────────────────────────── */}
            <section className="flex flex-col gap-6">
              <SectionLabel num="07" title="Attach Documents" />
              <div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                  onClick={() => document.getElementById('doc-upload').click()}
                  className={`border-2 border-dashed rounded-2xl p-4 sm:p-8 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-[var(--primary)] bg-[var(--primary-dim)]'
                      : 'border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--surface)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                    <File className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm font-bold text-[var(--text)] mb-1">
                    Drag & drop files, or <span className="text-[var(--primary)]">browse</span>
                  </p>
                  <p className="text-xs font-semibold text-[var(--text-muted)]">PDF · Word · JPG · PNG</p>
                </div>
                <input
                  id="doc-upload" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
                />

                {documents.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3">
                    <AnimatePresence>
                      {documents.map(doc => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                        >
                          <span className="text-lg">
                            {doc.file.type === 'application/pdf' ? '📄' : doc.file.type.startsWith('image') ? '🖼️' : '📝'}
                          </span>
                          <span className="flex-1 text-xs font-bold text-[var(--text)] truncate">{doc.name}</span>
                          <span className="text-[0.62rem] font-bold text-[var(--text-muted)] bg-[var(--surface-hover)] px-2 py-0.5 rounded-md border border-[var(--border)] shrink-0">
                            {(doc.file.size / 1024).toFixed(0)} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDoc(doc.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0"
                          ><X className="w-3.5 h-3.5" /></button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
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
                  <span className="text-[0.58rem] font-bold text-[var(--primary)] uppercase tracking-wider">Drafting</span>
                </div>
              </div>

              {/* Preview Card */}
              <div className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-lg group">
                {/* Cover */}
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
                      {form.title || <span className="opacity-40 font-medium italic text-base">Your meetway title…</span>}
                    </h3>
                    <p className="m-0 mt-1.5 text-xs text-white/70 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-white/60 shrink-0" />
                      {form.destination || <span className="opacity-40">Destination</span>}
                      {form.country && `, ${form.country}`}
                    </p>
                  </div>
                </div>

                {/* Body */}
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

              {/* Tip */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex gap-3 items-start">
                <span className="text-base shrink-0">💡</span>
                <div>
                  <p className="text-xs font-bold text-[var(--text)] mb-0.5">Pro tip</p>
                  <p className="text-[0.7rem] font-medium text-[var(--text-muted)] leading-relaxed">
                    Meetways with a cover photo and 4+ itinerary stops get 60% more join requests.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Sticky Action Bar ────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 glass backdrop-blur-2xl border-t border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <AnimatePresence>
            {apiError && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs font-semibold text-red-500 flex items-center gap-1.5 sm:mr-auto truncate"
              >
                ⚠️ {apiError}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto">
            <button
              type="button"
              onClick={() => navigate('/meetways')}
              className="flex-1 sm:flex-none text-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[var(--border)] text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm font-bold transition-all shadow-md ${
                saving
                  ? 'bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed'
                  : 'btn-glow text-white'
              }`}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Launching…</>
                : <><Send className="w-4 h-4" /> Publish Meetway</>
              }
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
