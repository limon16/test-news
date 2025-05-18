import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'

export const useCommentsStore = defineStore('comments', () => {
  const comments = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentNewsId = ref(null)

  // Ініціалізація: завантаження коментарів з localStorage
  onMounted(() => {
    loadCommentsFromLocalStorage()
  })

  // Функція для завантаження коментарів з localStorage
  function loadCommentsFromLocalStorage () {
    if (import.meta.client) {
      try {
        const savedComments = localStorage.getItem('nuxt-news-comments')
        if (savedComments) {
          const localComments = JSON.parse(savedComments)

          // Перевіряємо, щоб не додавати дублікати
          const existingIds = comments.value.map(c => c.id)
          const newComments = localComments.filter(c => !existingIds.includes(c.id))

          if (newComments.length > 0) {
            comments.value.push(...newComments)
            console.log(`[CommentsStore] Завантажено ${newComments.length} коментарів з localStorage`)
          }
        }
      } catch (err) {
        console.error('[CommentsStore] Помилка завантаження коментарів з localStorage:', err)
      }
    }
  }

  // Функція для збереження коментарів у localStorage
  function saveCommentsToLocalStorage () {
    if (import.meta.client) {
      try {
        localStorage.setItem('nuxt-news-comments', JSON.stringify(comments.value))
      } catch (err) {
        console.error('[CommentsStore] Помилка збереження коментарів у localStorage:', err)
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

  function setCurrentNewsId (newsId) {
    currentNewsId.value = parseInt(newsId)
  }

  async function fetchCommentsByNewsId (newsId) {
    loading.value = true
    error.value = null
    const parsedNewsId = parseInt(newsId)

    try {
      // Спочатку завантажуємо коментарі з localStorage, якщо їх ще немає
      loadCommentsFromLocalStorage()

      // Спроба отримати коментарі з API
      const response = await $fetch(`/api/comments/${parsedNewsId}`)

      // Видаляємо старі коментарі для цієї новини з API (але зберігаємо локальні)
      const localComments = comments.value.filter(c =>
        c.newsId === parsedNewsId && c.isLocalComment === true
      )

      comments.value = comments.value.filter(c =>
        c.newsId !== parsedNewsId || c.isLocalComment === true
      )

      // Додаємо нові коментарі з API
      if (Array.isArray(response)) {
        comments.value.push(...response)
      }

      console.log(`[CommentsStore] Завантажено ${Array.isArray(response) ? response.length : 0} коментарів для новини ID:${parsedNewsId} з API та ${localComments.length} локальних коментарів`)

      // Зберігаємо оновлені коментарі в localStorage
      saveCommentsToLocalStorage()

      return getCommentsByNewsId.value(parsedNewsId)
    } catch (err) {
      console.error(`[CommentsStore] Помилка завантаження коментарів для новини ID:${parsedNewsId}:`, err)
      error.value = typeof err === 'string' ? err : err.message || 'Помилка завантаження коментарів'

      // Якщо запит не вдався, повертаємо локальні коментарі, якщо вони є
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
    console.log(`[CommentsStore] Додано новий коментар ID:${comment.id} для новини ID:${comment.newsId}`)

    // Зберігаємо коментарі в localStorage після додавання нового
    saveCommentsToLocalStorage()
  }

  async function postComment (newsId, commentData) {
    try {
      loading.value = true
      error.value = null
      // Спроба відправити коментар на сервер
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

      //
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
      console.log(`[CommentsStore] Створено локальний коментар для новини ID:${newsId}`, localComment)

      return localComment

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

  // Допоміжна функція для форматування дати
  function formatDate (date) {
    try {
      const d = new Date(date)
      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear()
      return `${day}.${month}.${year}`
    } catch (e) {
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
    setCurrentNewsId,
    fetchCommentsByNewsId,
    addComment,
    postComment,
    handleNewComment,
    loadCommentsFromLocalStorage,
    saveCommentsToLocalStorage
  }
})
