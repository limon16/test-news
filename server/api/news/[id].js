import newsData from '../../data/news.json'
import { defineEventHandler } from 'h3'
import { formatServerDate } from '~/server/utils/formatServerDate.js'

export default defineEventHandler((event) => {
  const { id } = event.context.params

  let article = null

  const numericId = parseInt(id)
  if (!isNaN(numericId)) {
    article = newsData.find(item => item.id === numericId)
  }

  if (!article) {
    article = newsData.find(item => item.slug === id)
  }

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Статтю не знайдено'
    })
  }

  return {
    ...article,
    formattedDate: article.publishedAt ? formatServerDate(article.publishedAt) : 'Дата відсутня'
  }
})
