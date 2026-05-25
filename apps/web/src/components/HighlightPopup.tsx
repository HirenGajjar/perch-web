interface Props {
  x: number;
  y: number;
  onColor: (color: string) => void;
  onDelete?: () => void;
  onClose: () => void;
  mode?: 'create' | 'edit';
}

const COLORS = [
  { key: 'yellow', bg: '#ffd500', label: 'Yellow' },
  { key: 'green',  bg: '#48c78e', label: 'Green' },
  { key: 'pink',   bg: '#ff6384', label: 'Pink' },
  { key: 'blue',   bg: '#63b3ff', label: 'Blue' },
];

export function HighlightPopup({ x, y, onColor, onDelete, onClose, mode = 'create' }: Props) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
      <div
        style={{
          position: 'fixed',
          left: x,
          top: y - 52,
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'var(--bg-2)',
          border: '1px solid var(--border-strong)',
          borderRadius: '8px',
          padding: '0.4rem 0.6rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginRight: '0.2rem' }}>
          {mode === 'edit' ? 'Change' : 'Highlight'}
        </span>
        {COLORS.map((c) => (
          <button
            key={c.key}
            title={c.label}
            onClick={() => onColor(c.key)}
            style={{ width: 20, height: 20, borderRadius: '50%', background: c.bg, border: 'none', cursor: 'pointer', transition: 'transform 0.1s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ))}
        {mode === 'edit' && onDelete && (
          <>
            <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 0.2rem' }} />
            <button
              onClick={onDelete}
              title="Remove highlight"
              style={{ padding: '0.15rem 0.4rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-3)', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6384'; e.currentTarget.style.borderColor = '#ff6384'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </>
  );
}
