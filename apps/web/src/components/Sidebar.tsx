import { useNavigate, useLocation } from 'react-router-dom';
import { FeedIcon } from './FeedIcon.tsx';

interface Props {
  user: any;
  feeds: any[];
  allArticlesCount: number;
  activeFeedId: string | null;
  onFeedSelect: (feedId: string | null) => void;
  onAddFeed: () => void;
  onLogout: () => void;
}

export function Sidebar({ user, feeds, allArticlesCount, activeFeedId, onFeedSelect, onAddFeed, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: '⌂', path: '/' },
    { label: 'Library', icon: '◈', path: '/library' },
  ];

  return (
    <aside style={{ width: '220px', minWidth: '220px', height: '100vh', background: 'var(--bg-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem 1.25rem 1rem' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.5rem', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          perch
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>
          {user?.name ?? user?.email}
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--border)' }} />

      <div style={{ padding: '0.75rem 0.75rem 0' }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <div
              key={item.path}
              onClick={() => { navigate(item.path); onFeedSelect(null); }}
              style={{ padding: '0.45rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', background: active ? 'var(--bg-hover)' : 'transparent', marginBottom: '1px', transition: 'background 0.15s' }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-3)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? 'var(--bg-hover)' : 'transparent'; }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{item.icon}</span>
              <span style={{ fontSize: '0.8rem', color: active ? 'var(--text)' : 'var(--text-2)', fontWeight: active ? 500 : 400 }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0.75rem 0' }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.75rem' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.5rem', marginBottom: '0.4rem', fontWeight: 600 }}>
          Following
        </div>

        <div
          onClick={() => { onFeedSelect(null); navigate('/'); }}
          style={{ padding: '0.45rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: !activeFeedId && location.pathname === '/' ? 'var(--bg-hover)' : 'transparent', marginBottom: '1px' }}
        >
          <span style={{ fontSize: '0.8rem', color: !activeFeedId && location.pathname === '/' ? 'var(--text)' : 'var(--text-2)' }}>All</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-3)', background: 'var(--bg-3)', padding: '0.1rem 0.4rem', borderRadius: '20px' }}>
  {allArticlesCount > 9 ? '9+' : allArticlesCount}
</span>
        </div>

        {feeds.map((sub: any) => (
          <div
            key={sub.id}
            onClick={() => { if (sub.feedId !== activeFeedId) { onFeedSelect(sub.feedId); navigate('/'); } }}
            style={{ padding: '0.45rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: activeFeedId === sub.feedId ? 'var(--bg-hover)' : 'transparent', marginBottom: '1px', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { if (activeFeedId !== sub.feedId) e.currentTarget.style.background = 'var(--bg-3)'; }}
            onMouseLeave={(e) => { if (activeFeedId !== sub.feedId) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              <FeedIcon feed={sub.feed} />
              <span style={{ fontSize: '0.8rem', color: activeFeedId === sub.feedId ? 'var(--text)' : 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sub.customTitle ?? sub.feed.title}
              </span>
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-3)', background: 'var(--bg-3)', padding: '0.1rem 0.4rem', borderRadius: '20px', flexShrink: 0, marginLeft: '0.25rem' }}>
              {sub.feed._count.articles > 9 ? '9+' : sub.feed._count.articles}
            </span>
          </div>
        ))}

        <button
          onClick={onAddFeed}
          style={{ width: '100%', padding: '0.45rem 0.5rem', marginTop: '0.5rem', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-3)', fontSize: '0.775rem', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          + Add feed
        </button>
      </div>

      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onLogout}
          style={{ fontSize: '0.75rem', color: 'var(--text-3)', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
