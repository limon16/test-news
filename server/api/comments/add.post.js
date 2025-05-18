import fs from 'fs'
import path from 'path'
import { defineEventHandler, readBody } from 'h3'
import { formatServerDate } from '~/server/utils/formatServerDate.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.newsId || !body.content) {
      return {
        error: true,
        message: 'Необхідно вказати ID новини та текст коментаря'
      }
    }

    const newComment = {
      id: Date.now(),
      newsId: parseInt(body.newsId),
      author: body.author || 'Користувач',
      avatarUrl: body.avatarUrl || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      content: body.content,
      createdAt: new Date().toISOString(),
      likes: 0
    }

    newComment.formattedDate = formatServerDate(newComment.createdAt)

    const commentsFilePath = path.resolve('server/data/comments.json')

    const dir = path.dirname(commentsFilePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    let comments = []
    try {
      if (fs.existsSync(commentsFilePath)) {
        const data = fs.readFileSync(commentsFilePath, 'utf8')
        comments = JSON.parse(data)
      }
    } catch (error) {
      console.error('Помилка при читанні файлу коментарів:', error)
    }

    comments.push(newComment)

    fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2), 'utf8')

    return newComment
  } catch (error) {
    console.error('Помилка при додаванні коментаря:', error)
    return {
      error: true,
      message: 'Помилка при додаванні коментаря'
    }
  }
})
