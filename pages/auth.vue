<template>
	<div class="container mx-auto px-4 py-8 max-w-md">
		<div class="bg-white shadow-md rounded-lg p-6">

			<h1 class="text-2xl font-bold text-center text-gray-800 mb-6">Вхід або Реєстрація</h1>

			<div class="flex border-b border-gray-200 mb-6">
				<button
						class="flex-1 py-3 px-1 text-center font-medium text-sm transition-colors duration-200"
						:class="{
            'border-b-2 border-indigo-600 text-indigo-600': activeTab === 'login',
            'text-gray-500 hover:text-gray-700': activeTab !== 'login'
          }"
						type="button"
						@click="activeTab = 'login'; authStore.error = null"
				>
					Вхід
				</button>
				<button
						:disabled="true"
						class="flex-1 py-3 px-1 text-center font-medium text-sm transition-colors duration-200 cursor-not-allowed"
						:class="{
            'border-b-2 border-indigo-600 text-indigo-600': activeTab === 'register',
            'text-gray-500 hover:text-gray-700': activeTab !== 'register'
          }"
						type="button"
						@click="activeTab = 'register'; authStore.error = null"
				>
					Реєстрація
				</button>
			</div>

			<div v-if="authStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
				<strong class="font-bold">Помилка: </strong>
				<span class="block sm:inline"> {{ authStore.error }}</span>
				<span class="absolute top-0 bottom-0 right-0 px-4 py-3">
					<NuxtIcon name="heroicons:x-mark" class="h-6 w-6 text-red-500" role="button" @click="authStore.error = null" />
        </span>
			</div>

			<form v-if="activeTab === 'login'" @submit.prevent="handleLogin">
				<div class="mb-4">
					<label for="login-email" class="block text-gray-700 text-sm font-bold mb-2">Email:</label>
					<input
							id="login-email"
							v-model="loginForm.email"
							type="email"
							class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							required
							@input="authStore.error = null"
					>
				</div>
				<div class="mb-6">
					<label for="login-password" class="block text-gray-700 text-sm font-bold mb-2">Пароль:</label>
					<input
							id="login-password"
							v-model="loginForm.password"
							type="password"
							class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
							required
							@input="authStore.error = null"
					>
				</div>
				<div class="flex items-center justify-between">
					<button
							type="submit"
							class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
							:disabled="authStore.loading"
					>
						<span v-if="authStore.loading">Вхід...</span>
						<span v-else>Увійти</span>
					</button>
				</div>
			</form>

			<form v-if="activeTab === 'register'" @submit.prevent="handleRegister">
				<div class="mb-4">
					<label for="register-username" class="block text-gray-700 text-sm font-bold mb-2">Ім'я користувача:</label>
					<input
							id="register-username"
							v-model="registerForm.username"
							type="text"
							class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							required
							@input="authStore.error = null"
					>
				</div>
				<div class="mb-4">
					<label for="register-email" class="block text-gray-700 text-sm font-bold mb-2">Email:</label>
					<input
							id="register-email"
							v-model="registerForm.email"
							type="email"
							class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							required
							@input="authStore.error = null"
					>
				</div>
				<div class="mb-6">
					<label for="register-password" class="block text-gray-700 text-sm font-bold mb-2">Пароль:</label>
					<input
							id="register-password"
							v-model="registerForm.password"
							type="password"
							class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
							required
							@input="authStore.error = null"
					>
				</div>
				<div class="flex items-center justify-between">
					<button
							type="submit"
							class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
							:disabled="authStore.loading"
					>
						<span v-if="authStore.loading">Реєстрація...</span>
						<span v-else>Зареєструватися</span>
					</button>
				</div>
			</form>
		</div>
	</div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { navigateTo } from '#app'

const authStore = useAuthStore()
const { $logger } = useNuxtApp()
const activeTab = ref('login')

const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: ''
})

watch(activeTab, () => {
  authStore.error = null
})

async function handleLogin () {
  $logger.logUserAction('submit_login_form', { email: loginForm.value.email })

  const formData = {
    email: loginForm.value.email,
    password: loginForm.value.password
  }

  const success = await authStore.login(formData)
  if (success) {
    navigateTo('/')
  }
}

async function handleRegister () {
  $logger.logUserAction('submit_register_form', { email: registerForm.value.email, username: registerForm.value.username })

  const formData = {
    username: registerForm.value.username,
    email: registerForm.value.email,
    password: registerForm.value.password
  }

  const success = await authStore.register(formData)
  if (success) {
    activeTab.value = 'login'
    registerForm.value = { username: '', email: '', password: '' }
  }
}
</script>
