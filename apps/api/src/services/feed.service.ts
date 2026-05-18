import RSSParser from 'rss-parser'
import { prisma } from '../lib/prisma.ts'

const parser = new RSSParser()

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / 200)
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeImagesAbsolute(html: string, baseUrl: string): string {
  if (!baseUrl) return html
  const base = new URL(baseUrl)
  return html
    .replace(/src="\/([^"]+)"/g, `src="${base.origin}/$1"`)
    .replace(/src='\/([^']+)'/g, `src='${base.origin}/$1'`)
}

export async function addFeed(url: string, userId: string) {
  let feed

  try {
    feed = await parser.parseURL(url)
  } catch {
    throw new Error('Could not fetch or parse the RSS feed at that URL')
  }

  const existing = await prisma.feed.findUnique({ where: { url } })

  const dbFeed = existing ?? await prisma.feed.create({
    data: {
      url,
      title: feed.title ?? 'Untitled Feed',
      description: feed.description ?? null,
      siteUrl: feed.link ?? null,
      faviconUrl: feed.image?.url ?? null,
    }
  })

  const alreadySubscribed = await prisma.subscription.findUnique({
    where: { userId_feedId: { userId, feedId: dbFeed.id } }
  })

  if (alreadySubscribed) {
    throw new Error('You are already subscribed to this feed')
  }

  await prisma.subscription.create({
    data: { userId, feedId: dbFeed.id }
  })

  if (!existing) {
    const articles = (feed.items ?? []).slice(0, 20)

    await Promise.allSettled(
      articles.map(item => {
        if (!item.link) return Promise.resolve()

        const rawContent = item['content:encoded'] ?? item.content ?? item.summary ?? ''
        const plainText = stripHtml(rawContent)

        return prisma.article.upsert({
          where: { url: item.link },
          update: {},
          create: {
            feedId: dbFeed.id,
            url: item.link,
            title: item.title ?? 'Untitled',
            cleanContent: makeImagesAbsolute(rawContent, feed.link ?? ''),
            excerpt: plainText.slice(0, 300),
            author: item.creator ?? null,
            imageUrl: item.enclosure?.url ?? null,
            readingTime: estimateReadingTime(plainText),
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
          }
        })
      })
    )
  }

  return dbFeed
}

export async function getUserFeeds(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    include: {
      feed: {
        include: {
          _count: { select: { articles: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function unsubscribeFeed(feedId: string, userId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { userId_feedId: { userId, feedId } }
  })

  if (!sub) throw new Error('Subscription not found')

  await prisma.subscription.delete({
    where: { userId_feedId: { userId, feedId } }
  })
}
