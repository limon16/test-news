<template>
	<div class="container mx-auto p-4">
		<h1 class="text-3xl font-bold mb-6 text-center">Останні новини</h1>
		<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
			<div class="relative w-full md:w-96">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<Icon name="uil:search" class="h-5 w-5 text-gray-400" />
				</div>
				<input
						v-model="searchQuery"
						type="text"
						placeholder="Пошук новин..."
						class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						@input="handleSearchInput"
						@keyup.enter="handleSearchEnter"
				>
			</div>
			<div class="flex items-center gap-2 w-full md:w-auto">
				<div class="relative w-full md:w-48">
					<select
							v-model="selectedCategory"
							class="block w-full pl-3 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							@change="handleCategoryChange"
					>
						<option value="">Всі категорії</option>
						<option v-for="category in categories" :key="category" :value="category">
							{{ category }}
						</option>
					</select>
				</div>
				<button
						v-if="hasFilters"
						class="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none"
						title="Скинути фільтри"
						@click="resetFilters"
				>
					<Icon name="uil:times" class="h-4 w-4" />
				</button>
				<SortDropdown :initial-sort-by="sortBy" :initial-sort-order="sortOrder" @sort="handleSort" />
			</div>
		</div>
		<div v-if="hasFilters" class="flex flex-wrap gap-2 mb-4">
			<div v-if="searchQuery" class="inline-flex items-center px-2 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
				<span class="mr-1">Пошук: {{ searchQuery }}</span>
				<button class="focus:outline-none" @click="clearSearch">
					<Icon name="uil:times" class="h-4 w-4" />
				</button>
			</div>
			<div v-if="selectedCategory" class="inline-flex items-center px-2 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
				<span class="mr-1">Категорія: {{ selectedCategory }}</span>
				<button class="focus:outline-none" @click="clearCategory">
					<Icon name="uil:times" class="h-4 w-4" />
				</button>
			</div>
			<div v-if="selectedTag" class="inline-flex items-center px-2 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
				<span class="mr-1">Тег: {{ selectedTag }}</span>
				<button class="focus:outline-none" @click="clearTag">
					<NuxtIcon name="heroicons:x-mark" class="h-4 w-4" />
				</button>
			</div>
		</div>
		<div v-if="loading" class="text-blue-600 text-center py-8">Завантаження новин...</div>
		<div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
			<strong class="font-bold">Помилка!</strong>
			<span class="block sm:inline"> {{ error }}</span>
		</div>
		<EmptyResults
				v-else-if="!loading && total === 0 && hasFilters"
				@reset="resetFilters"
		/>
		<div v-else-if="!loading && total === 0 && !hasFilters">
			<p class="text-gray-500 text-center py-8">Немає жодної новини.</p>
		</div>
		<NewsList
				v-else
				:news-list="news"
				@category-selected="handleCategorySelected"
				@tag-selected="handleTagSelected"
		/>
		<p class="mb-4 text-center text-gray-600">Всього знайдено: {{ total }}</p>
		<div v-if="totalPages > 1" class="mt-8 flex justify-center">
			<div class="flex space-x-1">
				<button
						:disabled="currentPage === 1"
						:class="[
						'px-4 py-2 rounded-md',
						currentPage === 1
						? 'bg-gray-100 text-gray-400 cursor-not-allowed'
						: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					]"
						@click="prevPage"
				>
					<Icon name="uil:arrow-left" class="h-5 w-5" />
				</button>
				<button
						v-for="page in paginationItems"
						:key="page.value"
						:class="[
						'px-4 py-2 rounded-md',
						page.type === 'dots' ? 'text-gray-500 cursor-default' : '',
						page.type === 'page' && page.value === currentPage
						? 'bg-indigo-600 text-white'
						: page.type === 'page' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : ''
					]"
						@click="page.type === 'page' ? goToPage(page.value) : null"
				>
					{{ page.type === 'dots' ? '...' : page.value }}
				</button>
				<button
						:disabled="currentPage === totalPages"
						:class="[
						'px-4 py-2 rounded-md',
						currentPage === totalPages
						? 'bg-gray-100 text-gray-400 cursor-not-allowed'
						: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					]"
						@click="nextPage"
				>
					<Icon name="uil:arrow-right" class="h-5 w-5" />
				</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useNewsStore } from '~/stores/news'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import EmptyResults from '../components/newsSection/EmptyResults.vue'
import NewsList from '../components/newsSection/NewsList.vue'
import SortDropdown from '../components/newsSection/SortDropdown.vue'

definePageMeta({
  layout: 'default'
})

const store = useNewsStore()
const { $logger } = useNuxtApp()

const {
  loading,
  error,
  searchQuery,
  selectedCategory,
  selectedTag,
  sortBy,
  sortOrder,
  currentPage,
  news,
  total,
  categories,
  totalPages,
  hasFilters
} = storeToRefs(store)

const {
  setSearchQuery: storeSetSearchQuery,
  setCategory: storeSetCategory,
  setTag: storeSetTag,
  setSorting: storeSetSorting,
  goToPage: storeGoToPage,
  resetFilters: storeResetFilters
} = store

const paginationItems = computed(() => {
  const pages = []
  const maxVisiblePages = 5
  const safeTotalPages = totalPages.value && !isNaN(totalPages.value) ? totalPages.value : 0
  if (safeTotalPages <= 1) return []
  if (safeTotalPages <= maxVisiblePages) {
    for (let i = 1; i <= safeTotalPages; i++) {
      pages.push({ type: 'page', value: i })
    }
  } else {
    pages.push({ type: 'page', value: 1 })
    let startPage = Math.max(2, currentPage.value - 1)
    let endPage = Math.min(safeTotalPages - 1, currentPage.value + 1)
    if (endPage - startPage < 2) {
      if (startPage === 2) {
        endPage = Math.min(safeTotalPages - 1, startPage + 2)
      } else if (endPage === safeTotalPages - 1) {
        startPage = Math.max(2, endPage - 2)
      }
    }
    if (startPage > 2) {
      pages.push({ type: 'dots', value: null })
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push({ type: 'page', value: i })
    }
    if (endPage < safeTotalPages - 1) {
      pages.push({ type: 'dots', value: null })
    }
    pages.push({ type: 'page', value: safeTotalPages })
  }
  return pages
})

function handleSearchInput () {
  storeSetSearchQuery(searchQuery.value.trim())
  $logger.logUserAction('search_input', { query: searchQuery.value.trim() })
}
function handleSearchEnter () {}
function clearSearch () {
  storeSetSearchQuery('')
}
function handleCategoryChange () {
  storeSetCategory(selectedCategory.value)
  $logger.logUserAction('category_change', { category: selectedCategory.value })
}
function clearCategory () {
  storeSetCategory('')
}
function handleCategorySelected (category) {
  storeSetCategory(category)
}
function handleTagSelected (tag) {
  storeSetTag(tag)
}
function clearTag () {
  storeSetTag('')
}
function resetFilters () {
  storeResetFilters()
  $logger.logUserAction('reset_filters')
}
function handleSort ({ by, order }) {
  storeSetSorting(by, order)
  $logger.logUserAction('sort_change', { by, order })
}
function goToPage (page) {
  storeGoToPage(page)
  $logger.logUserAction('pagination', { page })
}
function prevPage () {
  storeGoToPage(currentPage.value - 1)
}
function nextPage () {
  storeGoToPage(currentPage.value + 1)
}
</script>
