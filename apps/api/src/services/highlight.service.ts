import { prisma } from '../lib/prisma.ts'

export async function createHighlight(
  userId: string,
  articleId: string,
  text: string,
  startOffset: number,
  endOffset: number,
  color: string = 'yellow',
  note?: string
) {
  const article = await prisma.article.findUnique({ where: { id: articleId } })
  if (!article) throw new Error('Article not found')

  return prisma.highlight.create({
    data: { userId, articleId, text, startOffset, endOffset, color, note }
  })
}

export async function updateHighlight(
  highlightId: string,
  userId: string,
  data: { color?: string; note?: string }
) {
  const highlight = await prisma.highlight.findUnique({ where: { id: highlightId } })
  if (!highlight || highlight.userId !== userId) throw new Error('Highlight not found')

  return prisma.highlight.update({
    where: { id: highlightId },
    data
  })
}

export async function deleteHighlight(highlightId: string, userId: string) {
  const highlight = await prisma.highlight.findUnique({ where: { id: highlightId } })
  if (!highlight || highlight.userId !== userId) throw new Error('Highlight not found')

  await prisma.highlight.delete({ where: { id: highlightId } })
}

export async function getHighlightsForArticle(userId: string, articleId: string) {
  return prisma.highlight.findMany({
    where: { userId, articleId },
    orderBy: { startOffset: 'asc' }
  })
}
