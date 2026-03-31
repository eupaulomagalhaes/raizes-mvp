'use client'

import { useEffect } from 'react'
import { initA11y } from '@/lib/accessibility'

export function A11yProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initA11y()
  }, [])

  return <>{children}</>
}
