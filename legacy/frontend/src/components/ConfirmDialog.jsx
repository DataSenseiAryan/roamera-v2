import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   // trigger: setConfirm({ title, message, danger, onConfirm })
 *   <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
 */
export default function ConfirmDialog({ config, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (config) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [config, onClose]);

  const danger = config?.danger !== false;

  return (
    <AnimatePresence>
      {config && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Dialog */}
          <motion.div
            key="cd-dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 101,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16, pointerEvents: 'none',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 400,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
            >
              {/* Icon + text */}
              <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
                  background: danger ? 'rgba(244,63,94,0.12)' : 'rgba(var(--primary-rgb),0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  {config.icon || (danger ? '🗑️' : '❓')}
                </div>
                <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                  {config.title || 'Are you sure?'}
                </p>
                {config.message && (
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {config.message}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, padding: '16px 20px' }}>
                {!config.hideCancel && (
                  <button
                    onClick={onClose}
                    style={{
                      flex: 1, background: 'var(--surface-hover)', color: 'var(--text)',
                      border: '1px solid var(--border)', padding: '11px',
                      borderRadius: 11, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => { config.onConfirm?.(); onClose(); }}
                  style={{
                    flex: 1, border: 'none', padding: '11px', borderRadius: 11,
                    fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                    background: danger ? '#f43f5e' : 'var(--primary)',
                    color: '#fff',
                  }}
                >
                  {config.confirmLabel || (danger ? 'Delete' : 'Confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
