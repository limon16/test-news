// plugins/websocket.js
import { useCommentsStore } from '~/stores/comments'

export default defineNuxtPlugin((nuxtApp) => {
  const logger = nuxtApp.$logger
  logger.info('[WebSocket] Initializing websocket plugin')

  const websocketState = reactive({
    isConnected: false,
    error: null
  })

  let commentIntervals = []

  const mockAuthors = [
    { name: 'Катерина', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Влад', avatar: 'https://i.pravatar.cc/150?img=8' },
    { name: 'Іван', avatar: 'https://i.pravatar.cc/150?img=9' },
    { name: 'Марія', avatar: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Олександр', avatar: 'https://i.pravatar.cc/150?img=20' },
    { name: 'Анна', avatar: 'https://i.pravatar.cc/150?img=32' },
    { name: 'Петро', avatar: 'https://i.pravatar.cc/150?img=27' }
  ]

  const mockMessages = [
    'Дуже цікава новина!',
    'Я не згоден з цим.',
    'Дякую за інформацію!',
    'Це змінило моє сприйняття теми.',
    'Чи є додаткові джерела?',
    'Треба більше таких новин!',
    'Не знав про це, дякую.',
    'Цікаво, як це вплине на ситуацію.'
  ]

  /**
   * Підключення до веб-сокета для конкретної новини
   * @param {string|number} newsId - ID новини
   */
  const connectWebSocket = (newsId) => {
    logger.info('WebSocket connection', { newsId })
    websocketState.isConnected = true
    websocketState.error = null

    startMockCommentGeneration(newsId)
  }

  /**
   * Відключення від веб-сокета
   */
  const disconnectWebSocket = () => {
    logger.info('WebSocket disconnection')
    websocketState.isConnected = false

    stopMockCommentGeneration()
  }

  /**
   * Запуск імітації генерації коментарів у реальному часі
   * @param {string|number} newsId - ID новини
   */
  const startMockCommentGeneration = (newsId) => {
    const commentsStore = useCommentsStore()
    if (!commentsStore) {
      logger.error('Comments store not found')
      return
    }

    // Зупиняємо попередні інтервали, якщо вони є
    stopMockCommentGeneration()

    logger.debug('Starting mock comment generation', { newsId })

    const interval = setInterval(() => {
      // Вибираємо випадкового автора і повідомлення
      const author = mockAuthors[Math.floor(Math.random() * mockAuthors.length)]
      const commentText = mockMessages[Math.floor(Math.random() * mockMessages.length)]

      // Створюємо об'єкт коментаря
      const newComment = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        newsId: parseInt(newsId),
        author: author.name,
        avatarUrl: author.avatar,
        content: commentText,
        createdAt: new Date().toISOString(),
        likes: Math.floor(Math.random() * 5)
      }

      // Додаємо коментар у стор
      commentsStore.handleNewComment(newComment)

      logger.debug('New realtime comment received', {
        commentId: newComment.id,
        newsId: newComment.newsId,
        author: newComment.author
      })

      // Викликаємо хук для сповіщення про новий коментар
      nuxtApp.hooks.callHook('ws:newComment', newComment)

    }, 8000 + Math.floor(Math.random() * 7000)) // Випадковий інтервал від 8 до 15 секунд

    // Зберігаємо інтервал для можливості зупинки
    commentIntervals.push(interval)
    logger.debug('Mock comment generation started', { newsId, intervalTime: '8-15 seconds' })
  }

  /**
   * Зупинка імітації генерації коментарів
   */
  const stopMockCommentGeneration = () => {
    // Зупиняємо всі інтервали
    if (commentIntervals.length > 0) {
      logger.debug('Stopping mock comment generation', { intervalsCount: commentIntervals.length })
      commentIntervals.forEach(interval => clearInterval(interval))
      commentIntervals = []
    }
  }

  // Зупиняємо генерацію коментарів перед закриттям додатку
  nuxtApp.hook('app:beforeLeave', () => {
    logger.debug('App before leave - stopping comment generation')
    stopMockCommentGeneration()
  })

  // Додаємо обробку помилок
  const handleWebSocketError = (error) => {
    websocketState.error = error.message || 'WebSocket connection error'
    websocketState.isConnected = false
    logger.error('WebSocket error', {
      error: error.message || 'Unknown error',
      stack: error.stack
    })
  }

  return {
    provide: {
      websocket: {
        state: readonly(websocketState),
        connect: connectWebSocket,
        disconnect: disconnectWebSocket,
        handleError: handleWebSocketError
      }
    }
  }
})
