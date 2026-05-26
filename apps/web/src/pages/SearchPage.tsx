import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.ts';
import { usePageTitle } from '../hooks/usePageTitle.ts';
import { ArticleCard } from '../components/ArticleCard.tsx';
import { stripHtml } from '../lib/stripHtml.ts';

export default function SearchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [mode, setMode] = useState<'my-feeds' | 'discover'>('my-feeds');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [addingFeedId, setAddingFeedId] = useState<string | null>(null);

  usePageTitle('Search');

  // My feeds search
  const { data: myFeedsData, isLoading: myFeedsLoading } = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(submitted)}`).then((r) => r.data),
    enabled: submitted.length >= 2 && mode === 'my-feeds',
  });

  // Discover search via Feedly
  const { data: discoverData, isLoading: discoverLoading } = useQuery({
    queryKey: ['discover', submitted],
    queryFn: () => api.get(`/discover?q=${encodeURIComponent(submitted)}`).then((r) => r.data),
    enabled: submitted.length >= 2 && mode === 'discover',
  });

  const addFeed = useMutation({
    mutationFn: (url: string) => api.post('/feeds', { url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setAddingFeedId(null);
    },
    onError: () => setAddingFeedId(null),
  });

  const bookmark = useMutation({
    mutationFn: ({ id, isBookmarked }: { id: string; isBookmarked: boolean }) =>
      isBookmarked ? api.delete(`/bookmarks/${id}`) : api.post(`/bookmarks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search', submitted] }),
  });

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) setSubmitted(query.trim());
  }

  const myResults = myFeedsData?.results ?? [];
  const discoverResults = discoverData?.results ?? [];
  const isLoading = mode === 'my-feeds' ? myFeedsLoading : discoverLoading;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(12,12,14,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '48px',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '0.825rem', flexShrink: 0, transition: 'color 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          ← Back
        </button>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
          <input
            autoFocus
            type="text"
            placeholder={mode === 'my-feeds' ? 'Search your articles...' : 'Search for blogs, authors, topics...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.875rem', padding: '0.3rem 0.75rem', transition: 'border-color 0.15s' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            type="submit"
            style={{ padding: '0.3rem 0.9rem', background: 'var(--accent)', color: '#0c0c0e', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Search
          </button>
        </form>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem 2rem 4rem' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setMode('my-feeds')}
            style={{
              padding: '0.35rem 0.9rem', borderRadius: '20px',
              border: `1px solid ${mode === 'my-feeds' ? 'var(--accent)' : 'var(--border)'}`,
              background: mode === 'my-feeds' ? 'var(--accent-dim)' : 'transparent',
              color: mode === 'my-feeds' ? 'var(--accent)' : 'var(--text-3)',
              fontSize: '0.775rem', fontWeight: mode === 'my-feeds' ? 500 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            My feeds
          </button>
          <button
            onClick={() => setMode('discover')}
            style={{
              padding: '0.35rem 0.9rem', borderRadius: '20px',
              border: `1px solid ${mode === 'discover' ? 'var(--accent)' : 'var(--border)'}`,
              background: mode === 'discover' ? 'var(--accent-dim)' : 'transparent',
              color: mode === 'discover' ? 'var(--accent)' : 'var(--text-3)',
              fontSize: '0.775rem', fontWeight: mode === 'discover' ? 500 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            Discover
          </button>
        </div>

        {/* Empty state */}
        {!submitted && (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-3)' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>
              {mode === 'my-feeds' ? 'Search your feeds' : 'Discover new feeds'}
            </div>
            <p style={{ fontSize: '0.85rem' }}>
              {mode === 'my-feeds'
                ? 'Find articles by title, author, or topic'
                : 'Search for blogs and authors to follow'}
            </p>
          </div>
        )}

        {submitted && isLoading && (
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', padding: '2rem 0' }}>Searching...</p>
        )}

        {/* My feeds results */}
        {mode === 'my-feeds' && submitted && !myFeedsLoading && (
          <>
            {myResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-3)' }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>
                  No results for "{submitted}"
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Not in your feeds?</p>
                <button
                  onClick={() => setMode('discover')}
                  style={{ padding: '0.4rem 1rem', background: 'var(--accent-dim)', border: '1px solid rgba(212,168,83,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Search Discover instead →
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
                  {myResults.length} result{myResults.length !== 1 ? 's' : ''} for "{submitted}"
                </p>
                {myResults.map((article: any) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    showFeedLabel={true}
                    speakingId={speakingId}
                    onBookmark={(id, isBookmarked) => bookmark.mutate({ id, isBookmarked })}
                    onSpeak={speakArticle}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* Discover results */}
        {mode === 'discover' && submitted && !discoverLoading && (
          <>
            {discoverResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-3)' }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>
                  No feeds found for "{submitted}"
                </div>
                <p style={{ fontSize: '0.85rem' }}>Try a different search term</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
                  {discoverResults.length} feed{discoverResults.length !== 1 ? 's' : ''} found for "{submitted}"
                </p>
                {discoverResults.map((feed: any) => (
                  <div
                    key={feed.feedId}
                    style={{
                      padding: '1rem 0',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '8px',
                      background: 'var(--bg-3)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, overflow: 'hidden',
                    }}>
                      {feed.iconUrl ? (
                        <img src={feed.iconUrl} style={{ width: 40, height: 40, objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span style={{ fontSize: '1rem', color: 'var(--text-3)' }}>
                          {(feed.title ?? '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                        {feed.title ?? 'Untitled'}
                      </div>
                      {feed.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {stripHtml(feed.description)}
                        </p>
                      )}
                      {feed.website && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.2rem', display: 'block' }}>
                          {feed.website.replace(/^https?:\/\//, '').split('/')[0]}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setAddingFeedId(feed.feedId);
                        addFeed.mutate(feed.feedId.replace('feed/', ''));
                      }}
                      disabled={addingFeedId === feed.feedId}
                      style={{
                        padding: '0.4rem 0.9rem',
                        background: addingFeedId === feed.feedId ? 'var(--bg-3)' : 'var(--accent)',
                        color: addingFeedId === feed.feedId ? 'var(--text-3)' : '#0c0c0e',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        cursor: addingFeedId === feed.feedId ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {addingFeedId === feed.feedId ? 'Adding...' : '+ Follow'}
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}