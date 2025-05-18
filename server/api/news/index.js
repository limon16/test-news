import newsData from '../../data/news.json'
import { defineEventHandler } from 'h3'
import { formatServerDate } from '~/server/utils/formatServerDate.js'

const handler = defineEventHandler(() => {

  return newsData.map(item => ({
    ...item,
    formattedDate: item?.publishedAt ? formatServerDate(item.publishedAt) : 'Дата відсутня'
  }))
})

export default handler
