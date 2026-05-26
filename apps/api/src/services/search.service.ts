import { prisma } from '../lib/prisma.ts';

export async function searchArticles(query: string, userId: string) {
  if (!query || query.trim().length < 2) return [];

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    select: { feedId: true },
  });

  const feedIds = subscriptions.map((s) => s.feedId);
  if (!feedIds.length) return [];

  const results = await prisma.article.findMany({
    where: {
      feedId: { in: feedIds },
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { author: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      feed: { select: { id: true, title: true, faviconUrl: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return results;
}
