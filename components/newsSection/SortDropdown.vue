<template>
	<div ref="sortDropdownRef" class="relative">
		<button
				class="flex items-center space-x-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
				@click="showSortOptions = !showSortOptions"
		>
			<Icon name="uil:sort" class="h-4 w-4" />
			<span>Сортувати</span>
		</button>

		<div
				v-if="showSortOptions"
				class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
		>
			<div class="py-1">
				<button
						class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						@click="handleSort('publishedAt', 'desc')"
				>
					За датою: спочатку нові
				</button>
				<button
						class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						@click="handleSort('publishedAt', 'asc')"
				>
					За датою: спочатку старі
				</button>
				<button
						class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						@click="handleSort('views', 'desc')"
				>
					За популярністю
				</button>
				<button
						class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						@click="handleSort('title', 'asc')"
				>
					За назвою: А-Я
				</button>
				<button
						class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						@click="handleSort('title', 'desc')"
				>
					За назвою: Я-А
				</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['sort'])
const showSortOptions = ref(false)
const sortDropdownRef = ref(null)

function handleClickOutside (e) {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(e.target)) {
    showSortOptions.value = false
  }
}

function handleSort (by, order) {
  emit('sort', { by, order })
  showSortOptions.value = false

  try {
    const { $logger } = useNuxtApp()
    if ($logger) $logger.logUserAction('sort', { by, order })
  } catch (e) {
    console.log('Sort action:', { by, order })
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
