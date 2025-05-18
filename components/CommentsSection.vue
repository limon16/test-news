<template>
	<div class="comments-section mt-8">
		<h2 class="text-2xl font-semibold mb-4">Коментарі</h2>

		<ClientOnly>
			<div v-if="authStore.isLoggedIn" class="mb-6 bg-gray-50 p-4 rounded-lg">
				<form @submit.prevent="submitComment">
					<div class="mb-4">
						<label for="comment-content" class="block text-sm font-medium text-gray-700 mb-1">
							Ваш коментар
						</label>
						<textarea
								id="comment-content"
								v-model="newCommentForm.content"
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="Напишіть ваш коментар..."
								:disabled="loading"
						/>
						<p v-if="newCommentForm.hasError" class="mt-1 text-sm text-red-600">
							{{ newCommentForm.errorMessage }}
						</p>
					</div>

					<div class="flex justify-end">
						<button
								type="submit"
								class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
								:disabled="loading || !newCommentForm.content.trim()"
						>
              <span v-if="loading">
                <NuxtIcon name="heroicons:arrow-path" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Надсилаємо...
              </span>
							<span v-else>Додати коментар</span>
						</button>
					</div>
				</form>
			</div>

			<div v-else class="mb-6 bg-gray-50 p-4 rounded-lg">
				<p class="text-gray-600 mb-2">
					Щоб залишити коментар, будь ласка, авторизуйтесь.
				</p>
				<NuxtLink
						to="/auth"
						class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Увійти або зареєструватися
				</NuxtLink>
			</div>
		</ClientOnly>

		<div>
			<div v-if="loading && !comments.length" class="flex justify-center py-8">
				<NuxtIcon name="heroicons:arrow-path" class="animate-spin h-8 w-8 text-indigo-500" />
			</div>

			<div v-else-if="!comments.length" class="text-center py-8 bg-gray-50 rounded-lg">
				<Icon name="uil:comment-alt-notes" class="h-10 w-10 text-gray-400 mx-auto mb-2" />
				<p class="text-gray-500">Поки що немає коментарів. Будьте першим!</p>
			</div>

			<template v-else>
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-medium">Всі коментарі ({{ comments.length }})</h3>
				</div>

				<ul class="space-y-4">
					<li
							v-for="comment in comments"
							:key="comment.id"
							class="border border-gray-200 rounded-lg p-4"
							:class="{ 'border-green-200 bg-green-50': comment.isRealtime }"
					>
						<div class="flex items-start">
							<div class="flex-shrink-0 mr-3">
								<NuxtImg
										:src="comment.avatarUrl"
										:alt="comment.author"
										class="h-10 w-10 rounded-full object-cover"
										width="40"
										height="40"
										loading="lazy"
										format="webp"
										quality="80"
								/>
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center justify-between mb-1">
									<h4 class="text-base font-medium text-gray-900">{{ comment.author }}</h4>
									<div class="flex items-center text-sm text-gray-500">
										<template v-if="comment.isRealtime">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                        Щойно
                      </span>
										</template>
										<template v-if="comment.isUserComment">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                        Ваш коментар
                      </span>
										</template>
										<span>{{ comment.formattedDate || formatDate(comment.createdAt) }}</span>
									</div>
								</div>
								<p class="text-gray-700 whitespace-pre-line">{{ comment.content }}</p>
								<div class="mt-2 flex items-center text-sm text-gray-500">
									<button
											class="flex items-center hover:text-indigo-600 transition-colors"
											:class="{ 'text-indigo-600': comment.userLiked }"
									>
										<Icon name="uil:heart" class="h-4 w-4 mr-1" />
										{{ comment.likes || 0 }} {{ getLikesText(comment.likes || 0) }}
									</button>
								</div>
							</div>
						</div>
					</li>
				</ul>
			</template>
		</div>
	</div>
</template>

<script setup>
import { useCommentsStore } from '~/stores/comments'
import { useAuthStore } from '~/stores/auth'
import { useNuxtApp } from '#app'

const props = defineProps({
  newsId: {
    type: [Number, String],
    required: true
  }
})

const nuxtApp = useNuxtApp()
const { $logger } = nuxtApp

const commentsStore = useCommentsStore()
const authStore = useAuthStore()

const { $websocket } = useNuxtApp()

const loading = ref(false)
const error = ref(null)
const comments = computed(() => {
  return commentsStore.getCommentsByNewsId(parseInt(props.newsId))
})

const newCommentForm = reactive({
  content: '',
  hasError: false,
  errorMessage: ''
})

const loadComments = async () => {
  loading.value = true
  error.value = null

  $logger.debug(`Starting to load comments for news ID: ${props.newsId}`)
  try {
    const newsId = parseInt(props.newsId)
    await commentsStore.fetchCommentsByNewsId(newsId)
    $logger.info(`Successfully loaded ${comments.value.length} comments for news ID: ${props.newsId}`)
  } catch (err) {
    $logger.logError(err, { context: `loading comments for news ID: ${props.newsId}` })
    error.value = err.message || 'Не вдалося завантажити коментарі'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    return `${day}.${month}.${year}`
  } catch (e) {
    return dateString
  }
}

const getLikesText = (count) => {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'лайк'
  } else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return 'лайки'
  } else {
    return 'лайків'
  }
}

const submitComment = async () => {
  if (!newCommentForm.content.trim()) {
    newCommentForm.hasError = true
    newCommentForm.errorMessage = 'Будь ласка, введіть текст коментаря'
    $logger.warn('Attempted to submit empty comment')
    return
  }

  loading.value = true
  newCommentForm.hasError = false

  try {
    await commentsStore.postComment(props.newsId, {
      author: authStore.user?.username || authStore.user?.name || 'Користувач',
      avatarUrl: authStore.user?.avatar || '',
      content: newCommentForm.content
    })

    newCommentForm.content = ''
  } catch (err) {
    $logger.logError(err, { context: `submitting comment for news ID: ${props.newsId}` })
    newCommentForm.hasError = true
    newCommentForm.errorMessage = err.message || 'Не вдалося відправити коментар'
  } finally {
    loading.value = false
  }
}

const unsubscribeWs = ref(null)

const onNewComment = (newComment) => {
  if (parseInt(newComment.newsId) === parseInt(props.newsId)) {
    $logger.debug(`Отримано новий коментар для поточної новини ID: ${props.newsId}`, {
      commentId: newComment.id,
      author: newComment.author
    })
  }
}

watch(() => props.newsId, (newId) => {
  if (newId) {
    loadComments()

    if ($websocket) {
      $logger.debug(`Connecting WebSocket for news ID: ${props.newsId}`)
      $websocket.disconnect()
      $websocket.connect(newId)
    }
  }
})

onMounted(() => {
  loadComments()

  if ($websocket) {
    $websocket.connect(props.newsId)
  }

  unsubscribeWs.value = nuxtApp.hooks.hookOnce('ws:newComment', onNewComment)
})

onBeforeUnmount(() => {
  if ($websocket) {
    $logger.debug(`Disconnecting WebSocket for news ID: ${props.newsId}`)
    $websocket.disconnect()
  }

  if (unsubscribeWs.value) {
    unsubscribeWs.value()
    $logger.debug('Unsubscribed from ws:newComment hook')
  }
})
</script>

<style scoped>
/* Анімація для нових коментарів */
@keyframes highlight {
	0% {
		background-color: rgba(16, 185, 129, 0.2);  /* Light green highlight */
	}
	100% {
		background-color: transparent;
	}
}

.comment-new {
	animation: highlight 3s ease-out;
}
</style>
