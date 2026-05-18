import { prisma } from '../lib/prisma.ts'

export async function addBookmark(userId: string, articleId: string) {
  const article = await prisma.article.findUnique({ where: { id: articleId } })
  if (!article) throw new Error('Article not found')

  return prisma.bookmark.create({
    data: { userId, articleId }
  })
}

export async function removeBookmark(userId: string, articleId: string) {
  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_articleId: { userId, articleId } }
  })
  if (!bookmark) throw new Error('Bookmark not found')

  await prisma.bookmark.delete({
    where: { userId_articleId: { userId, articleId } }
  })
}

export async function getBookmarks(userId: string) {
  return prisma.bookmark.findMany({
    where: { userId },
    include: {
      article: {
        select: {
          id: true,
          title: true,
          excerpt: true,
          author: true,
          imageUrl: true,
          readingTime: true,
          publishedAt: true,
          url: true,
          feed: { select: { id: true, title: true, faviconUrl: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}
