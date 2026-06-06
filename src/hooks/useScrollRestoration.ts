import { useEffect } from 'react'

export function useScrollRestoration(key: string) {
  useEffect(() => {
    const savedY = sessionStorage.getItem(`scroll:${key}`)
    if (savedY) {
      window.setTimeout(() => {
        window.scrollTo(0, Number(savedY))
      }, 50)
    }

    const saveScroll = () => {
      sessionStorage.setItem(`scroll:${key}`, String(window.scrollY))
    }

    window.addEventListener('scroll', saveScroll, { passive: true })
    window.addEventListener('beforeunload', saveScroll)

    return () => {
      saveScroll()
      window.removeEventListener('scroll', saveScroll)
      window.removeEventListener('beforeunload', saveScroll)
    }
  }, [key])
}
