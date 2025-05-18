<template>
	<div class="flex flex-col min-h-[100vh]">
		<header class="bg-white shadow-sm">
			<div class="container mx-auto px-4 py-4 flex justify-between items-center">
				<NuxtLink to="/" class="text-2xl font-bold text-indigo-600">NuxtNews</NuxtLink>
				<ClientOnly>
				<nav class="flex items-center gap-4">
						<div v-if="!isDefinitelyLoggedIn" class="flex items-center h-[32px]">
							<NuxtLink to="/auth">
								<button class="cursor-pointer px-4 h-[32px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
									Увійти
								</button>
							</NuxtLink>
						</div>

						<div v-else ref="dropdownContainer" class="relative">
							<button
									class="flex items-center space-x-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
									@click="showDropdown = !showDropdown"
							>

								<div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center overflow-hidden">
									<NuxtImg
											v-if="authStore.userAvatar"
											:src="authStore.userAvatar"
											:alt="authStore.username"
											class="w-full h-full object-cover rounded-full"
											width="120"
											height="120"
											placeholder
											format="webp"
											quality="85"
											loading="eager"
											fetchpriority="high"
									/>
									<span v-else>{{ authStore.username ? authStore.username.charAt(0).toUpperCase() : 'У' }}</span>
								</div>
								<span>{{ authStore.username }}</span>
								<NuxtIcon name="chevron-down" class="h-5 w-5 text-gray-400" />
							</button>
							<div v-if="showDropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
								<NuxtLink to="#" class="cursor-not-allowed block px-4 py-2 text-sm text-gray-700" @click="showDropdown = false">
									<div class="flex items-center">
										<NuxtIcon name="heroicons:user" class="h-5 w-5 mr-2 text-gray-500" />
										Профіль
									</div>
								</NuxtLink>
								<NuxtLink to="#" class="cursor-not-allowed block px-4 py-2 text-sm text-gray-700" @click="showDropdown = false">
									<div class="flex items-center">
										<NuxtIcon name="heroicons:cog-6-tooth" class="h-5 w-5 mr-2 text-gray-500" />
										Налаштування
									</div>
								</NuxtLink>
								<button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" @click="handleLogout">
									<div class="flex items-center">
										<NuxtIcon name="heroicons:arrow-right-on-rectangle" class="h-5 w-5 mr-2 text-gray-500" />
										Вийти
									</div>
								</button>
							</div>
						</div>
				</nav>
					</ClientOnly>
			</div>
		</header>

		<main class="flex-1 container mx-auto px-4 py-8 min-h-[600px]">
			<slot />
		</main>

		<footer class="bg-gray-100 py-8">
			<div class="container mx-auto px-4">
				<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div>
						<h3 class="text-lg font-semibold mb-4">NuxtNews</h3>
						<p class="text-gray-600">
							Тестовий застосунок з новинами та коментарями, розроблений на Nuxt 3.
						</p>
					</div>
					<div>
						<h3 class="text-lg font-semibold mb-4">Категорії</h3>
						<ul class="space-y-2 min-h-[140px]">
							<template v-if="!isLoading && newsStore.categories?.length">
								<li v-for="category in newsStore.categories" :key="category">
									<a
											href="#"
											class="text-gray-600 hover:text-indigo-600"
											@click.prevent="handleCategoryFilter(category)"
									>
										{{ category }}
									</a>
								</li>
							</template>
							<template v-else>
								<li v-for="i in 5" :key="i" class="block h-6 w-24 rounded bg-gray-200 animate-pulse"/>
							</template>
						</ul>
					</div>
					<div>
						<h3 class="text-lg font-semibold mb-4">Теги</h3>
						<div class="flex flex-wrap gap-2 min-h-[56px]">
							<template v-if="!isLoading && newsStore.tags?.length">
								<span
										v-for="tag in newsStore.tags?.slice(0, 8) || []"
										:key="tag"
										class="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full cursor-pointer hover:bg-indigo-100 hover:text-indigo-800"
										@click="handleTagFilter(tag)"
								>
									{{ tag }}
								</span>
							</template>
							<template v-else>
								<span
										v-for="i in 8"
										:key="i"
										class="block inline-block h-6 rounded-full bg-gray-200 animate-pulse"
										:class="{ 'w-16': i % 3 === 0, 'w-20': i % 3 === 1, 'w-12': i % 3 === 2 }"
								/>
							</template>
						</div>
					</div>
					<div>
						<h3 class="text-lg font-semibold mb-4">Про проект</h3>
						<p class="text-gray-600">
							Демонстрація сучасних підходів Nuxt 3: управління станом через Pinia,
							імітація API за допомогою локальних JSON-файлів та веб-сокетів.
						</p>
					</div>
				</div>
				<div class="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
					<p>&copy; {{ new Date().getFullYear() }} NuxtNews. Всі права захищено.</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useNewsStore } from '../stores/news'
import { ref, computed, onMounted, onUnmounted } from 'vue'

const authStore = useAuthStore()
const newsStore = useNewsStore()
const { $logger } = useNuxtApp()
const { goHomeAndScroll } = useGoHomeAndScroll()

const showDropdown = ref(false)
const dropdownContainer = ref(null)
const isLoading = ref(true)

const isDefinitelyLoggedIn = computed(() => {
  return authStore.isLoggedIn === true &&
			authStore.token !== null &&
			authStore.user !== null
})

const handleClickOutside = (event) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted( () => {
  document.addEventListener('click', handleClickOutside)
  initializeApp()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

async function initializeApp () {
  if (import.meta.client) {
	  $logger.info('App initialization started')
    authStore.initAuth()
    await loadData()
  }
}

async function loadData () {
  isLoading.value = true
  $logger.debug('Starting to load categories and tags data')
  try {
    if (!newsStore.categories?.length || !newsStore.tags?.length) {
      await newsStore.fetchAllNews()
	    $logger.info('Successfully loaded categories and tags data')
    }
  } catch (error) {
	  $logger.logError(error, { context: 'loading categories/tags in default layout' })
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 500)
  }
}

function handleCategoryFilter (category) {
  newsStore.setCategory(category)
  newsStore.setSearchQuery('')
  goHomeAndScroll()
}

function handleTagFilter (tag) {
  newsStore.setTag(tag)
  newsStore.setSearchQuery('')
  goHomeAndScroll()
}

function handleLogout () {
  $logger.logUserAction('logout')
  authStore.logout()
  showDropdown.value = false
  goHomeAndScroll()
}

await newsStore.fetchAllNews()
</script>

<style scoped>
@keyframes pulse {
	0%, 100% {
		opacity: 0.5;
	}
	50% {
		opacity: 0.8;
	}
}

.animate-pulse {
	animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

ul .skeleton-item:nth-child(1) { width: 90px; }
ul .skeleton-item:nth-child(2) { width: 120px; }
ul .skeleton-item:nth-child(3) { width: 80px; }
ul .skeleton-item:nth-child(4) { width: 110px; }
ul .skeleton-item:nth-child(5) { width: 100px; }
</style>
