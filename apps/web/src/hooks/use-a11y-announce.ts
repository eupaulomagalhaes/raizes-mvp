import { useEffect } from 'react'
import { announce } from '@/lib/accessibility'

export function useA11yAnnounce(message: string, deps: any[] = []) {
  useEffect(() => {
    if (message) {
      announce(message)
    }
  }, [message, ...deps])
}
