import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'
import { useNuxtApp } from '#app'

export const useCommentsStore = defineStore('comments', () => {
  const nuxtApp = useNuxtApp()
  const { $logger } = nuxtApp

  const comments = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentNewsId = ref(null)

  onMounted(() => {
    loadCommentsFromLocalStorage()
  })

  function loadCommentsFromLocalStorage () {
    if (import.meta.client) {
      try {
        const savedComments = localStorage.getItem('nuxt-news-comments')
        if (savedComments) {
          const localComments = JSON.parse(savedComments)

          const existingIds = comments.value.map(c => c.id)
          const newComments = localComments.filter(c => !existingIds.includes(c.id))

          if (newComments.length > 0) {
            comments.value.push(...newComments)
            $logger.debug(`Завантажено ${newComments.length} коментарів з localStorage`)
          }
        }
      } catch (err) {
        $logger.logError(err, { context: 'завантаження коментарів з localStorage' })
      }
    }
  }

  function saveCommentsToLocalStorage () {
    if (import.meta.client) {
      try {
        localStorage.setItem('nuxt-news-comments', JSON.stringify(comments.value))
      } catch (err) {
        $logger.logError(err, { context: 'збереження коментарів у localStorage' })
      }
    }
  }

  const getCommentsByNewsId = computed(() => (newsId) => {
    return comments.value
      .filter(comment => comment.newsId === parseInt(newsId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })

  const getCommentsCount = computed(() => (newsId) => {
    return comments.value.filter(comment => comment.newsId === parseInt(newsId)).length
  })

  const getCurrentNewsComments = computed(() => {
    if (!currentNewsId.value) return []
    return comments.value
      .filter(comment => comment.newsId === parseInt(currentNewsId.value))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })

  async function fetchCommentsByNewsId (newsId) {
    loading.value = true
    error.value = null
    const parsedNewsId = parseInt(newsId)

    try {
      loadCommentsFromLocalStorage()

      $logger.debug(`Починаємо завантаження коментарів для новини ID: ${parsedNewsId}`)
      const startTime = performance.now()

      const response = await $fetch(`/api/comments/${parsedNewsId}`)

      $logger.logPerformance(`Отримання коментарів для новини ID: ${parsedNewsId}`, startTime)

      const localComments = comments.value.filter(c =>
        c.newsId === parsedNewsId && c.isLocalComment === true
      )

      comments.value = comments.value.filter(c =>
        c.newsId !== parsedNewsId || c.isLocalComment === true
      )

      if (Array.isArray(response)) {
        comments.value.push(...response)
      }

      $logger.info(`Завантажено ${Array.isArray(response) ? response.length : 0} коментарів, для новини ID: ${parsedNewsId} з API та ${localComments.length} локальних коментарів`)

      saveCommentsToLocalStorage()

      return getCommentsByNewsId.value(parsedNewsId)
    } catch (err) {
      $logger.logError(err, { context: `завантаження коментарів для новини ID: ${parsedNewsId}` })
      error.value = typeof err === 'string' ? err : err.message || 'Помилка завантаження коментарів'

      return getCommentsByNewsId.value(parsedNewsId)
    } finally {
      loading.value = false
    }
  }

  function addComment (comment) {
    const existingComment = comments.value.find(c => c.id === comment.id)
    if (existingComment) {
      return
    }

    comments.value.push(comment)
    $logger.debug(`Додано новий коментар ID: ${comment.id} для новини ID: ${comment.newsId}`, { comment })

    saveCommentsToLocalStorage()
  }

  async function postComment (newsId, commentData) {
    try {
      loading.value = true
      error.value = null
      const startTime = performance.now()

      $logger.logUserAction('Відправка коментаря', {
        newsId,
        contentLength: commentData.content.length
      })

      // const response = await $fetch('/api/comments/add', {
      //   method: 'POST',
      //   body: {
      //     newsId: parseInt(newsId),
      //     author: commentData.author || 'Користувач',
      //     avatarUrl: commentData.avatarUrl,
      //     content: commentData.content
      //   }
      // })

      // if (response.error) {
      //   throw new Error(response.message || 'Помилка при додаванні коментаря')
      // }

      // addComment({
      //   ...response,
      //   isUserComment: true
      // })

      const localComment = {
        id: Date.now(),
        newsId: parseInt(newsId),
        author: commentData.author,
        avatarUrl: commentData.avatarUrl,
        content: commentData.content,
        createdAt: new Date().toISOString(),
        formattedDate: formatDate(new Date()),
        likes: 0,
        isUserComment: true,
        isLocalComment: true
      }

      addComment(localComment)
      $logger.info(`Створено локальний коментар для новини ID: ${newsId}`, { commentId: localComment.id })
      $logger.logPerformance(`Створення коментаря для новини ID: ${newsId}`, startTime)

      return localComment

    } catch (err) {
      $logger.logError(err, { context: `відправка коментаря для новини ID: ${newsId}` })
      error.value = typeof err === 'string' ? err : err.message || 'Помилка відправки коментаря'
      throw err
    } finally {
      loading.value = false
    }
  }

  function handleNewComment (comment) {
    if (!comment || !comment.id || !comment.newsId) {
      $logger.warn('Отримано неправильний формат коментаря', { comment })
      return
    }

    const realtimeComment = {
      ...comment,
      isRealtime: true
    }

    addComment(realtimeComment)
  }

  function formatDate (date) {
    try {
      const d = new Date(date)
      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear()
      return `${day}.${month}.${year}`
    } catch (e) {
      $logger.warn('Помилка форматування дати', { date, error: e })
      return ''
    }
  }

  return {
    comments,
    loading,
    error,
    currentNewsId,
    getCommentsByNewsId,
    getCommentsCount,
    getCurrentNewsComments,
    fetchCommentsByNewsId,
    addComment,
    postComment,
    handleNewComment,
    loadCommentsFromLocalStorage,
    saveCommentsToLocalStorage
  }
})
