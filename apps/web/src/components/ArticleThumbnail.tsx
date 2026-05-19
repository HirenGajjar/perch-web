import { useState } from 'react';

export function ArticleThumbnail({ url, title }: { url: string | null; title: string }) {
  const [err, setErr] = useState(false);
  const style = {
    width: 56, height: 56, borderRadius: '8px',
    flexShrink: 0, border: '1px solid var(--border)',
  };
  if (!url || err) {
    return (
      <div style={{
        ...style, background: 'var(--bg-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', color: 'var(--text-3)',
      }}>
        {title[0]?.toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={url} alt={title}
      onError={() => setErr(true)}
      style={{ ...style, objectFit: 'cover' }}
    />
  );
}
