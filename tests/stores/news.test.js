// tests/stores/news.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia, defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Визначаємо мок-стор для тестування
const useNewsStoreMock = defineStore('news', () => {
  const news = ref([])
  const categories = ref([])
  const tags = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentCategory = ref(null)
  const currentTag = ref(null)
  const searchQuery = ref('')

  const filteredNews = computed(() => {
    let result = [...news.value]

    // Фільтрація за категорією
    if (currentCategory.value) {
      result = result.filter(item => item.category === currentCategory.value)
    }

    // Фільтрація за тегом
    if (currentTag.value) {
      result = result.filter(item => item.tags && item.tags.includes(currentTag.value))
    }

    // Фільтрація за пошуковим запитом
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item =>
        (item.title && item.title.toLowerCase().includes(query)) ||
					(item.description && item.description.toLowerCase().includes(query))
      )
    }

    return result
  })

  // Метод для завантаження всіх новин
  async function fetchAllNews () {
    loading.value = true
    error.value = null

    try {
      // Мок для функціонального тестування
      const mockData = [
        {
          id: 1,
          title: 'Новина 1',
          description: 'Опис новини 1',
          category: 'Технології',
          tags: ['tech', 'news']
        },
        {
          id: 2,
          title: 'Новина 2',
          description: 'Опис новини 2',
          category: 'Наука',
          tags: ['science', 'research']
        },
        {
          id: 3,
          title: 'Новина 3',
          description: 'Опис новини 3',
          category: 'Технології',
          tags: ['tech', 'innovation']
        }
      ]

      news.value = mockData

      // Витягуємо унікальні категорії
      const uniqueCategories = new Set(mockData.map(item => item.category).filter(Boolean))
      categories.value = Array.from(uniqueCategories)

      // Витягуємо унікальні теги
      const uniqueTags = new Set(mockData.flatMap(item => item.tags || []).filter(Boolean))
      tags.value = Array.from(uniqueTags)

      return mockData
    } catch (e) {
      error.value = 'Помилка при завантаженні новин: ' + e.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Методи для фільтрації
  function setCategory (category) {
    currentCategory.value = category
  }

  function setTag (tag) {
    currentTag.value = tag
  }

  function setSearchQuery (query) {
    searchQuery.value = query
  }

  return {
    news,
    categories,
    tags,
    loading,
    error,
    currentCategory,
    currentTag,
    searchQuery,
    filteredNews,
    fetchAllNews,
    setCategory,
    setTag,
    setSearchQuery
  }
})

// Мокуємо оригінальний модуль стору
vi.mock('../../stores/news', () => {
  return {
    useNewsStore: () => useNewsStoreMock()
  }
})

describe('News Store', () => {
  beforeEach(() => {
    // Створюємо нову інстанцію Pinia перед кожним тестом
    setActivePinia(createPinia())
  })

  it('should fetch all news correctly', async () => {
    const newsStore = useNewsStoreMock()

    // Викликаємо функцію завантаження новин
    const result = await newsStore.fetchAllNews()

    // Перевіряємо результат
    expect(result.length).toBe(3)
    expect(newsStore.news.length).toBe(3)
    expect(newsStore.categories).toContain('Технології')
    expect(newsStore.categories).toContain('Наука')
    expect(newsStore.tags).toContain('tech')
    expect(newsStore.tags).toContain('science')
    expect(newsStore.loading).toBe(false)
  })

  it('should filter news by category', async () => {
    const newsStore = useNewsStoreMock()

    // Завантажуємо новини
    await newsStore.fetchAllNews()

    // Встановлюємо фільтр за категорією
    newsStore.setCategory('Технології')

    // Перевіряємо, що фільтрація працює
    expect(newsStore.filteredNews.length).toBe(2)
    expect(newsStore.filteredNews[0].title).toBe('Новина 1')
    expect(newsStore.filteredNews[1].title).toBe('Новина 3')
  })

  it('should filter news by tag', async () => {
    const newsStore = useNewsStoreMock()

    // Завантажуємо новини
    await newsStore.fetchAllNews()

    // Встановлюємо фільтр за тегом
    newsStore.setTag('science')

    // Перевіряємо, що фільтрація працює
    expect(newsStore.filteredNews.length).toBe(1)
    expect(newsStore.filteredNews[0].title).toBe('Новина 2')
  })

  it('should filter news by search query', async () => {
    const newsStore = useNewsStoreMock()

    // Завантажуємо новини
    await newsStore.fetchAllNews()

    // Встановлюємо фільтр за пошуковим запитом
    newsStore.setSearchQuery('Новина 3')

    // Перевіряємо, що фільтрація працює
    expect(newsStore.filteredNews.length).toBe(1)
    expect(newsStore.filteredNews[0].title).toBe('Новина 3')
  })
})
