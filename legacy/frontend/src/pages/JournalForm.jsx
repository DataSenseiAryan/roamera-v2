import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Save, Sparkles, Calendar, DollarSign,
  Home as HomeIcon, FileText, X, AlertTriangle,
  Plus, MapPin, NotebookPen, Loader2, Camera,
} from 'lucide-react';

export default function JournalForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // ── State (unchanged) ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '', destination: '', startDate: '', endDate: '',
    activities: '', accommodation: '', budget: '', content: '',
  });
  const [photoItems, setPhotoItems]         = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [itinerary, setItinerary]           = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  // ── Effects (unchanged) ────────────────────────────────────────────────────
  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [authLoading, user, navigate]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/journals/${id}`).then((res) => {
        const j = res.data;
        setForm({
          title: j.title, destination: j.destination,
          startDate: j.startDate.slice(0, 10), endDate: j.endDate.slice(0, 10),
          activities: j.activities || '', accommodation: j.accommodation || '',
          budget: j.budget ?? '', content: j.content || '',
        });
        setExistingPhotos(j.photos);
      });
    }
  }, [id, isEdit]);

  // ── Handlers (unchanged) ───────────────────────────────────────────────────
  function addPhotos(fileList) {
    const items = Array.from(fileList).map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotoItems(prev => [...prev, ...items]);
  }
  function removeNewFile(idx) {
    setPhotoItems(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }
  function addStop() {
    const maxDay = itinerary.length ? Math.max(...itinerary.map(s => s.day)) : 0;
    setItinerary(p => [...p, { id: Date.now(), day: maxDay + 1, activity: '', location: '', notes: '' }]);
  }
  function updateStop(sid, field, value) {
    setItinerary(p => p.map(s => s.id === sid ? { ...s, [field]: value } : s));
  }
  function removeStop(sid) {
    setItinerary(p => p.filter(s => s.id !== sid));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') data.append(k, v); });
    photoItems.forEach(({ file }) => data.append('photos', file));
    if (isEdit) data.append('keepPhotos', JSON.stringify(existingPhotos));
    if (itinerary.length > 0) {
      data.append('itinerary', JSON.stringify(
        itinerary.map(({ day, activity, location, notes }) => ({ day, activity, location, notes }))
      ));
    }
    try {
      if (isEdit) {
        await api.put(`/journals/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate(`/journals/${id}`);
      } else {
        const res = await api.post('/journals', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate(`/journals/${res.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Progress: required fields filled
  const progress = Math.round(
    [form.title, form.destination, form.startDate, form.endDate, form.content]
      .filter(Boolean).length / 5 * 100
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-32">

      {/* ── Thin progress bar pinned to top ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-[var(--border)]">
        <motion.div
          className="h-full bg-[var(--primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* ── Back button ── */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-glass p-2.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* ── Hero header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="m-0 text-3xl sm:text-4xl font-black text-[var(--text)] tracking-tight flex items-center gap-3">
          {isEdit ? 'Edit Your Story' : 'Create Your Travel Story'}
          <NotebookPen className="w-7 h-7 text-[var(--primary)] shrink-0" />
        </h1>
        <p className="m-0 mt-2 text-sm sm:text-base font-semibold text-[var(--text-muted)]">
          Capture your journey and inspire others
        </p>
        {/* Divider with completion */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[0.65rem] font-bold tracking-widest uppercase text-[var(--text-muted)] opacity-70">
            {progress}% complete
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
      </motion.div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm font-semibold mb-8 flex items-center gap-2 shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">

        {/* ── SECTION 1 — Basic Story ── */}
        <JourneySection step={1} title="Basic Story" icon={<NotebookPen className="w-4 h-4" />}>
          <div className="flex flex-col gap-5">
            <FieldGroup label="Story Title" required>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Golden Week in Kyoto"
                className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] transition-all outline-none shadow-inner"
              />
            </FieldGroup>
            <FieldGroup label="Where did you go?" icon={<MapPin className="w-3.5 h-3.5" />} required>
              <input
                type="text"
                required
                value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })}
                placeholder="City / Region / Country"
                className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] transition-all outline-none shadow-inner"
              />
            </FieldGroup>
            <FieldGroup label="Tell Your Story" icon={<FileText className="w-3.5 h-3.5" />}>
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="Write about your experience — the sights, the feelings, the moments worth remembering…"
                className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] transition-all outline-none min-h-[160px] resize-y shadow-inner"
              />
            </FieldGroup>
            <FieldGroup label="Activities" icon={<Sparkles className="w-3.5 h-3.5" />}>
              <textarea
                value={form.activities}
                onChange={e => setForm({ ...form, activities: e.target.value })}
                placeholder="What did you do? Hike, explore, eat your way through the city…"
                className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] transition-all outline-none min-h-[100px] resize-y shadow-inner"
              />
            </FieldGroup>
          </div>
        </JourneySection>

        {/* ── SECTION 2 — Travel Details ── */}
        <JourneySection step={2} title="Travel Details" icon={<Calendar className="w-4 h-4" />}>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="When did you travel?" icon={<Calendar className="w-3.5 h-3.5" />} required>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] transition-all outline-none shadow-inner"
                  style={{ colorScheme: 'auto' }}
                />
              </FieldGroup>
              <FieldGroup label="Return Date" icon={<Calendar className="w-3.5 h-3.5" />} required>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] transition-all outline-none shadow-inner"
                  style={{ colorScheme: 'auto' }}
                />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Where did you stay?" icon={<HomeIcon className="w-3.5 h-3.5" />}>
                <input
                  type="text"
                  value={form.accommodation}
                  onChange={e => setForm({ ...form, accommodation: e.target.value })}
                  placeholder="Hotel, hostel, Airbnb…"
                  className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] transition-all outline-none shadow-inner"
                />
              </FieldGroup>
              <FieldGroup label="Trip Budget ($)" icon={<DollarSign className="w-3.5 h-3.5" />}>
                <input
                  type="number"
                  value={form.budget}
                  onChange={e => setForm({ ...form, budget: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] transition-all outline-none shadow-inner"
                />
              </FieldGroup>
            </div>
          </div>
        </JourneySection>

        {/* ── SECTION 3 — Add Photos ── */}
        <JourneySection step={3} title="Add Photos" icon={<Camera className="w-4 h-4" />} hint="Max 10 · 5 MB each">

          {/* Existing photos (edit mode) */}
          {existingPhotos.length > 0 && (
            <div className="mb-6 border-b border-[var(--border)] pb-6">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-3 text-[var(--text-muted)]">Current Photos</p>
              <div className="flex gap-3 flex-wrap">
                {existingPhotos.map(p => (
                  <div key={p} className="relative group rounded-xl overflow-hidden shadow-sm border border-[var(--border)]">
                    <img src={p} className="w-24 h-24 sm:w-28 sm:h-28 object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                    <button
                      type="button"
                      onClick={() => setExistingPhotos(prev => prev.filter(x => x !== p))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:scale-110 backdrop-blur-sm"
                    ><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file previews */}
          {photoItems.length > 0 && (
            <div className="mb-6">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-3 text-[var(--text-muted)]">New Photos to Upload</p>
              <div className="flex gap-3 flex-wrap">
                {photoItems.map(({ file, preview }, idx) => (
                  <div key={preview} className="relative group rounded-xl overflow-hidden shadow-md border-2 border-[var(--primary)]/50 bg-[var(--surface)]">
                    <img src={preview} className="w-24 h-24 sm:w-28 sm:h-28 object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />
                    <button
                      type="button"
                      onClick={() => removeNewFile(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:scale-110 backdrop-blur-sm"
                    ><X className="w-3.5 h-3.5" /></button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-1.5 translate-y-full group-hover:translate-y-0 transition-transform">
                      <span className="block text-[0.55rem] font-semibold text-white/90 truncate text-center">{file.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            onClick={() => document.getElementById('photo-upload').click()}
            className="border-2 border-dashed border-[var(--border)] rounded-[1.5rem] p-5 sm:p-10 text-center cursor-pointer bg-[var(--surface-hover)] hover:bg-[var(--surface)] hover:border-[var(--primary)]/50 transition-all group shadow-inner"
          >
            <div className="w-14 h-14 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
            </div>
            <p className="text-sm font-bold text-[var(--text)] mb-1">
              {photoItems.length > 0 ? 'Drop more photos here' : 'Drop your travel photos here'}
            </p>
            <p className="text-xs font-semibold text-[var(--text-muted)]">
              {photoItems.length > 0 ? `${photoItems.length} photo${photoItems.length > 1 ? 's' : ''} selected` : 'or click to browse files'}
            </p>
          </div>
          <input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => { addPhotos(e.target.files); e.target.value = ''; }}
          />
        </JourneySection>

        {/* ── SECTION 4 — Journey Timeline ── */}
        <JourneySection step={4} title="Journey Timeline" icon={<MapPin className="w-4 h-4" />} hint="Optional">
          <p className="text-sm font-semibold text-[var(--text-muted)] -mt-2 mb-1">
            Add day-by-day stops to map your adventure.
          </p>
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {itinerary.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-10 text-center border-2 border-dashed border-[var(--border)] rounded-[1.5rem] bg-[var(--surface-hover)]/30"
                >
                  <p className="text-[var(--text-muted)] text-sm font-semibold max-w-xs mx-auto">
                    No stops added yet. Structure your journey day by day.
                  </p>
                </motion.div>
              ) : (
                itinerary.map((stop, idx) => (
                  <motion.div
                    key={stop.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3 shadow-inner group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--primary-dim)] border border-[var(--primary)]/30 flex items-center justify-center text-xs font-black text-[var(--primary)] shadow-sm">
                        D{stop.day}
                      </span>
                      <input
                        type="text"
                        placeholder="Activity / Stop *"
                        value={stop.activity}
                        onChange={e => updateStop(stop.id, 'activity', e.target.value)}
                        className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--bg)] transition-all outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeStop(stop.id)}
                        className="shrink-0 p-2 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-14">
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Location"
                          value={stop.location}
                          onChange={e => updateStop(stop.id, 'location', e.target.value)}
                          className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-[0.8rem] text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--bg)] transition-all outline-none"
                        />
                      </div>
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Notes"
                          value={stop.notes}
                          onChange={e => updateStop(stop.id, 'notes', e.target.value)}
                          className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-[0.8rem] text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--bg)] transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-0 sm:pl-14 mt-1">
                      <span className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-wider">Day</span>
                      <input
                        type="number"
                        min={1}
                        value={stop.day}
                        onChange={e => updateStop(stop.id, 'day', Math.max(1, Number(e.target.value)))}
                        className="w-16 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs font-bold text-center text-[var(--text)] focus:border-[var(--primary)] transition-all outline-none"
                      />
                      <span className="text-[0.65rem] font-semibold text-[var(--text-muted)] opacity-60 ml-2">
                        Stop {idx + 1} of {itinerary.length}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={addStop}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-full btn-glass text-[0.8rem] font-bold text-[var(--primary)] hover:text-white transition-all shadow-sm mt-2"
            >
              <Plus className="w-4 h-4" /> Add Day
            </button>
          </div>
        </JourneySection>

      </form>

      {/* ── Sticky footer ── */}
      <div className="fixed bottom-0 left-0 right-0 glass backdrop-blur-2xl border-t border-[var(--border)] p-4 sm:p-5 z-50">
        <div className="max-w-3xl mx-auto flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text)] text-sm font-bold hover:bg-[var(--surface)] hover:border-[var(--text-muted)] transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className={`flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md group ${
              loading
                ? 'bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed opacity-70 border border-[var(--border)]'
                : 'btn-glow text-white shadow-[var(--shadow-glow)]'
            }`}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4 group-hover:scale-110 transition-transform" /> {isEdit ? 'Save Changes' : 'Publish Journal'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Journey section card ──────────────────────────────────────────────────────
function JourneySection({ step, title, icon, hint, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass p-6 sm:p-8 rounded-[2rem] border border-[var(--border)] shadow-sm"
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* Step number badge */}
          <span className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-[0.65rem] font-black text-white shrink-0 shadow-sm">
            {step}
          </span>
          <h2 className="m-0 text-sm font-black text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
            <span className="text-[var(--primary)]">{icon}</span>
            {title}
          </h2>
        </div>
        {hint && (
          <span className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-wider opacity-70">
            {hint}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

// ── Field group with label ────────────────────────────────────────────────────
function FieldGroup({ label, icon, required, children }) {
  return (
    <div className="form-group flex flex-col gap-1.5">
      <label className="text-[0.65rem] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
        {label}
        {required && <span className="text-[var(--accent)]">*</span>}
      </label>
      {children}
    </div>
  );
}
