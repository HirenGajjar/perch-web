import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.ts';
import { useAuthStore } from '../store/auth.ts';
import { stripHtml } from '../lib/stripHtml.ts';
import { usePageTitle } from '../hooks/usePageTitle.ts';

function LetterAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = [
    '#d4a853',
    '#5b8dd9',
    '#59a96a',
    '#c96b6b',
    '#9b6bc9',
    '#d4856a',
    '#5ba8b5',
    '#b5a65b',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        background: color + '22',
        border: `1px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: size * 0.4,
        fontWeight: 600,
        color: color,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

function FeedIcon({ feed }: { feed: any }) {
  const [err, setErr] = useState(false);
  if (feed.faviconUrl && !err) {
    return (
      <img
        src={feed.faviconUrl}
        onError={() => setErr(true)}
        style={{ width: 16, height: 16, borderRadius: '4px', flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: '4px',
        background: 'var(--accent-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        fontWeight: 700,
        color: 'var(--accent)',
        flexShrink: 0,
      }}
    >
      {feed.title[0]?.toUpperCase()}
    </div>
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [feedUrl, setFeedUrl] = useState('');
  const [addError, setAddError] = useState('');
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const { data: feedsData } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => api.get('/feeds').then((r) => r.data),
  });

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => api.get('/articles').then((r) => r.data),
  });

  const allArticles = articlesData?.articles ?? [];
  const feeds = feedsData?.subscriptions ?? [];

  const rawTitle = feeds.find((s: any) => s.feedId === activeFeedId)?.feed.title ?? '';
  const activeTitle = activeFeedId
    ? rawTitle.replace(/\s*blog\s*/gi, '').trim() || rawTitle
    : 'Home';
  usePageTitle(activeTitle);

  const addFeed = useMutation({
    mutationFn: (url: string) => api.post('/feeds', { url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setFeedUrl('');
      setShowAddFeed(false);
      setAddError('');
    },
    onError: (err: any) => {
      setAddError(err.response?.data?.error ?? 'Failed to add feed');
    },
  });

  const bookmark = useMutation({
    mutationFn: ({ id, isBookmarked }: { id: string; isBookmarked: boolean }) =>
      isBookmarked ? api.delete(`/bookmarks/${id}`) : api.post(`/bookmarks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const grouped = useMemo(() => {
    const filtered = activeFeedId
      ? allArticles.filter((a: any) => a.feed.id === activeFeedId)
      : allArticles;

    const map = new Map<string, { feed: any; articles: any[] }>();
    filtered.forEach((article: any) => {
      const fid = article.feed.id;
      if (!map.has(fid)) map.set(fid, { feed: article.feed, articles: [] });
      map.get(fid)!.articles.push(article);
    });
    return Array.from(map.values());
  }, [allArticles, activeFeedId]);

  function speakArticle(article: any) {
    if (speakingId === article.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const text = `${article.title}. ${stripHtml(article.excerpt ?? '')}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(article.id);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '220px',
          minWidth: '220px',
          height: '100vh',
          background: 'var(--bg-2)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '1.5rem 1.25rem 1rem' }}>
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '1.5rem',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            perch
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>
            {user?.name ?? user?.email}
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border)' }} />

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.75rem' }}>
          <div
            style={{
              fontSize: '0.6rem',
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '0 0.5rem',
              marginBottom: '0.4rem',
              fontWeight: 600,
            }}
          >
            Following
          </div>

          <div
            onClick={() => setActiveFeedId(null)}
            style={{
              padding: '0.45rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: !activeFeedId ? 'var(--bg-hover)' : 'transparent',
              marginBottom: '1px',
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                color: !activeFeedId ? 'var(--text)' : 'var(--text-2)',
              }}
            >
              All
            </span>
            <span
              style={{
                fontSize: '0.6rem',
                color: 'var(--text-3)',
                background: 'var(--bg-3)',
                padding: '0.1rem 0.4rem',
                borderRadius: '20px',
              }}
            >
              {allArticles.length}
            </span>
          </div>

          {feeds.map((sub: any) => (
            <div
              key={sub.id}
              onClick={() => setActiveFeedId(sub.feedId === activeFeedId ? null : sub.feedId)}
              style={{
                padding: '0.45rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: activeFeedId === sub.feedId ? 'var(--bg-hover)' : 'transparent',
                marginBottom: '1px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeFeedId !== sub.feedId) e.currentTarget.style.background = 'var(--bg-3)';
              }}
              onMouseLeave={(e) => {
                if (activeFeedId !== sub.feedId) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  overflow: 'hidden',
                }}
              >
                <FeedIcon feed={sub.feed} />
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: activeFeedId === sub.feedId ? 'var(--text)' : 'var(--text-2)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sub.customTitle ?? sub.feed.title}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-3)',
                  background: 'var(--bg-3)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '20px',
                  flexShrink: 0,
                  marginLeft: '0.25rem',
                }}
              >
                {sub.feed._count.articles}
              </span>
            </div>
          ))}

          <button
            onClick={() => setShowAddFeed(true)}
            style={{
              width: '100%',
              padding: '0.45rem 0.5rem',
              marginTop: '0.5rem',
              background: 'transparent',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-3)',
              fontSize: '0.775rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-3)';
            }}
          >
            + Add feed
          </button>
        </div>

        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{ fontSize: '0.75rem', color: 'var(--text-3)', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 0 4rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 2rem' }}>
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: '1.25rem 0',
                    borderBottom: '1px solid var(--border)',
                    opacity: 0.3 + i * 0.1,
                  }}
                >
                  <div
                    style={{
                      height: '10px',
                      width: '60px',
                      background: 'var(--bg-3)',
                      borderRadius: '4px',
                      marginBottom: '0.6rem',
                    }}
                  />
                  <div
                    style={{
                      height: '18px',
                      width: '75%',
                      background: 'var(--bg-3)',
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                    }}
                  />
                  <div
                    style={{
                      height: '12px',
                      width: '90%',
                      background: 'var(--bg-3)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {!isLoading && allArticles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-3)' }}>
              <div
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '1.25rem',
                  color: 'var(--text-2)',
                  marginBottom: '0.5rem',
                }}
              >
                Nothing here yet
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Add a feed to start reading
              </p>
              <button
                onClick={() => setShowAddFeed(true)}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: 'var(--accent)',
                  color: '#0c0c0e',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add your first feed
              </button>
            </div>
          )}

          {grouped.map(({ feed, articles }) => (
            <div key={feed.id} style={{ marginBottom: '2.5rem' }}>
              {/* Feed group header */}
              {!activeFeedId && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    marginBottom: '0.25rem',
                    padding: '0.5rem 0',
                  }}
                >
                  <FeedIcon feed={feed} />
                  <span
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: '1.4rem',
                      fontWeight: 400,
                      color: 'var(--text)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {feed.title.replace(/\s*blog\s*/gi, '').trim() || feed.title}
                  </span>
                  <span
                    style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '0.2rem' }}
                  >
                    · {articles.length} article{articles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Articles */}
              {articles.map((article: any, i: number) => (
                <div
                  key={article.id}
                  className="fade-up"
                  style={{
                    padding: '1rem 0',
                    borderTop: '1px solid var(--border)',
                    animationDelay: `${i * 0.03}s`,
                    opacity: 0,
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <LetterAvatar name={feed.title} size={36} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        onClick={() => navigate(`/article/${article.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <h3
                          style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: '1.05rem',
                            fontWeight: 400,
                            color: article.isRead ? 'var(--text-2)' : 'var(--text)',
                            lineHeight: 1.35,
                            marginBottom: '0.2rem',
                            letterSpacing: '-0.01em',
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = article.isRead
                              ? 'var(--text-2)'
                              : 'var(--text)')
                          }
                        >
                          {article.title}
                        </h3>

                        <div
                          style={{
                            display: 'flex',
                            gap: '0.4rem',
                            fontSize: '0.7rem',
                            color: 'var(--text-3)',
                            marginBottom: '0.4rem',
                            alignItems: 'center',
                          }}
                        >
                          {article.author && <span>{article.author}</span>}
                          {article.author && <span>·</span>}
                          {article.publishedAt && (
                            <span>
                              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                          {article.readingTime && <span>· {article.readingTime}m read</span>}
                          {article.isRead && <span>· read</span>}
                        </div>

                        <p
                          style={{
                            fontSize: '0.825rem',
                            color: 'var(--text-3)',
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {stripHtml(article.excerpt ?? '')}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.65rem',
                        }}
                      >
                        <button
                          onClick={() =>
                            bookmark.mutate({
                              id: article.id,
                              isBookmarked: article.isBookmarked,
                            })
                          }
                          style={{
                            padding: '0.3rem 0.65rem',
                            background: article.isBookmarked ? 'var(--accent-dim)' : 'var(--bg-3)',
                            border: `1px solid ${
                              article.isBookmarked ? 'var(--accent)44' : 'var(--border)'
                            }`,
                            borderRadius: 'var(--radius-sm)',
                            color: article.isBookmarked ? 'var(--accent)' : 'var(--text-3)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {article.isBookmarked ? '★ Saved' : '☆ Save'}
                        </button>

                        <button
                          onClick={() => speakArticle(article)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            background:
                              speakingId === article.id ? 'var(--accent-dim)' : 'var(--bg-3)',
                            border: `1px solid ${
                              speakingId === article.id ? 'var(--accent)44' : 'var(--border)'
                            }`,
                            borderRadius: 'var(--radius-sm)',
                            color: speakingId === article.id ? 'var(--accent)' : 'var(--text-3)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {speakingId === article.id ? '⏹ Stop' : '▶ Listen'}
                        </button>

                        <button
                          onClick={() => navigate(`/article/${article.id}`)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            background: 'var(--bg-3)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-3)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--text)';
                            e.currentTarget.style.borderColor = 'var(--border-strong)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-3)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                          }}
                        >
                          Read
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>

      {/* Add feed modal */}
      {showAddFeed && (
        <div
          onClick={() => {
            setShowAddFeed(false);
            setAddError('');
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)',
              padding: '1.75rem',
              width: '460px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            <h3
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '1.2rem',
                color: 'var(--text)',
                marginBottom: '0.3rem',
              }}
            >
              Add a feed
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1.25rem' }}>
              Paste an RSS feed URL or blog URL
            </p>

            {addError && (
              <div
                style={{
                  padding: '0.6rem 0.85rem',
                  background: 'rgba(224,85,85,0.08)',
                  border: '1px solid rgba(224,85,85,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--red)',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                }}
              >
                {addError}
              </div>
            )}

            <input
              autoFocus
              type="url"
              placeholder="https://example.com/feed.xml"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && feedUrl.trim() && addFeed.mutate(feedUrl)}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddFeed(false);
                  setAddError('');
                }}
                style={{
                  padding: '0.55rem 1.1rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-2)',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => addFeed.mutate(feedUrl)}
                disabled={addFeed.isPending || !feedUrl.trim()}
                style={{
                  padding: '0.55rem 1.1rem',
                  background: !feedUrl.trim() ? 'var(--bg-3)' : 'var(--accent)',
                  color: !feedUrl.trim() ? 'var(--text-3)' : '#0c0c0e',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: !feedUrl.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {addFeed.isPending ? 'Adding...' : 'Add feed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
