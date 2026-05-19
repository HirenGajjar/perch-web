interface Props {
  feedUrl: string;
  addError: string;
  isPending: boolean;
  onChange: (url: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

export function AddFeedModal({ feedUrl, addError, isPending, onChange, onAdd, onClose }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius)',
          padding: '1.75rem', width: '460px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', color: 'var(--text)', marginBottom: '0.3rem' }}>
          Add a feed
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1.25rem' }}>
          Paste an RSS feed URL or any blog URL
        </p>

        {addError && (
          <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {addError}
          </div>
        )}

        <input
          autoFocus
          type="url"
          placeholder="https://example.com"
          value={feedUrl}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && feedUrl.trim() && onAdd()}
          style={{ width: '100%', padding: '0.7rem 0.9rem', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.875rem', marginBottom: '1rem', transition: 'border-color 0.15s' }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />

        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '0.55rem 1.1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-2)', fontSize: '0.825rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={isPending || !feedUrl.trim()}
            style={{ padding: '0.55rem 1.1rem', background: !feedUrl.trim() ? 'var(--bg-3)' : 'var(--accent)', color: !feedUrl.trim() ? 'var(--text-3)' : '#0c0c0e', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', fontWeight: 600, cursor: !feedUrl.trim() ? 'not-allowed' : 'pointer' }}
          >
            {isPending ? 'Adding...' : 'Add feed'}
          </button>
        </div>
      </div>
    </div>
  );
}
