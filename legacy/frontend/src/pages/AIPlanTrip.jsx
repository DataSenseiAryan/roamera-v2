import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const ACTIVITY_OPTIONS = [
  'Adventure', 'Beach', 'Culture', 'Food', 'History',
  'Nature', 'Nightlife', 'Shopping', 'Sightseeing', 'Wellness'
];

const COMPANION_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
];

function Tag({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 9999,
        fontSize: '0.75rem',
        fontWeight: 500,
        border: '1px solid',
        cursor: 'pointer',
        transition: 'all 0.15s',
        background: selected ? 'var(--primary)' : 'transparent',
        borderColor: selected ? 'var(--primary)' : 'var(--border)',
        color: selected ? '#fff' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="glass rounded-2xl p-5 mb-4">
      <h3 style={{
        fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: '0.75rem', marginTop: 0,
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function DayCard({ day }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--surface-hover)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: 16,
          textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>Day {day.day}</span>
          <p style={{ color: 'var(--text)', fontWeight: 500, margin: '2px 0 0' }}>{day.title}</p>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          padding: '12px 16px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {['morning', 'afternoon', 'evening'].map((period) => (
            day[period]?.length > 0 && (
              <div key={period}>
                <p style={{
                  fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', marginBottom: 4, marginTop: 0,
                }}>
                  {period}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {day[period].map((item, i) => (
                    <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text)', display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }}>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', borderRadius: 12, padding: '10px 14px',
  fontSize: '0.875rem',
  background: 'var(--surface-hover)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6,
};

export default function AIPlanTrip() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [destination, setDestination] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(nextWeek);
  const [activities, setActivities] = useState([]);
  const [companion, setCompanion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);

  function toggleActivity(a) {
    setActivities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  async function generate() {
    if (!destination.trim()) return setError('Please enter a destination.');
    setError('');
    setLoading(true);
    setPlan(null);
    try {
      const res = await api.post('/ai-planner/generate', {
        destination: destination.trim(),
        fromDate,
        toDate,
        activityPreferences: activities,
        companion,
      });
      setPlan(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div
        className="rounded-2xl mb-8 relative overflow-hidden p-5 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a21caf 100%)' }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{ position: 'absolute', top: 16, left: 16, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          ← Back
        </button>
        <div style={{ textAlign: 'center', color: 'white', marginTop: 8 }}>
          <p style={{ fontSize: '2.25rem', marginBottom: 8, lineHeight: 1 }}>✨</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>AI Trip Planner</h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Generate a personalised itinerary powered by AI</p>
        </div>
      </div>

      {/* Form */}
      <div className="glass rounded-2xl p-6 mb-6" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Destination */}
        <div>
          <label style={labelStyle}>Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Bali, Tokyo, Paris…"
            style={inputStyle}
          />
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>From</label>
            <input
              type="date"
              value={fromDate}
              min={today}
              onChange={(e) => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>To</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Activity Preferences */}
        <div>
          <label style={labelStyle}>
            Activity Preferences <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>(optional)</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ACTIVITY_OPTIONS.map((a) => (
              <Tag key={a} label={a} selected={activities.includes(a)} onClick={() => toggleActivity(a)} />
            ))}
          </div>
        </div>

        {/* Companion */}
        <div>
          <label style={labelStyle}>
            Travelling with <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>(optional)</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COMPANION_OPTIONS.map((c) => (
              <Tag
                key={c.value}
                label={c.label}
                selected={companion === c.value}
                onClick={() => setCompanion((prev) => (prev === c.value ? '' : c.value))}
              />
            ))}
          </div>
        </div>

        {error && <p style={{ fontSize: '0.875rem', color: '#ef4444', margin: 0 }}>{error}</p>}

        <button
          onClick={generate}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12,
            background: 'var(--primary)', color: '#fff',
            fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.65 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? (
            <>
              <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'aiSpin 0.75s linear infinite' }} />
              <style>{`@keyframes aiSpin{to{transform:rotate(360deg)}}`}</style>
              Generating your plan…
            </>
          ) : (
            <> ✨ Generate AI Trip Plan</>
          )}
        </button>
      </div>

      {/* No API key hint */}
      {error?.includes('Anthropic API key') && (
        <div className="glass rounded-2xl p-6 text-center mb-6" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
          <p style={{ fontSize: '1.875rem', marginBottom: 8 }}>🔑</p>
          <p style={{ fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>Anthropic API key required</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Add your key to{' '}
            <code style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 6px', color: 'var(--primary)', fontSize: '0.8rem' }}>
              backend/.env
            </code>:
          </p>
          <code style={{ display: 'block', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--primary)', fontSize: '0.875rem', borderRadius: 10, padding: '12px 16px' }}>
            ANTHROPIC_API_KEY=sk-ant-...
          </code>
        </div>
      )}

      {/* Results */}
      {plan && (
        <div>
          {/* About */}
          <Section title={`About ${plan.destination}`}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{plan.plan.aboutThePlace}</p>
            {plan.plan.bestTimeToVisit && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Best time to visit:</span>{' '}
                {plan.plan.bestTimeToVisit}
              </p>
            )}
          </Section>

          {/* Itinerary */}
          <Section title={`${plan.noOfDays}-Day Itinerary`}>
            {plan.plan.itinerary.map((day) => (
              <DayCard key={day.day} day={day} />
            ))}
          </Section>

          {/* Top Activities */}
          <Section title="Top Activities">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.plan.topActivities.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }}>•</span>
                  <div>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{a.name}</span>
                    {a.location && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>— {a.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Top Places */}
          {plan.plan.topPlaces?.length > 0 && (
            <Section title="Top Places to Visit">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {plan.plan.topPlaces.map((p, i) => (
                  <a
                    key={i}
                    href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.75rem', padding: '6px 12px', borderRadius: 9999,
                      background: 'var(--surface-hover)', border: '1px solid var(--border)',
                      color: 'var(--text)', textDecoration: 'none',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                  >
                    📍 {p.name}
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Local Cuisine */}
          <Section title="Local Cuisine to Try">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {plan.plan.localCuisine.map((c, i) => (
                <span key={i} style={{
                  fontSize: '0.75rem', padding: '6px 12px', borderRadius: 9999,
                  background: 'var(--surface-hover)', border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}>
                  🍽️ {c}
                </span>
              ))}
            </div>
          </Section>

          {/* Packing Checklist */}
          <Section title="Packing Checklist">
            <ul className="grid grid-cols-2 gap-1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {plan.plan.packingChecklist.map((item, i) => (
                <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text)', display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0 }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}
