import RSSParser from 'rss-parser';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { prisma } from '../lib/prisma.ts';

const parser = new RSSParser();

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanAuthor(author: string | undefined | null): string | null {
  if (!author) return null;
  const cleaned = author
    .replace(/^hidden\s*/i, '')
    .replace(/\s*\([^)]*\)\s*/g, '')
    .trim();
  return cleaned || null;
}

function makeImagesAbsolute(html: string, baseUrl: string): string {
  if (!baseUrl) return html;
  const base = new URL(baseUrl);
  return html
    .replace(/src="\/([^"]+)"/g, `src="${base.origin}/$1"`)
    .replace(/src='\/([^']+)'/g, `src='${base.origin}/$1'`);
}

function cleanContent(html: string): string {
  return html
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/<div[^>]*class="[^"]*subscribe[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*newsletter[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*signup[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
}

async function fetchFullContent(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Perch RSS Reader/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    return article?.content ?? null;
  } catch {
    return null;
  }
}

async function discoverFeedUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Perch RSS Reader/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();

    const patterns = [
      /\<link[^>]+type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/gi,
      /\<link[^>]+type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/gi,
      /\<link[^>]+href=["']([^"']+)["'][^>]*type=["']application\/rss\+xml["']/gi,
      /\<link[^>]+href=["']([^"']+)["'][^>]*type=["']application\/atom\+xml["']/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (match?.[1]) {
        const feedUrl = match[1];
        if (feedUrl.startsWith('http')) return feedUrl;
        const base = new URL(url);
        return new URL(feedUrl, base.origin).toString();
      }
    }

    const base = new URL(url);
    const candidates = [
      `${base.origin}/feed`,
      `${base.origin}/feed.xml`,
      `${base.origin}/rss`,
      `${base.origin}/rss.xml`,
      `${base.origin}/atom.xml`,
      `${base.origin}/blog/feed`,
      `${base.origin}/blog/rss`,
    ];

    for (const candidate of candidates) {
      try {
        const r = await fetch(candidate, {
          signal: AbortSignal.timeout(4000),
          headers: { 'User-Agent': 'Perch RSS Reader/1.0' },
        });
        const ct = r.headers.get('content-type') ?? '';
        if (r.ok && (ct.includes('xml') || ct.includes('rss') || ct.includes('atom'))) {
          return candidate;
        }
      } catch {
        continue;
      }
    }

    return url;
  } catch {
    return url;
  }
}

export async function addFeed(url: string, userId: string) {
  let feed;
  let resolvedUrl = url;

  try {
    feed = await parser.parseURL(url);
  } catch {
    resolvedUrl = await discoverFeedUrl(url);
    try {
      feed = await parser.parseURL(resolvedUrl);
    } catch {
      throw new Error('Could not find an RSS feed at that URL');
    }
  }

  const existing = await prisma.feed.findUnique({ where: { url: resolvedUrl } });

  const dbFeed =
    existing ??
    (await prisma.feed.create({
      data: {
        url: resolvedUrl,
        title: feed.title ?? 'Untitled Feed',
        description: feed.description ?? null,
        siteUrl: feed.link ?? null,
        faviconUrl: feed.image?.url ?? null,
      },
    }));

  const alreadySubscribed = await prisma.subscription.findUnique({
    where: { userId_feedId: { userId, feedId: dbFeed.id } },
  });

  if (alreadySubscribed) {
    throw new Error('You are already subscribed to this feed');
  }

  await prisma.subscription.create({
    data: { userId, feedId: dbFeed.id },
  });

  if (!existing) {
    const articles = (feed.items ?? []).slice(0, 20);

    for (const item of articles) {
      try {
        if (!item.link) continue;

        const rawContent = item['content:encoded'] ?? item.content ?? item.summary ?? '';
        const plainText = stripHtml(rawContent);

        let finalContent = rawContent;
        if (plainText.length < 500 && item.link) {
          const full = await fetchFullContent(item.link);
          if (full && stripHtml(full).length > plainText.length) {
            finalContent = full;
          }
        }

        const finalPlainText = stripHtml(finalContent);

        await prisma.article.upsert({
          where: { url: item.link },
          update: {
            cleanContent: finalPlainText.length > 500
              ? cleanContent(makeImagesAbsolute(finalContent, feed.link ?? ''))
              : undefined,
            readingTime: estimateReadingTime(finalPlainText),
          },
          create: {
            feedId: dbFeed.id,
            url: item.link,
            title: item.title ?? 'Untitled',
            cleanContent: cleanContent(makeImagesAbsolute(finalContent, feed.link ?? '')),
            excerpt: finalPlainText.slice(0, 300),
            author: cleanAuthor(item.creator),
            imageUrl: item.enclosure?.url ?? null,
            readingTime: estimateReadingTime(finalPlainText),
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
          },
        });
      } catch {
        continue;
      }
    }
  }

  return dbFeed;
}

export async function getUserFeeds(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    include: {
      feed: {
        include: {
          _count: { select: { articles: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function unsubscribeFeed(feedId: string, userId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { userId_feedId: { userId, feedId } },
  });

  if (!sub) throw new Error('Subscription not found');

  await prisma.subscription.delete({
    where: { userId_feedId: { userId, feedId } },
  });
}