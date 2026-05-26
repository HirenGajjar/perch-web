import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.ts';
import { usePageTitle } from '../hooks/usePageTitle.ts';
import { ArticleCard } from '../components/ArticleCard.tsx';
import { stripHtml } from '../lib/stripHtml.ts';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  usePageTitle('Search');

  const { data, isLoading } = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(submitted)}`).then((r) => r.data),
    enabled: submitted.length >= 2,
  });

  const bookmark = {
    mutate: ({ id, isBookmarked }: { id: string; isBookmarked: boolean }) => {
      (isBookmarked
        ? api.delete(`/bookmarks/${id}`)
        : api.post(`/bookmarks/${id}`)
      ).then(() => {});
    },
  };

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

  const results = data?.results ?? [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(12,12,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', height: '48px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            placeholder="Search articles, authors, topics..."
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

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>
        {!submitted && (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-3)' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>
              Search your feeds
            </div>
            <p style={{ fontSize: '0.85rem' }}>Find articles by title, author, or topic</p>
          </div>
        )}

        {submitted && isLoading && (
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', padding: '2rem 0' }}>Searching...</p>
        )}

        {submitted && !isLoading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-3)' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>
              No results for "{submitted}"
            </div>
            <p style={{ fontSize: '0.85rem' }}>Try a different search term</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "{submitted}"
            </p>
            {results.map((article: any) => (
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
      </div>
    </div>
  );
}
