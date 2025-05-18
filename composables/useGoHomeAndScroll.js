import { useRouter } from 'vue-router'

export function useGoHomeAndScroll () {
  const router = useRouter()

  function goHomeAndScroll (callback) {
    if (router.currentRoute.value.path !== '/') {
      router.push('/').then(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        if (typeof callback === 'function') callback()
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      if (typeof callback === 'function') callback()
    }
  }

  return { goHomeAndScroll }
}
