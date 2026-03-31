'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { bgmController } from '@/lib/bgm'

export function BGMProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Tentar iniciar música nas páginas principais (não em login/register/welcome)
    const playableRoutes = ['/games', '/children', '/settings', '/progress']
    const shouldPlay = playableRoutes.some(route => pathname.startsWith(route))

    if (shouldPlay) {
      // Delay para permitir interação do usuário primeiro
      const timer = setTimeout(() => {
        bgmController.play()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [pathname])

  // Adicionar listener global para unlock de autoplay
  useEffect(() => {
    const unlockAudio = () => {
      bgmController.play()
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
    }

    document.addEventListener('click', unlockAudio, { once: true })
    document.addEventListener('touchstart', unlockAudio, { once: true })

    return () => {
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

  return <>{children}</>
}
