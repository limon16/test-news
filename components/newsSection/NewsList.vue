<template>
	<div>
		<div
				v-for="news in newsList"
				:key="news.id"
				class="bg-white border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition-shadow duration-300 mb-4"
				:class="{'bg-amber-50 border-amber-200': isPopularNews(news)}"
		>
			<div class="flex flex-col sm:flex-row">
				<div v-if="news.image" class="sm:w-48 h-32 sm:h-auto flex-shrink-0">
					<NuxtLink :to="`/news/${news.slug || news.id}`" class="block h-full">
						<NuxtImg
								:src="news.image"
								:alt="news.title"
								class="w-full h-full object-cover"
								width="800"
								height="450"
								loading="lazy"
								placeholder
								format="webp"
								quality="80"
								sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
						/>
					</NuxtLink>
				</div>

				<div class="p-4 flex flex-col justify-between flex-grow">
					<div>
						<div class="flex flex-wrap items-center mb-2 gap-2">
							<span v-if="isPopularNews(news)" class="inline-flex items-center text-xs text-amber-600 font-medium">
                <Icon name="uil:bolt" class="h-4 w-4 mr-1" />
                Популярне
              </span>

							<span
									v-if="news.category"
									class="inline-block px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 cursor-pointer"
									@click.prevent="handleCategoryClick(news.category)"
							>
                {{ news.category }}
              </span>

							<span
									v-for="tag in news.tags?.slice(0, 2) || []"
									:key="tag"
									class="inline-block px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 cursor-pointer"
									@click.prevent="handleTagClick(tag)"
							>
                {{ tag }}
              </span>
						</div>

						<NuxtLink :to="`/news/${news.slug || news.id}`">
							<h3 class="text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors mb-1">
								{{ news.title }}
							</h3>
						</NuxtLink>

						<p class="text-gray-600 text-sm line-clamp-2 mb-2">
							{{ news.description }}
						</p>
					</div>

					<div class="flex justify-between items-center">
						<div class="flex items-center text-xs text-gray-500">
              <span class="flex items-center mr-3">
                  <Icon name="uil:calendar-alt" class="h-4 w-4 mr-1" />
                {{ news.formattedDate }}
              </span>
							<span class="flex items-center">
                  <Icon name="uil:eye" class="h-4 w-4 mr-1" />
                {{ news.views || 0 }}
              </span>
						</div>

						<NuxtLink
								:to="`/news/${news.slug || news.id}`"
								class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
						>
							Читати
							<NuxtIcon name="heroicons:chevron-right" class="h-4 w-4 ml-1" />
						</NuxtLink>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>


<script setup>
import { useNewsStore } from '../../stores/news.js'

const emit = defineEmits(['category-selected', 'tag-selected'])

defineProps({
  newsList: {
    type: Array,
    required: true
  }
})

const { $logger } = useNuxtApp()
const newsStore = useNewsStore()

function isPopularNews (news) {
  if (!news || !news.id) return false

  return (
    newsStore.popularNews?.filter(Boolean).slice(0, 3)
      .some(popularNews => popularNews && popularNews.id === news.id) ||
			newsStore.featuredNews?.filter(Boolean)
			  .some(featuredNews => featuredNews && featuredNews.id === news.id) ||
			news.featured === true
  )
}

function handleCategoryClick (category) {
  emit('category-selected', category)

  try {
    const { $logger } = useNuxtApp()
    if ($logger) $logger.logUserAction('filter', { type: 'category', value: category })
  } catch (e) {
	  $logger.logError('Category filter click:', { category })
  }
}

function handleTagClick (tag) {
  emit('tag-selected', tag)

  try {
    const { $logger } = useNuxtApp()
    if ($logger) $logger.logUserAction('filter', { type: 'tag', value: tag })
  } catch (e) {
	  $logger.logError('Tag filter click:', tag)
  }
}
</script>

<style scoped>
.line-clamp-2 {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	overflow: hidden;
	-webkit-line-clamp: 2;
}
</style>
