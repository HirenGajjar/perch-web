import { prisma } from '../lib/prisma.ts'

const LIST_PAGE_SIZE = 20

export async function getArticlesForUser(userId: string, page: number = 1) {
  const skip = (page - 1) * LIST_PAGE_SIZE

  const userFeeds = await prisma.subscription.findMany({
    where: { userId },
    select: { feedId: true }
  })

  const feedIds = userFeeds.map(s => s.feedId)

  if (feedIds.length === 0) return { articles: [], total: 0, page, pages: 0 }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { feedId: { in: feedIds } },
      select: {
        id: true,
        title: true,
        excerpt: true,
        author: true,
        imageUrl: true,
        readingTime: true,
        publishedAt: true,
        createdAt: true,
        url: true,
        feed: { select: { id: true, title: true, faviconUrl: true } },
        readStates: {
          where: { userId },
          select: { readAt: true }
        },
        bookmarks: {
          where: { userId },
          select: { id: true }
        }
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: LIST_PAGE_SIZE
    }),
    prisma.article.count({
      where: { feedId: { in: feedIds } }
    })
  ])

  return {
    articles: articles.map(a => ({
      ...a,
      isRead: a.readStates.length > 0,
      isBookmarked: a.bookmarks.length > 0,
      readStates: undefined,
      bookmarks: undefined
    })),
    total,
    page,
    pages: Math.ceil(total / LIST_PAGE_SIZE)
  }
}

export async function getArticleById(articleId: string, userId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      feed: { select: { id: true, title: true, faviconUrl: true, siteUrl: true } },
      readStates: { where: { userId }, select: { id: true, scrollOffset: true } },
      bookmarks: { where: { userId }, select: { id: true } },
      highlights: { where: { userId } }
    }
  })

  if (!article) return null

  if (article.readStates.length === 0) {
    await prisma.readState.create({
      data: { userId, articleId }
    })
  }

  return {
    ...article,
    isRead: true,
    isBookmarked: article.bookmarks.length > 0,
    scrollOffset: article.readStates[0]?.scrollOffset ?? 0,
    highlights: article.highlights,
    readStates: undefined,
    bookmarks: undefined
  }
}

export async function updateScrollPosition(
  articleId: string,
  userId: string,
  scrollOffset: number
) {
  await prisma.readState.upsert({
    where: { userId_articleId: { userId, articleId } },
    update: { scrollOffset },
    create: { userId, articleId, scrollOffset }
  })
}
