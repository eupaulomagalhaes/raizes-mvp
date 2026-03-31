'use client'

import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bgmController } from '@/lib/bgm'

export function BGMToggle() {
  const [enabled, setEnabled] = useState(true)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setEnabled(bgmController.isEnabled())
    setPlaying(bgmController.isPlaying())

    return bgmController.subscribe((en, pl) => {
      setEnabled(en)
      setPlaying(pl)
    })
  }, [])

  const handleToggle = () => {
    bgmController.toggle()
  }

  return (
    <Button
      onClick={handleToggle}
      variant="ghost"
      size="icon"
      className="fixed top-4 right-4 z-50 rounded-full bg-white/90 shadow-lg hover:bg-white"
      aria-label={enabled && playing ? 'Desligar música' : 'Ligar música'}
      aria-pressed={enabled}
    >
      {enabled && playing ? (
        <Volume2 className="w-5 h-5 text-[#234c38]" />
      ) : (
        <VolumeX className="w-5 h-5 text-[#3a5144]" />
      )}
    </Button>
  )
}
