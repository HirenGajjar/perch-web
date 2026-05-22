import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.ts';
import { usePageTitle } from '../hooks/usePageTitle.ts';

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [fontSize, setFontSize] = useState(18);

  const { data, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.get(`/articles/${id}`).then((r) => r.data.article),
  });

  usePageTitle(data?.title ?? '');

  const bookmark = useMutation({
    mutationFn: () =>
      data?.isBookmarked ? api.delete(`/bookmarks/${id}`) : api.post(`/bookmarks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const saveScroll = useMutation({
    mutationFn: (scrollOffset: number) => api.patch(`/articles/${id}/scroll`, { scrollOffset }),
  });

  useEffect(() => {
    if (data?.scrollOffset) {
      window.scrollTo(0, data.scrollOffset);
    }
  }, [data]);

  useEffect(() => {
    let last = 0;
    const handleScroll = () => {
      const now = Date.now();
      if (now - last >= 2000) {
        last = now;
        saveScroll.mutate(window.scrollY);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  function getPlainText(): string {
    return contentRef.current?.innerText ?? '';
  }

  function startSpeech() {
    window.speechSynthesis.cancel();
    const text = getPlainText();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  function stopSpeech() {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  function toggleSpeech() {
    isSpeaking ? stopSpeech() : startSpeech();
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Loading...</p>
      </div>
    );
  }

  if (!data) return null;

  const feedName = (data.feed?.title ?? '').replace(/\s*blog\s*/gi, '').trim() || data.feed?.title;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(12,12,14,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 1.5rem',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-3)',
            cursor: 'pointer',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={speechRate}
            onChange={(e) => {
              setSpeechRate(Number(e.target.value));
              if (isSpeaking) {
                stopSpeech();
                setTimeout(startSpeech, 100);
              }
            }}
            style={{
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              color: 'var(--text-3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.25rem 0.4rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <option value={0.75}>0.75×</option>
            <option value={1}>1×</option>
            <option value={1.25}>1.25×</option>
            <option value={1.5}>1.5×</option>
            <option value={2}>2×</option>
          </select>

            {/* Font size controls */}
<div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
  <button
    onClick={() => setFontSize(f => Math.max(14, f - 2))}
    style={{
      width: '28px', height: '28px',
      background: 'var(--bg-3)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-3)',
      fontSize: '0.8rem',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    A-
  </button>
  <button
    onClick={() => setFontSize(f => Math.min(28, f + 2))}
    style={{
      width: '28px', height: '28px',
      background: 'var(--bg-3)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-3)',
      fontSize: '0.9rem',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    A+
  </button>
</div>



          <button
            onClick={toggleSpeech}
            style={{
              padding: '0.3rem 0.75rem',
              background: isSpeaking ? 'var(--accent-dim)' : 'var(--bg-3)',
              border: `1px solid ${isSpeaking ? 'rgba(212,168,83,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              color: isSpeaking ? 'var(--accent)' : 'var(--text-3)',
              fontSize: '0.775rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {isSpeaking ? '⏹ Stop' : '▶ Listen'}
          </button>

          <button
            onClick={() => bookmark.mutate()}
            style={{
              padding: '0.3rem 0.75rem',
              background: data.isBookmarked ? 'var(--accent-dim)' : 'var(--bg-3)',
              border: `1px solid ${data.isBookmarked ? 'rgba(212,168,83,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              color: data.isBookmarked ? 'var(--accent)' : 'var(--text-3)',
              fontSize: '0.775rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {data.isBookmarked ? '★ Saved' : '☆ Save'}
          </button>

          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.3rem 0.75rem',
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-3)',
              fontSize: '0.775rem',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-3)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            }}
          >
            Source
          </a>
        </div>
      </div>

      {/* Article */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          {feedName && (
            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              {feedName}
            </p>
          )}

          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '2.25rem',
              fontWeight: 400,
              lineHeight: 1.2,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              marginBottom: '1rem',
            }}
          >
            {data.title}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-3)',
              flexWrap: 'wrap',
            }}
          >
            {data.author && (
              <>
                <span>by {data.author}</span>
                <span>·</span>
              </>
            )}
            {data.publishedAt && (
              <>
                <span>
                  {new Date(data.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span>·</span>
              </>
            )}
            {data.readingTime && <span>{data.readingTime} min read</span>}
          </div>
        </div>

        <hr
          style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2.5rem' }}
        />

        {/* Content */}
        <div
          ref={contentRef}
          className="reader-content"
          dangerouslySetInnerHTML={{ __html: data.cleanContent ?? '' }}
            style={{ fontSize: `${fontSize}px` }}
        />
      </div>
    </div>
  );
}
