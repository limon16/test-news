export default defineNuxtPlugin((nuxtApp) => {
  const logger = {
    // Рівні логування
    levels: {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    },

    currentLevel: process.env.NODE_ENV === 'production' ? 2 : 0, // WARN у продакшені, DEBUG у розробці

    log (level, message, data = {}) {
      if (level < this.currentLevel) {
        return
      }

      // Формуємо об'єкт логу
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: Object.keys(this.levels).find(key => this.levels[key] === level),
        message,
        data
      }

      // У продакшені можна надсилати логи на сервер
      if (process.env.NODE_ENV === 'production') {
        /*
				fetch('/api/logs', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(logEntry)
				}).catch(err => {
					console.error('Failed to send log to server:', err);
				});
				*/
      }

      // Виводимо в консоль у режимі розробки
      if (process.env.NODE_ENV !== 'production' || level >= this.levels.WARN) {
        const method = level === this.levels.ERROR ? 'error' :
          level === this.levels.WARN ? 'warn' :
            level === this.levels.INFO ? 'info' : 'log'
        console[method](`[${logEntry.level}] ${message}`, data)
      }

      return logEntry
    },

    // Методи для різних рівнів логування
    debug (message, data = {}) {
      return this.log(this.levels.DEBUG, message, data)
    },

    info (message, data = {}) {
      return this.log(this.levels.INFO, message, data)
    },

    warn (message, data = {}) {
      return this.log(this.levels.WARN, message, data)
    },

    error (message, data = {}) {
      return this.log(this.levels.ERROR, message, data)
    },

    // Спеціальні методи логування
    logInfo (message, data = {}) {
      return this.info(message, data)
    },

    logError (error, context = {}) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorData = error instanceof Error ? {
        name: error.name,
        stack: error.stack,
        ...context
      } : context

      return this.error(errorMessage, errorData)
    },

    // Логування дій користувача
    logUserAction (action, details = {}) {
      return this.info(`User action: ${action}`, {
        action,
        details,
        timestamp: new Date().toISOString()
      })
    },

    // Логування API запитів
    logApiRequest (endpoint, requestData = {}, response = null, error = null) {
      const logData = {
        endpoint,
        request: requestData,
        timestamp: new Date().toISOString()
      }

      if (response) {
        logData.response = {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data
        }
      }

      if (error) {
        logData.error = error instanceof Error ? {
          message: error.message,
          name: error.name
        } : error

        return this.error(`API request failed: ${endpoint}`, logData)
      }

      return this.debug(`API request: ${endpoint}`, logData)
    },

    // Логування часу виконання
    logPerformance (operation, startTime, endTime = null) {
      const end = endTime || performance.now()
      const duration = end - startTime

      return this.debug(`Performance: ${operation}`, {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Додаємо логування помилок в компонентах і хуках
  nuxtApp.hook('vue:error', (err, instance, info) => {
    logger.logError(err, {
      componentName: instance?.type?.__name || 'Unknown',
      vueInfo: info,
      componentProps: instance?.props,
      componentRoute: instance?.$route?.path
    })
  })

  // Логування для lifecycle event компонентів
  nuxtApp.hook('vue:setup', () => {
    logger.debug('Vue component setup')
  })

  // Логування при навігації
  nuxtApp.hook('page:start', () => {
    logger.debug('Page navigation started')
  })

  nuxtApp.hook('page:finish', () => {
    logger.debug('Page navigation finished')
  })

  // Логування завантаження компонентів
  nuxtApp.hook('component:created', (component) => {
    logger.debug(`Component created: ${component?.type?.__name || 'Unknown'}`)
  })

  // Надаємо доступ до логера в додатку
  nuxtApp.provide('logger', logger)
})
