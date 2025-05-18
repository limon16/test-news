import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCommentsStore = defineStore('comments', () => {
  const comments = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentNewsId = ref(null)

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

  function setCurrentNewsId (newsId) {
    currentNewsId.value = parseInt(newsId)
  }

  async function fetchCommentsByNewsId (newsId) {
    loading.value = true
    error.value = null
    const parsedNewsId = parseInt(newsId)

    try {
      const response = await $fetch(`/api/comments/${parsedNewsId}`)

      comments.value = comments.value.filter(c => c.newsId !== parsedNewsId)

      if (Array.isArray(response)) {
        comments.value.push(...response)
      }

      console.log(`[CommentsStore] Завантажено ${Array.isArray(response) ? response.length : 0} коментарів для новини ID:${parsedNewsId}`)

      return getCommentsByNewsId.value(parsedNewsId)
    } catch (err) {
      console.error(`[CommentsStore] Помилка завантаження коментарів для новини ID:${parsedNewsId}:`, err)
      error.value = typeof err === 'string' ? err : err.message || 'Помилка завантаження коментарів'
      return []
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
    console.log(`[CommentsStore] Додано новий коментар ID:${comment.id} для новини ID:${comment.newsId}`)
  }

  async function postComment (newsId, commentData) {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch('/api/comments/add', {
        method: 'POST',
        body: {
          newsId: parseInt(newsId),
          author: commentData.author || 'Користувач',
          avatarUrl: commentData.avatarUrl,
          content: commentData.content
        }
      })

      if (response.error) {
        throw new Error(response.message || 'Помилка при додаванні коментаря')
      }

      addComment({
        ...response,
        isUserComment: true
      })

      console.log(`[CommentsStore] Відправлено новий коментар для новини ID:${newsId}`, response)

      return response
    } catch (err) {
      console.error(`[CommentsStore] Помилка відправки коментаря для новини ID:${newsId}:`, err)
      error.value = typeof err === 'string' ? err : err.message || 'Помилка відправки коментаря'
      throw err
    } finally {
      loading.value = false
    }
  }

  function handleNewComment (comment) {
    if (!comment || !comment.id || !comment.newsId) {
      console.warn('[CommentsStore] Отримано неправильний формат коментаря:', comment)
      return
    }

    const realtimeComment = {
      ...comment,
      isRealtime: true
    }

    addComment(realtimeComment)
  }

  return {
    comments,
    loading,
    error,
    currentNewsId,
    getCommentsByNewsId,
    getCommentsCount,
    getCurrentNewsComments,
    setCurrentNewsId,
    fetchCommentsByNewsId,
    addComment,
    postComment,
    handleNewComment
  }
})
