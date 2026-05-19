import { useState } from 'react';

export function FeedIcon({ feed, size = 16 }: { feed: any; size?: number }) {
  const [err, setErr] = useState(false);
  if (feed.faviconUrl && !err) {
    return (
      <img
        src={feed.faviconUrl}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '4px', flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '4px',
        background: 'var(--accent-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.55, fontWeight: 700,
        color: 'var(--accent)', flexShrink: 0,
      }}
    >
      {feed.title[0]?.toUpperCase()}
    </div>
  );
}
