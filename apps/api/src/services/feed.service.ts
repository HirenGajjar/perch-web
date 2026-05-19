import RSSParser from 'rss-parser';
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
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanAuthor(author: string | undefined | null): string | null {
  if (!author) return null;
  // Remove patterns like "hidden (name)", "Name (handle)", etc.
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

    await Promise.allSettled(
      articles.map((item) => {
        if (!item.link) return Promise.resolve();

        const rawContent = item['content:encoded'] ?? item.content ?? item.summary ?? '';
        const plainText = stripHtml(rawContent);

        return prisma.article.upsert({
          where: { url: item.link },
          update: {},
          create: {
            feedId: dbFeed.id,
            url: item.link,
            title: item.title ?? 'Untitled',
            cleanContent: makeImagesAbsolute(rawContent, feed.link ?? ''),
            excerpt: plainText.slice(0, 300),
            author: cleanAuthor(item.creator),
            imageUrl: item.enclosure?.url ?? null,
            readingTime: estimateReadingTime(plainText),
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
          },
        });
      })
    );
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
