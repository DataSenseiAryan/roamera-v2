import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import JournalCard from '../components/JournalCard';
import {
  MapPin, Image as ImageIcon, User as UserIcon, List, Plane,
  Settings, Trash2, ShieldCheck, Pause, Plus, Map, Sparkles,
  Calendar, Edit3, UserPlus, UserCheck, Globe, Camera, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────
   UTILITY COMPONENTS
───────────────────────────────────────────────────────────── */

function Avatar({ src, username, size = 24 }) {
  return src ? (
    <img
      src={src}
      alt={username}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--primary-dim), var(--primary))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
    }}>
      {username?.[0]?.toUpperCase()}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAT BOX
───────────────────────────────────────────────────────────── */

function StatBox({ value, label, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex-1 flex flex-col items-center py-3 transition-all rounded-xl"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        background: 'transparent',
        border: 'none',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
        {label}
      </span>
    </button>
  );
}

function MobileStat({ value, label, onClick, borderX, borderLeft }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex flex-col items-center py-3 transition-all"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        background: 'transparent',
        border: 'none',
        borderLeft: borderLeft || borderX ? '1px solid var(--border)' : 'none',
        borderRight: borderX ? '1px solid var(--border)' : 'none',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
        {label}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODALS (unchanged logic, refreshed styling)
───────────────────────────────────────────────────────────── */

function UserModal({ title, users, onClose }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-sm rounded-3xl p-6 max-h-[72vh] flex flex-col"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 32px 64px rgba(0,0,0,0.24)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--surface-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ×
            </button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-1">
            {users.length === 0 && (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Nobody here yet.</p>
            )}
            {users.map((u) => (
              <Link
                key={u.id}
                to={`/users/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2 rounded-xl transition-colors"
                style={{ textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar src={u.avatar} username={u.username} size={42} />
                <div className="min-w-0">
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }} className="truncate">{u.username}</p>
                  {u.bio && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }} className="truncate">{u.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function EditModal({ profile, onClose, onSaved }) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(profile.avatar || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  function pickFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      form.append('username', username);
      form.append('bio', bio);
      if (avatarFile) form.append('avatar', avatarFile);
      const res = await api.put('/users/me', form);
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative w-full max-w-md rounded-3xl p-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 32px 64px rgba(0,0,0,0.24)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-7">
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Edit Profile</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--surface-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={save}>
          {/* Avatar picker */}
          <div className="flex justify-center mb-8">
            <button type="button" onClick={() => fileRef.current.click()} className="relative cursor-pointer bg-transparent border-none p-0 group">
              <Avatar src={preview} username={username} size={92} />
              <div
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 text-white shadow-lg group-hover:scale-110 transition-transform"
                style={{ background: 'var(--primary)', borderColor: 'var(--surface)' }}
              >
                <Camera className="w-3.5 h-3.5" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" />
          </div>

          <div className="mb-4">
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Username
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div className="mb-7">
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-y transition-all"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              placeholder="Tell the world about your travels…"
            />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
              style={{ border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-3 rounded-xl font-bold text-sm text-white transition-opacity disabled:opacity-70 btn-glow"
              style={{ cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ConfirmModal({ icon, title, message, confirmLabel, confirmColor, onConfirm, onClose, busy }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2"
          style={{ background: `${confirmColor}18`, border: `2px solid ${confirmColor}44`, color: confirmColor }}
        >
          {icon}
        </div>
        <div className="text-center">
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{message}</p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-colors"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text-muted)', cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-opacity disabled:opacity-70"
            style={{ background: confirmColor, border: 'none', cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            {busy ? 'Wait…' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PROFILE PAGE
───────────────────────────────────────────────────────────── */

export default function Profile() {
  const { id } = useParams();
  const { user: me, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [journals, setJournals] = useState([]);
  const [bucketList, setBucketList] = useState([]);
  const [following, setFollowing] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);
  const [tab, setTab] = useState('journals');
  const [hostedMeetways, setHostedMeetways] = useState([]);
  const [meetwaysBusy, setMeetwaysBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const isMe = !!me && me.id === parseInt(id);

  useEffect(() => {
    setProfile(null);
    setJournals([]);
    setBucketList([]);
    setTab('journals');
    api.get(`/users/${id}`).then(res => setProfile(res.data));
    api.get(`/users/${id}/journals`).then(res => setJournals(res.data));
    if (me && !isMe) {
      api.get(`/users/${id}/followers`).then(res => setFollowing(res.data.some(f => f.id === me.id)));
    }
  }, [id, me, isMe]);

  useEffect(() => {
    if (isMe && tab === 'bucket') {
      api.get('/bucket-list').then(res => setBucketList(res.data));
    }
    if (isMe && tab === 'meetways') {
      api.get('/meetways/my/hosted').then(res => setHostedMeetways(res.data));
    }
  }, [isMe, tab]);

  async function toggleFollow() {
    if (!me) return navigate('/login');
    const res = await api.post(`/users/${id}/follow`);
    setFollowing(res.data.following);
    setProfile(p => ({ ...p, _count: { ...p._count, followers: p._count.followers + (res.data.following ? 1 : -1) } }));
  }

  async function openFollowers() {
    const res = await api.get(`/users/${id}/followers`);
    setModalUsers(res.data);
    setModal('followers');
  }

  async function openFollowing() {
    const res = await api.get(`/users/${id}/following`);
    setModalUsers(res.data);
    setModal('following');
  }

  async function confirmDelete() {
    const mid = confirmAction.meetway.id;
    setMeetwaysBusy(true);
    try {
      await api.delete(`/meetways/${mid}`);
      setHostedMeetways(prev => prev.filter(m => m.id !== mid));
      setConfirmAction(null);
    } finally {
      setMeetwaysBusy(false);
    }
  }

  async function confirmToggle() {
    const m = confirmAction.meetway;
    const newStatus = m.status === 'closed' ? 'active' : 'closed';
    setMeetwaysBusy(true);
    try {
      await api.put(`/meetways/${m.id}`, { status: newStatus });
      setHostedMeetways(prev => prev.map(x => x.id === m.id ? { ...x, status: newStatus } : x));
      setConfirmAction(null);
    } finally {
      setMeetwaysBusy(false);
    }
  }

  function handleProfileSaved(updated) {
    setProfile(p => ({ ...p, ...updated }));
    if (setUser) setUser(u => ({ ...u, ...updated }));
    setModal(null);
  }

  /* ── Loading ── */
  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--primary)',
        borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );

  const destinations = [...new Set(journals.map(j => j.destination))];
  const totalReactions = journals.reduce((s, j) => s + j._count.likes, 0);
  const coverPhotos = journals.flatMap(j => j.photos).filter(Boolean).slice(0, 3);

  const TABS = [
    { key: 'journals', label: 'Journals', icon: Map, count: profile._count.journals },
    { key: 'photos', label: 'Photos', icon: ImageIcon },
    { key: 'about', label: 'My Journey', icon: UserIcon },
    ...(isMe ? [{ key: 'bucket', label: 'Bucket List', icon: List, count: bucketList.length || undefined }] : []),
    ...(isMe ? [{ key: 'meetways', label: 'Meetways', icon: Plane, count: hostedMeetways.length || undefined }] : []),
  ];

  return (
    <>
      {/* ── PAGE WRAPPER ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}>

        {/* ══════════════════════════════════════════════════════════
            HERO — COVER + AVATAR
        ══════════════════════════════════════════════════════════ */}
        <div style={{ position: 'relative', marginBottom: 0 }}>

          {/* Cover image area */}
          <div
            className="h-[150px] sm:h-[220px]"
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '0 0 2rem 2rem',
            }}
          >
            {coverPhotos.length > 0 ? (
              <>
                <div style={{ display: 'flex', height: '100%', gap: 2 }}>
                  {coverPhotos.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        flex: i === 0 ? 2 : 1,
                        backgroundImage: `url(${p})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  ))}
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 40%, rgba(0,0,0,0.5) 100%)',
                }} />
              </>
            ) : (
              <>
                <div style={{
                  height: '100%', width: '100%',
                  background: 'linear-gradient(135deg, var(--primary-dim) 0%, var(--primary) 60%, var(--accent) 100%)',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.3) 100%)',
                }} />
              </>
            )}

            {/* Member since — cover top-right */}
            <div
              style={{
                position: 'absolute', top: 14, right: 16,
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,0,0,0.38)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 999,
                padding: '4px 10px',
              }}
            >
              <Calendar style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.8)' }} />
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
                Since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* ── PROFILE CARD (overlapping cover) ── */}
          <div
            style={{
              margin: '0 12px',
              marginTop: -64,
              borderRadius: '2rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
              padding: '0 24px 24px',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 8 }}>

              {/* Avatar with ring */}
              <div style={{ marginTop: -48, position: 'relative', zIndex: 20 }}>
                <div style={{
                  padding: 3,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'inline-block',
                  boxShadow: '0 4px 20px var(--shadow-glow)',
                }}>
                  <div style={{
                    padding: 3,
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    display: 'inline-block',
                  }}>
                    <Avatar src={profile.avatar} username={profile.username} size={100} />
                  </div>
                </div>

                {/* Explorer badge */}
                {profile._count.journals >= 5 && (
                  <div style={{
                    position: 'absolute', bottom: 4, right: -4,
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    border: '2px solid var(--surface)',
                    whiteSpace: 'nowrap',
                  }}>
                    Explorer
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 12, flexShrink: 0 }}>
                {isMe && (
                  <>
                    <Link
                      to="/create"
                      className="btn-glow"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 16px',
                        borderRadius: 12,
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Sparkles style={{ width: 14, height: 14 }} />
                      New Entry
                    </Link>
                    <button
                      onClick={() => setModal('edit')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 16px',
                        borderRadius: 12,
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'background 0.18s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--border-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    >
                      <Edit3 style={{ width: 13, height: 13 }} />
                      Edit
                    </button>
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="sm:hidden p-2 rounded-full transition-colors"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <LogOut style={{ width: 18, height: 18 }} />
                    </button>
                  </>
                )}
                {!isMe && me && (
                  <motion.button
                    onClick={toggleFollow}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '9px 20px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      transition: 'all 0.18s',
                      ...(following ? {
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      } : {
                        border: 'none',
                        color: '#fff',
                      }),
                    }}
                    className={following ? '' : 'btn-glow'}
                  >
                    {following ? <UserCheck style={{ width: 14, height: 14 }} /> : <UserPlus style={{ width: 14, height: 14 }} />}
                    {following ? 'Following' : 'Follow'}
                  </motion.button>
                )}
                {!isMe && !me && (
                  <Link
                    to="/login"
                    className="btn-glow"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '9px 20px', borderRadius: 12,
                      color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <UserPlus style={{ width: 14, height: 14 }} />
                    Follow
                  </Link>
                )}
              </div>
            </div>

            {/* Name + username + bio */}
            <div style={{ marginTop: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.2 }}>
                  {profile.username}
                </h1>
              </div>

              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                <MapPin style={{ width: 12, height: 12, color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {destinations.length > 0 ? destinations[0] : 'Traveller'}
                </span>
              </div>

              {/* Bio */}
              {profile.bio ? (
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--text-muted)', maxWidth: 480 }}>
                  {profile.bio}
                </p>
              ) : isMe ? (
                <p
                  style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary)', cursor: 'pointer', fontStyle: 'italic' }}
                  onClick={() => setModal('edit')}
                >
                  + Add a bio to tell your story…
                </p>
              ) : null}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '0 -4px 4px' }} />

            {/* Stats — desktop: single row */}
            <div className="hidden sm:flex" style={{ alignItems: 'stretch' }}>
              <StatBox value={profile._count.journals} label="Journals" />
              <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '8px 0' }} />
              <StatBox value={profile._count.followers} label="Followers" onClick={openFollowers} />
              <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '8px 0' }} />
              <StatBox value={profile._count.following} label="Following" onClick={openFollowing} />
              <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '8px 0' }} />
              <StatBox value={totalReactions} label="Reactions" />
              <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '8px 0' }} />
              <StatBox value={destinations.length} label="Countries" />
            </div>

            {/* Stats — mobile: 3-col top row + 2-col bottom row */}
            <div className="sm:hidden">
              <div className="grid grid-cols-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <MobileStat value={profile._count.journals} label="Journals" />
                <MobileStat value={profile._count.followers} label="Followers" onClick={openFollowers} borderX />
                <MobileStat value={profile._count.following} label="Following" onClick={openFollowing} />
              </div>
              <div className="grid grid-cols-2">
                <MobileStat value={totalReactions} label="Reactions" />
                <MobileStat value={destinations.length} label="Countries" borderLeft />
              </div>
            </div>
          </div>
        </div>

        {/* ── Destination chips ── */}
        {destinations.length > 0 && (
          <div
            style={{
              display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto',
              padding: '16px 16px 4px',
              scrollbarWidth: 'none',
            }}
          >
            {destinations.slice(0, 10).map(d => (
              <span
                key={d}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: '0.72rem', fontWeight: 600,
                  background: 'var(--primary-dim)',
                  color: 'var(--primary)',
                  border: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <MapPin style={{ width: 9, height: 9 }} />
                {d}
              </span>
            ))}
            {destinations.length > 10 && (
              <span style={{
                padding: '5px 12px', borderRadius: 999,
                fontSize: '0.72rem', fontWeight: 600,
                background: 'var(--surface-hover)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                +{destinations.length - 10} more
              </span>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TABS
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none',
            borderBottom: '1px solid var(--border)',
            margin: '12px 12px 0',
          }}
        >
          {TABS.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 16px',
                border: 'none',
                borderBottom: `2px solid ${tab === key ? 'var(--primary)' : 'transparent'}`,
                marginBottom: -1,
                background: 'transparent',
                color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: tab === key ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.18s, border-color 0.18s',
              }}
              onMouseEnter={e => { if (tab !== key) e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { if (tab !== key) e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              {label}
              {count !== undefined && (
                <span style={{
                  fontSize: '0.62rem', fontWeight: 700,
                  padding: '1px 7px', borderRadius: 999,
                  background: tab === key ? 'var(--primary-dim)' : 'var(--surface-hover)',
                  color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB CONTENT
        ══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '20px 12px 0' }}>

          {/* ── JOURNALS ── */}
          <AnimatePresence mode="wait">
            {tab === 'journals' && (
              <motion.div
                key="journals"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {journals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: 20,
                      background: 'var(--surface-hover)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}>
                      <Map style={{ width: 32, height: 32, color: 'var(--primary)' }} />
                    </div>
                    <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                      Start sharing your journey
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 24px' }}>
                      Your travel stories are waiting to be told.
                    </p>
                    {isMe && (
                      <Link
                        to="/create"
                        className="btn-glow"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '11px 28px', borderRadius: 12,
                          color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                          textDecoration: 'none',
                        }}
                      >
                        <Sparkles style={{ width: 16, height: 16 }} />
                        Write your first entry
                      </Link>
                    )}
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                    gap: 20,
                  }}>
                    {journals.map(j => (
                      <JournalCard key={j.id} journal={{ ...j, user: profile }} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PHOTOS ── */}
            {tab === 'photos' && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {(() => {
                  const allPhotos = journals.flatMap(j =>
                    (j.photos || []).map(p => ({ src: p, journalId: j.id, title: j.title }))
                  );
                  return allPhotos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px 0' }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'var(--surface-hover)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                      }}>
                        <ImageIcon style={{ width: 32, height: 32, color: 'var(--primary)' }} />
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>No photos uploaded yet.</p>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: 10,
                    }}>
                      {allPhotos.map((p, i) => (
                        <Link
                          key={i}
                          to={`/journals/${p.journalId}`}
                          style={{
                            display: 'block', aspectRatio: '1',
                            borderRadius: 16, overflow: 'hidden',
                            position: 'relative', border: '1px solid var(--border)',
                          }}
                        >
                          <img
                            src={p.src}
                            alt={p.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                          />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
                            opacity: 0, transition: 'opacity 0.25s',
                          }}
                            onMouseEnter={e => e.target.style.opacity = 1}
                            onMouseLeave={e => e.target.style.opacity = 0}
                          />
                        </Link>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ── MY JOURNEY (About) ── */}
            {tab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

                  {/* Bio card */}
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 24, padding: 24,
                  }}>
                    <p style={{
                      margin: '0 0 14px', fontSize: '0.68rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <UserIcon style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                      About
                    </p>
                    {profile.bio ? (
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text)' }}>
                        {profile.bio}
                      </p>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No bio yet.
                      </p>
                    )}
                  </div>

                  {/* Travel stats card */}
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 24, padding: 24,
                  }}>
                    <p style={{
                      margin: '0 0 14px', fontSize: '0.68rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Globe style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                      Travel Stats
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { label: 'Destinations', value: destinations.length },
                        { label: 'Total Journals', value: profile._count.journals },
                        { label: 'Total Reactions', value: totalReactions },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{label}</span>
                          <span style={{
                            fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)',
                            padding: '2px 10px', borderRadius: 8,
                            background: 'var(--surface-hover)', border: '1px solid var(--border)',
                          }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Places visited card */}
                  {destinations.length > 0 && (
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 24, padding: 24,
                      gridColumn: destinations.length > 3 ? 'span 2' : undefined,
                    }}>
                      <p style={{
                        margin: '0 0 14px', fontSize: '0.68rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <MapPin style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                        Places Visited
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {destinations.map(d => (
                          <span key={d} style={{
                            padding: '6px 14px', borderRadius: 10,
                            fontSize: '0.82rem', fontWeight: 500,
                            background: 'var(--surface-hover)', color: 'var(--text)',
                            border: '1px solid var(--border)',
                            transition: 'transform 0.15s',
                            cursor: 'default',
                          }}
                            onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── BUCKET LIST ── */}
            {tab === 'bucket' && isMe && (
              <motion.div
                key="bucket"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {bucketList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: 20,
                      background: 'var(--surface-hover)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}>
                      <List style={{ width: 32, height: 32, color: 'var(--primary)' }} />
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>No destinations saved yet.</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>React with 📍 on any post to add it here.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {bucketList.map((item) => {
                      const photos = (() => { try { return JSON.parse(item.journal.photos); } catch { return []; } })();
                      return (
                        <Link
                          key={item.id}
                          to={`/journals/${item.journal.id}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 16px',
                            borderRadius: 18,
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            textDecoration: 'none',
                            transition: 'border-color 0.18s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                            {photos[0] ? (
                              <img src={photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Plane style={{ width: 22, height: 22, color: 'var(--primary)' }} />
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 3px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin style={{ width: 10, height: 10 }} /> {item.destination}
                            </p>
                            <p style={{ margin: '0 0 3px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }} className="truncate">{item.journal.title}</p>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              by {item.journal.user.username} · saved {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── MEETWAYS ── */}
            {tab === 'meetways' && isMe && (
              <motion.div
                key="meetways"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button
                    onClick={() => navigate('/meetways/create')}
                    className="btn-glow"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 20px', borderRadius: 12,
                      color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    <Plus style={{ width: 15, height: 15 }} />
                    New Meetway
                  </button>
                </div>

                {hostedMeetways.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: 20,
                      background: 'var(--surface-hover)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}>
                      <Plane style={{ width: 32, height: 32, color: 'var(--primary)' }} />
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>You haven't hosted any meetways yet.</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 24px' }}>Plan your next group trip and invite others!</p>
                    <button
                      onClick={() => navigate('/meetways/create')}
                      className="btn-glow"
                      style={{
                        padding: '11px 28px', borderRadius: 12,
                        color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      Create Meetway
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {hostedMeetways.map(m => {
                      const statusColor = m.status === 'active' ? '#34d399' : m.status === 'completed' ? '#60a5fa' : '#f87171';
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '16px 18px',
                            borderRadius: 20,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            transition: 'border-color 0.18s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                            {m.coverPhoto
                              ? <img src={m.coverPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Plane style={{ width: 22, height: 22, color: 'var(--primary)' }} />
                                </div>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }} className="truncate">{m.title}</p>
                              <span style={{
                                fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em',
                                padding: '2px 8px', borderRadius: 999,
                                background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`,
                                flexShrink: 0,
                              }}>
                                {m.status}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 2px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin style={{ width: 10, height: 10 }} /> {m.destination}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {m.spotsTaken}/{m.maxPeople} travellers · ₹{m.budgetMin}–₹{m.budgetMax}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button
                              onClick={() => navigate(`/meetways/${m.id}/edit`)}
                              title="Edit"
                              style={{
                                width: 36, height: 36, borderRadius: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--primary-dim)', color: 'var(--primary)',
                                border: '1px solid var(--border)', cursor: 'pointer',
                                transition: 'all 0.18s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-dim)'; e.currentTarget.style.color = 'var(--primary)'; }}
                            >
                              <Settings style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              onClick={() => setConfirmAction({ type: 'toggle', meetway: m })}
                              disabled={meetwaysBusy}
                              title={m.status === 'closed' ? 'Reactivate' : 'Deactivate'}
                              style={{
                                width: 36, height: 36, borderRadius: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(249,115,22,0.1)', color: '#f97316',
                                border: '1px solid rgba(249,115,22,0.3)', cursor: meetwaysBusy ? 'not-allowed' : 'pointer',
                                transition: 'all 0.18s', opacity: meetwaysBusy ? 0.5 : 1,
                              }}
                              onMouseEnter={e => { if (!meetwaysBusy) { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.color = '#fff'; } }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.1)'; e.currentTarget.style.color = '#f97316'; }}
                            >
                              {m.status === 'closed' ? <ShieldCheck style={{ width: 14, height: 14 }} /> : <Pause style={{ width: 14, height: 14 }} />}
                            </button>
                            <button
                              onClick={() => setConfirmAction({ type: 'delete', meetway: m })}
                              disabled={meetwaysBusy}
                              title="Delete"
                              style={{
                                width: 36, height: 36, borderRadius: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.3)', cursor: meetwaysBusy ? 'not-allowed' : 'pointer',
                                transition: 'all 0.18s', opacity: meetwaysBusy ? 0.5 : 1,
                              }}
                              onMouseEnter={e => { if (!meetwaysBusy) { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; } }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── MODALS ── */}
      {modal === 'followers' && (
        <UserModal title={`Followers · ${profile._count.followers}`} users={modalUsers} onClose={() => setModal(null)} />
      )}
      {modal === 'following' && (
        <UserModal title={`Following · ${profile._count.following}`} users={modalUsers} onClose={() => setModal(null)} />
      )}
      {modal === 'edit' && (
        <EditModal profile={profile} onClose={() => setModal(null)} onSaved={handleProfileSaved} />
      )}

      {confirmAction?.type === 'delete' && (
        <ConfirmModal
          icon={<Trash2 className="w-6 h-6" />}
          title="Delete Meetway?"
          message={`"${confirmAction.meetway.title}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
          confirmColor="#ef4444"
          busy={meetwaysBusy}
          onConfirm={confirmDelete}
          onClose={() => !meetwaysBusy && setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === 'toggle' && (
        <ConfirmModal
          icon={confirmAction.meetway.status === 'closed' ? <ShieldCheck className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          title={confirmAction.meetway.status === 'closed' ? 'Reactivate Meetway?' : 'Deactivate Meetway?'}
          message={confirmAction.meetway.status === 'closed'
            ? `"${confirmAction.meetway.title}" will be visible again in the Meetways discovery.`
            : `"${confirmAction.meetway.title}" will be hidden from the public section. You can reactivate it anytime.`
          }
          confirmLabel={confirmAction.meetway.status === 'closed' ? 'Reactivate' : 'Deactivate'}
          confirmColor={confirmAction.meetway.status === 'closed' ? '#34d399' : '#f59e0b'}
          busy={meetwaysBusy}
          onConfirm={confirmToggle}
          onClose={() => !meetwaysBusy && setConfirmAction(null)}
        />
      )}
    </>
  );
}
