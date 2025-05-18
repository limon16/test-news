import commentsData from '../../data/comments.json'
import { defineEventHandler, getQuery } from 'h3'
import { formatServerDate } from '~/server/utils/formatServerDate.js'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const newsId = query.newsId ? parseInt(query.newsId) : null

  let filteredComments = commentsData

  if (newsId) {
    filteredComments = commentsData.filter(comment =>
      comment.newsId === newsId
    )
  }

  return filteredComments.map(item => ({
    ...item,
    formattedDate: item?.createdAt ? formatServerDate(item.createdAt) : 'Дата відсутня'
  }))
})
