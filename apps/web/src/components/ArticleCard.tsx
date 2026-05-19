import { useNavigate } from 'react-router-dom';
import { ArticleThumbnail } from './ArticleThumbnail.tsx';
import { FeedIcon } from './FeedIcon.tsx';
import { stripHtml } from '../lib/stripHtml.ts';

interface Props {
  article: any;
  showFeedLabel?: boolean;
  speakingId: string | null;
  onBookmark: (id: string, isBookmarked: boolean) => void;
  onSpeak: (article: any) => void;
}

export function ArticleCard({ article, showFeedLabel = false, speakingId, onBookmark, onSpeak }: Props) {
  const navigate = useNavigate();
  const isSpeaking = speakingId === article.id;

  return (
    <div
      className="fade-up"
      style={{
        padding: '1rem 0',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <ArticleThumbnail url={article.imageUrl} title={article.title} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div onClick={() => navigate(`/article/${article.id}`)} style={{ cursor: 'pointer' }}>

          {showFeedLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <FeedIcon feed={article.feed} />
              <span style={{
                fontSize: '0.68rem', color: 'var(--accent)',
                fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {article.feed.title.replace(/\s*blog\s*/gi, '').trim()}
              </span>
            </div>
          )}

          <h3
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '1.05rem', fontWeight: 400,
              color: article.isRead ? 'var(--text-2)' : 'var(--text)',
              lineHeight: 1.35, marginBottom: '0.2rem',
              letterSpacing: '-0.01em', transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = article.isRead ? 'var(--text-2)' : 'var(--text)')}
          >
            {article.title}
          </h3>

          <div style={{
            display: 'flex', gap: '0.4rem',
            fontSize: '0.7rem', color: 'var(--text-3)',
            marginBottom: '0.4rem', alignItems: 'center', flexWrap: 'wrap',
          }}>
            {article.author && <span>{article.author}</span>}
            {article.author && <span>·</span>}
            {article.publishedAt && (
              <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
            {article.readingTime && <span>· {article.readingTime}m read</span>}
            {article.isRead && <span style={{ opacity: 0.6 }}>· read</span>}
          </div>

          <p style={{
            fontSize: '0.825rem', color: 'var(--text-3)',
            lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {stripHtml(article.excerpt ?? '')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem' }}>
          <button
            onClick={() => onBookmark(article.id, article.isBookmarked)}
            style={{
              padding: '0.3rem 0.65rem',
              background: article.isBookmarked ? 'var(--accent-dim)' : 'var(--bg-3)',
              border: `1px solid ${article.isBookmarked ? 'rgba(212,168,83,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              color: article.isBookmarked ? 'var(--accent)' : 'var(--text-3)',
              fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {article.isBookmarked ? '★ Saved' : '☆ Save'}
          </button>

          <button
            onClick={() => onSpeak(article)}
            style={{
              padding: '0.3rem 0.65rem',
              background: isSpeaking ? 'var(--accent-dim)' : 'var(--bg-3)',
              border: `1px solid ${isSpeaking ? 'rgba(212,168,83,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              color: isSpeaking ? 'var(--accent)' : 'var(--text-3)',
              fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {isSpeaking ? '⏹ Stop' : '▶ Listen'}
          </button>

          <button
            onClick={() => navigate(`/article/${article.id}`)}
            style={{
              padding: '0.3rem 0.65rem',
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-3)',
              fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Read
          </button>
        </div>
      </div>
    </div>
  );
}
