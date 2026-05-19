import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api.ts';
import { useAuthStore } from '../store/auth.ts';
import { usePageTitle } from '../hooks/usePageTitle.ts';
import { stripHtml } from '../lib/stripHtml.ts';
import { Sidebar } from '../components/Sidebar.tsx';
import { ArticleCard } from '../components/ArticleCard.tsx';
import { AddFeedModal } from '../components/AddFeedModal.tsx';

export default function FeedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [feedUrl, setFeedUrl] = useState('');
  const [addError, setAddError] = useState('');
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const view = location.pathname === '/library' ? 'library' : 'home';

  const { data: feedsData } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => api.get('/feeds').then((r) => r.data),
  });

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => api.get('/articles').then((r) => r.data),
  });

  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get('/bookmarks').then((r) => r.data),
    enabled: view === 'library',
  });

  const allArticles = articlesData?.articles ?? [];
  const feeds = feedsData?.subscriptions ?? [];

  const rawTitle = feeds.find((s: any) => s.feedId === activeFeedId)?.feed.title ?? '';
  const activeTitle = activeFeedId
    ? rawTitle.replace(/\s*blog\s*/gi, '').trim() || rawTitle
    : view === 'library' ? 'Library' : 'Home';
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
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const filteredArticles = useMemo(() => {
    let list = activeFeedId
      ? allArticles.filter((a: any) => a.feed.id === activeFeedId)
      : allArticles;
    if (showUnreadOnly) list = list.filter((a: any) => !a.isRead);
    return list;
  }, [allArticles, activeFeedId, showUnreadOnly]);

  const unreadCount = useMemo(() => {
    const base = activeFeedId
      ? allArticles.filter((a: any) => a.feed.id === activeFeedId)
      : allArticles;
    return base.filter((a: any) => !a.isRead).length;
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

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <Sidebar
        user={user}
        feeds={feeds}
        allArticlesCount={allArticles.length}
        activeFeedId={activeFeedId}
        onFeedSelect={setActiveFeedId}
        onAddFeed={() => setShowAddFeed(true)}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 0 4rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 2rem' }}>

          {/* Library */}
          {view === 'library' && (
            <>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem', color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                Library
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '2rem' }}>
                {bookmarksData?.bookmarks?.length ?? 0} saved article{bookmarksData?.bookmarks?.length !== 1 ? 's' : ''}
              </p>

              {bookmarksLoading && <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Loading...</p>}

              {!bookmarksLoading && bookmarksData?.bookmarks?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-3)' }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>Nothing saved yet</div>
                  <p style={{ fontSize: '0.825rem' }}>Hit ☆ Save on any article to add it here</p>
                </div>
              )}

              {bookmarksData?.bookmarks?.map((b: any) => (
                <ArticleCard
                  key={b.id}
                  article={{ ...b.article, isBookmarked: true, feed: b.article.feed ?? {} }}
                  showFeedLabel={false}
                  speakingId={speakingId}
                  onBookmark={(id, isBookmarked) => bookmark.mutate({ id, isBookmarked })}
                  onSpeak={speakArticle}
                />
              ))}
            </>
          )}

          {/* Home */}
          {view === 'home' && (
            <>
              {/* Filter pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
                <button
                  onClick={() => setShowUnreadOnly(false)}
                  style={{ padding: '0.35rem 0.9rem', borderRadius: '20px', border: `1px solid ${!showUnreadOnly ? 'var(--accent)' : 'var(--border)'}`, background: !showUnreadOnly ? 'var(--accent-dim)' : 'transparent', color: !showUnreadOnly ? 'var(--accent)' : 'var(--text-3)', fontSize: '0.775rem', fontWeight: !showUnreadOnly ? 500 : 400, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  All
                </button>
                <button
                  onClick={() => setShowUnreadOnly(true)}
                  style={{ padding: '0.35rem 0.9rem', borderRadius: '20px', border: `1px solid ${showUnreadOnly ? 'var(--accent)' : 'var(--border)'}`, background: showUnreadOnly ? 'var(--accent-dim)' : 'transparent', color: showUnreadOnly ? 'var(--accent)' : 'var(--text-3)', fontSize: '0.775rem', fontWeight: showUnreadOnly ? 500 : 400, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span style={{ marginLeft: '0.35rem', background: 'var(--accent)', color: '#0c0c0e', fontSize: '0.65rem', fontWeight: 700, padding: '0.05rem 0.35rem', borderRadius: '20px' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', opacity: 0.3 + i * 0.1 }}>
                      <div style={{ width: 56, height: 56, background: 'var(--bg-3)', borderRadius: '8px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '16px', width: '70%', background: 'var(--bg-3)', borderRadius: '4px', marginBottom: '0.5rem' }} />
                        <div style={{ height: '12px', width: '90%', background: 'var(--bg-3)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && allArticles.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-3)' }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>Nothing here yet</div>
                  <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Add a feed to start reading</p>
                  <button onClick={() => setShowAddFeed(true)} style={{ padding: '0.55rem 1.25rem', background: 'var(--accent)', color: '#0c0c0e', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    Add your first feed
                  </button>
                </div>
              )}

              {!isLoading && showUnreadOnly && unreadCount === 0 && allArticles.length > 0 && (
                <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-3)' }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>You're all caught up</div>
                  <p style={{ fontSize: '0.85rem' }}>No unread articles right now</p>
                </div>
              )}

              {filteredArticles.map((article: any) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  showFeedLabel={!activeFeedId}
                  speakingId={speakingId}
                  onBookmark={(id, isBookmarked) => bookmark.mutate({ id, isBookmarked })}
                  onSpeak={speakArticle}
                />
              ))}
            </>
          )}
        </div>
      </main>

      {showAddFeed && (
        <AddFeedModal
          feedUrl={feedUrl}
          addError={addError}
          isPending={addFeed.isPending}
          onChange={setFeedUrl}
          onAdd={() => addFeed.mutate(feedUrl)}
          onClose={() => { setShowAddFeed(false); setAddError(''); }}
        />
      )}
    </div>
  );
}
