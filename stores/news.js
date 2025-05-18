// stores/news.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useNuxtApp } from '#app'

export const useNewsStore = defineStore('news', () => {
  const allNewsList = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { $logger } = useNuxtApp()

  const searchQuery = ref('')
  const selectedCategory = ref('')
  const selectedTag = ref('')
  const sortBy = ref('publishedAt')
  const sortOrder = ref('desc')
  const currentPage = ref(1)
  const itemsPerPage = ref(10)

  const filteredNews = computed(() => {
    let filtered = [...allNewsList.value]

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        (item.content && item.content.toLowerCase().includes(query))
      )
      $logger.debug('Filtering by search query', {
        query: searchQuery.value,
        resultsCount: filtered.length
      })
    }

    if (selectedCategory.value) {
      filtered = filtered.filter(item => item.category === selectedCategory.value)
      $logger.debug('Filtering by category', {
        category: selectedCategory.value,
        resultsCount: filtered.length
      })
    }

    if (selectedTag.value) {
      filtered = filtered.filter(item =>
        item.tags && Array.isArray(item.tags) && item.tags.includes(selectedTag.value)
      )
      $logger.debug('Filtering by tag', {
        tag: selectedTag.value,
        resultsCount: filtered.length
      })
    }

    return filtered
  })

  const sortedNews = computed(() => {
    const sorted = [...filteredNews.value]

    $logger.debug('Sorting news', {
      by: sortBy.value,
      order: sortOrder.value,
      itemsCount: sorted.length
    })

    sorted.sort((a, b) => {
      let valueA, valueB

      if (sortBy.value === 'publishedAt') {
        valueA = new Date(a.publishedAt || 0).getTime()
        valueB = new Date(b.publishedAt || 0).getTime()
        if (isNaN(valueA) || isNaN(valueB)) return 0
      } else if (sortBy.value === 'views') {
        valueA = a.views || 0
        valueB = b.views || 0
      } else if (sortBy.value === 'title') {
        valueA = a.title?.toLowerCase() || ''
        valueB = b.title?.toLowerCase() || ''
        return sortOrder.value === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA)
      } else {
        valueA = a[sortBy.value] || 0
        valueB = b[sortBy.value] || 0
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortOrder.value === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA)
        }
      }

      return sortOrder.value === 'asc' ? valueA - valueB : valueB - valueA
    })

    return sorted
  })

  const total = computed(() => filteredNews.value.length)

  const news = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value

    const paginatedResults = itemsPerPage.value > 0
      ? sortedNews.value.slice(start, end)
      : sortedNews.value

    $logger.debug('Paginating news', {
      page: currentPage.value,
      itemsPerPage: itemsPerPage.value,
      start,
      end,
      resultsCount: paginatedResults.length
    })

    return paginatedResults
  })

  const totalPages = computed(() =>
    Math.ceil(total.value / itemsPerPage.value)
  )

  const categories = computed(() => {
    const set = new Set()
    allNewsList.value.forEach(item => {
      if (item.category) set.add(item.category)
    })
    return Array.from(set).sort()
  })

  const tags = computed(() => {
    const set = new Set()
    allNewsList.value.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => set.add(tag))
      }
    })
    return Array.from(set).sort()
  })

  const hasFilters = computed(() =>
    searchQuery.value !== '' ||
    selectedCategory.value !== '' ||
    selectedTag.value !== ''
  )

  const popularNews = computed(() =>
    [...allNewsList.value]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
  )

  const featuredNews = computed(() =>
    allNewsList.value.filter(item => item.featured).slice(0, 3)
  )

  /**
   * Завантаження всіх новин
   */
  async function fetchAllNews (forceRefresh = false) {
    if (loading.value || (allNewsList.value.length > 0 && !forceRefresh)) {
      $logger.debug('Skipping fetchAllNews', {
        isLoading: loading.value,
        currentNewsCount: allNewsList.value.length,
        forceRefresh
      })
      return
    }

    loading.value = true
    error.value = null

    $logger.info('Fetching all news')

    try {
      const { data, pending, error: fetchError } = await useFetch('/api/news')

      loading.value = pending.value

      if (fetchError.value) {
        error.value = fetchError.value.message || 'Помилка завантаження'
        $logger.error('Failed to fetch news', { error: error.value })
        allNewsList.value = []
        return
      }

      if (data.value && Array.isArray(data.value)) {
        allNewsList.value = data.value
        $logger.info('News loaded successfully', { count: data.value.length })
      } else {
        error.value = 'Отримано дані в неочікуваному форматі'
        $logger.error('Invalid news data format', {
          dataType: data.value ? typeof data.value : 'null/undefined',
          isArray: data.value ? Array.isArray(data.value) : false
        })
        allNewsList.value = []
      }
    } catch (e) {
      error.value = e.message || 'Помилка при завантаженні новин'
      $logger.error('Error fetching news', {
        error: e,
        message: e.message
      })
      allNewsList.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Завантаження окремої новини за ID або slug
   */
  async function fetchNewsItemByIdOrSlug (idOrSlug) {
    if (!idOrSlug) {
      $logger.warn('fetchNewsItemByIdOrSlug called without ID or slug')
      return null
    }

    loading.value = true
    error.value = null

    $logger.debug('Fetching news item', { idOrSlug })

    try {
      if (allNewsList.value.length > 0) {
        const cachedItem = allNewsList.value.find(
          n => n.slug === idOrSlug || String(n.id) === String(idOrSlug)
        )

        if (cachedItem) {
          $logger.debug('Found news item in cache', {
            id: cachedItem.id,
            slug: cachedItem.slug
          })
          loading.value = false
          return cachedItem
        }
      }

      const { data, error: fetchError } = await useFetch(`/api/news/${idOrSlug}`)

      if (fetchError.value) {
        error.value = fetchError.value.message || 'Помилка завантаження'
        $logger.error('Failed to fetch news item', {
          idOrSlug,
          error: error.value
        })
        loading.value = false
        return null
      }

      if (!data.value) {
        $logger.warn('News item not found', { idOrSlug })
        loading.value = false
        return null
      }

      const existingIndex = allNewsList.value.findIndex(
        item => item.id === data.value.id || item.slug === data.value.slug
      )

      if (existingIndex !== -1) {
        $logger.debug('Updating existing news item in cache', {
          id: data.value.id,
          slug: data.value.slug
        })
        allNewsList.value[existingIndex] = data.value
      } else {
        $logger.debug('Adding new news item to cache', {
          id: data.value.id,
          slug: data.value.slug
        })
        allNewsList.value.push(data.value)
      }

      loading.value = false
      return data.value
    } catch (e) {
      error.value = e.message || 'Помилка при завантаженні новини'
      $logger.error('Error fetching news item', {
        idOrSlug,
        error: e,
        message: e.message
      })
      loading.value = false
      return null
    }
  }

  /**
   * Встановлення пошукового запиту
   */
  function setSearchQuery (query) {
    $logger.debug('Setting search query', {
      previousQuery: searchQuery.value,
      newQuery: query
    })
    searchQuery.value = query
    currentPage.value = 1
  }

  /**
   * Встановлення категорії
   */
  function setCategory (category) {
    $logger.debug('Setting category', {
      previousCategory: selectedCategory.value,
      newCategory: category
    })
    selectedCategory.value = category
    selectedTag.value = ''
    currentPage.value = 1
  }

  /**
   * Встановлення тегу
   */
  function setTag (tag) {
    $logger.debug('Setting tag', {
      previousTag: selectedTag.value,
      newTag: tag
    })
    selectedTag.value = tag
    selectedCategory.value = ''
    currentPage.value = 1
  }

  /**
   * Встановлення параметрів сортування
   */
  function setSorting (by, order) {
    $logger.debug('Setting sorting', {
      previousBy: sortBy.value,
      newBy: by,
      previousOrder: sortOrder.value,
      newOrder: order
    })

    if (by !== undefined) sortBy.value = by
    if (order !== undefined) sortOrder.value = order
    currentPage.value = 1
  }

  /**
   * Перехід на вказану сторінку
   */
  function goToPage (page) {
    if (page >= 1 && page <= totalPages.value) {
      $logger.debug('Changing page', {
        fromPage: currentPage.value,
        toPage: page,
        totalPages: totalPages.value
      })
      currentPage.value = page
    } else {
      $logger.warn('Invalid page number', {
        requestedPage: page,
        totalPages: totalPages.value
      })
    }
  }

  /**
   * Скидання всіх фільтрів
   */
  function resetFilters () {
    $logger.debug('Resetting all filters', {
      hadFilters: hasFilters.value,
      previousSearchQuery: searchQuery.value,
      previousCategory: selectedCategory.value,
      previousTag: selectedTag.value
    })

    searchQuery.value = ''
    selectedCategory.value = ''
    selectedTag.value = ''
    currentPage.value = 1
  }

  return {
    loading,
    error,
    searchQuery,
    selectedCategory,
    selectedTag,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
    news,
    total,
    categories,
    tags,
    totalPages,
    hasFilters,
    popularNews,
    featuredNews,
    fetchAllNews,
    fetchNewsItemByIdOrSlug,
    setSearchQuery,
    setCategory,
    setTag,
    setSorting,
    goToPage,
    resetFilters
  }
})
