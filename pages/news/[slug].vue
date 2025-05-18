<template>
	<div class="container mx-auto p-4">
		<div class="mb-6">
			<NuxtLink to="/" class="inline-flex items-center text-indigo-600 hover:text-indigo-800">
				<Icon name="uil:arrow-left" class="h-5 w-5 mr-1"/>
				Назад до списку
			</NuxtLink>
		</div>

		<div v-if="loading" class="text-blue-600 text-center py-16">
			Завантаження новини...
		</div>

		<div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
			<strong class="font-bold">Помилка!</strong>
			<span class="block sm:inline"> {{ error }}</span>
		</div>

		<template v-else>
			<div v-if="newsData" class="bg-white shadow-md rounded-lg overflow-hidden">
				<div class="relative">
					<div v-if="newsData.image" class="w-full h-64 md:h-96 bg-gray-100">
						<NuxtImg
								:src="newsData.image"
								:alt="newsData.title"
								class="w-full h-full object-cover"
								width="1200"
								height="675"
								loading="eager"
								fetchpriority="high"
								placeholder
								format="webp"
								quality="85"
								sizes="(max-width: 640px) 600px, (max-width: 768px) 800px, 1200px"
								preload
						/>
					</div>
					<div
								v-if="isPopular"
					     class="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center"
					>
						<Icon name="uil:bolt" class="h-4 w-4 mr-1"/>
						Популярне
					</div>
				</div>

				<div class="p-6">
					<div class="flex flex-wrap items-center mb-4 gap-2">
						<NuxtLink
								v-if="newsData.category"
								to="/"
								class="inline-block px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
								@click.prevent="goToCategory(newsData.category)"
						>
							{{ newsData.category }}
						</NuxtLink>
						<NuxtLink
								v-for="tag in newsData.tags || []"
								:key="tag"
								to="/"
								class="inline-block px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
								@click.prevent="goToTag(tag)"
						>
							{{ tag }}
						</NuxtLink>
					</div>

					<h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{{ newsData.title }}</h1>

					<div class="flex flex-wrap items-center text-sm text-gray-500 mb-6">
						<div v-if="newsData.author" class="flex items-center mr-4 mb-2">
							<Icon name="uil:user" class="h-4 w-4 mr-1"/>
							{{ newsData.author }}
						</div>
						<div class="flex items-center mr-4 mb-2">
							<Icon name="uil:calendar-alt" class="h-4 w-4 mr-1"/>
							{{ newsData.formattedDate }}
						</div>
						<div class="flex items-center mb-2">
							<Icon name="uil:eye" class="h-4 w-4 mr-1"/>
							{{ newsData.views || 0 }} переглядів
						</div>
					</div>

					<div class="prose max-w-none" v-html="newsData.content"/>

					<div class="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
						<button
class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
						        @click="shareOnFacebook">
							<Icon name="uil:facebook-f" class="h-4 w-4 mr-2"/>
							Поділитися
						</button>
						<button
class="inline-flex items-center px-3 py-1.5 bg-sky-500 text-white rounded-md hover:bg-sky-600"
						        @click="shareOnTwitter">
							<Icon name="uil:twitter" class="h-4 w-4 mr-2"/>
							Твітнути
						</button>
						<button
class="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
						        @click="shareOnTelegram">
							<Icon name="uil:telegram-alt" class="h-4 w-4 mr-2"/>
							Телеграм
						</button>
					</div>
				</div>
			</div>

			<div v-else class="text-center py-16 bg-gray-50 rounded-lg">
				<Icon name="uil:file-slash" class="h-12 w-12 mx-auto text-gray-400 mb-4"/>
				<h3 class="text-lg font-medium text-gray-900 mb-1">Новину не знайдено</h3>
				<p class="text-gray-500 max-w-md mx-auto mb-6">
					Запитана новина не існує або була видалена.
				</p>
				<NuxtLink
						to="/"
						class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
				>
					Перейти на головну
				</NuxtLink>
			</div>
		</template>

		<CommentsSection v-if="isNewsDataReady" :news-id="safeNewsId"/>

	</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter, useAsyncData } from '#app'
import { useNewsStore } from '../../stores/news'
import CommentsSection from '../../components/CommentsSection.vue'

const route = useRoute()
const router = useRouter()
const newsStore = useNewsStore()

const slug = computed(() => route.params.slug)
const isNewsDataReady = computed(() => !!newsData.value?.id)
const safeNewsId = computed(() => newsData.value?.id || '')

const { data: newsData, pending: loading, error } = await useAsyncData(
  `news-item-${slug.value}`,
  () => newsStore.fetchNewsItemByIdOrSlug(slug.value),
  {}
)

const relatedNews = ref([])

if (newsData.value) {
  relatedNews.value = newsStore.news.filter(
    n =>
      n.id !== newsData.value.id &&
						n.category === newsData.value.category
  ).slice(0, 3)
}

const isPopular = computed(() => {
  if (!newsData.value) return false
  return (
    newsData.value.featured === true ||
				newsStore.popularNews?.some(item => item?.id === newsData.value.id) ||
				newsStore.featuredNews?.some(item => item?.id === newsData.value.id)
  )
})

function goToCategory (category) {
  newsStore.setCategory(category)
  router.push('/')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToTag (tag) {
  newsStore.setTag(tag)
  router.push('/')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function shareOnFacebook () {
  if (!import.meta.client || !newsData.value) return
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(newsData.value.title || '')
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`,
    'facebook-share',
    'width=580,height=296'
  )
}

function shareOnTwitter () {
  if (!import.meta.client || !newsData.value) return
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(newsData.value.title || '')
  window.open(
    `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    'twitter-share',
    'width=550,height=235'
  )
}

function shareOnTelegram () {
  if (!import.meta.client || !newsData.value) return
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(newsData.value.title || '')
  window.open(
    `https://t.me/share/url?url=${url}&text=${text}`,
    'telegram-share',
    'width=550,height=435'
  )
}

</script>
