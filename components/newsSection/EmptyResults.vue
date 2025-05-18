<template>
	<div class="text-center py-16 bg-gray-50 rounded-lg">
		<Icon name="uil:search-alt" class="h-12 w-12 mx-auto text-gray-400 mb-4" />
		<h3 class="text-lg font-medium text-gray-900 mb-1">
			Новини не знайдено
		</h3>
		<p class="text-gray-500 max-w-md mx-auto mb-6">
			За вашим запитом не знайдено новин. Спробуйте змінити параметри пошуку або перегляньте всі новини.
		</p>
		<button
				class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
				@click="$emit('reset')"
		>
			Скинути фільтри
		</button>
	</div>
</template>

<script setup>
defineEmits(['reset'])
</script>
