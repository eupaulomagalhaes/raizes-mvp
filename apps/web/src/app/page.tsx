'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { STORAGE } from '@/lib/storage'
import { ttsController } from '@/lib/tts'

export default function Home() {
  const [speechText, setSpeechText] = useState('Eu sou o Don!')

  useEffect(() => {
    // Injetar keyframe animation no document
    const styleId = 'cta-pulse-keyframe'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes cta-pulse {
          from { transform: scale(0.95); }
          to { transform: scale(1.025); }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    // TTS sequence: "Eu sou o Don!" -> "Quero ajudar você!"
    if (ttsController.isEnabled()) {
      setTimeout(() => {
        ttsController.speak('Eu sou o Don!', () => {
          setSpeechText('Quero ajudar você!')
          setTimeout(() => {
            ttsController.speak('Quero ajudar você!')
          }, 300)
        })
      }, 500)
    }
  }, [])

  return (
    <main 
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: 'url(https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/l8o6ilu1qm8g/tela_fundo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Top Section */}
      <div className="pt-12 px-6 text-center">
        <p className="text-xl font-bold tracking-wider text-[#2b3b31] mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.12)' }}>
          BEM-VINDO AO
        </p>
        <div 
          className="bg-white inline-block w-[72vw] max-w-[520px] p-6 shadow-[0_28px_56px_rgba(0,0,0,0.16)]"
          style={{ borderRadius: 'clamp(60px, 20vw, 120px)' }}
        >
          <img 
            src={STORAGE.images.logo} 
            alt="Raízes Educacional" 
            className="w-full max-w-[220px] h-auto mx-auto"
          />
          <h1 className="text-2xl font-extrabold text-[#234c38] mt-2 font-[family-name:var(--font-montserrat)]">
            Raízes Educacional
          </h1>
        </div>
      </div>

      {/* Bottom Section */}
      <div 
        className="absolute left-0 right-0 bottom-0 grid items-end"
        style={{
          gridTemplateColumns: '45% 55%',
          gap: '3vw',
          padding: 'clamp(1.5rem, 8.45vw, 4rem)',
          paddingTop: 'clamp(1rem, 4vw, 2rem)'
        }}
      >
        {/* Mascot */}
        <div className="self-end">
          <img 
            src={STORAGE.images.donMascote} 
            alt="DON - Mascote" 
            className="w-full h-auto"
            style={{ maxWidth: 'clamp(240px, 42vw, 360px)' }}
          />
        </div>

        {/* Speech Bubble + CTAs */}
        <div className="flex flex-col items-start justify-end" style={{ gap: '3vw' }}>
          {/* Speech Bubble */}
          <div className="w-full flex justify-start">
            <div className="relative bg-white rounded-2xl p-4 shadow-lg max-w-[min(60vw,320px)]">
              <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white" />
              <p className="text-[#234c38] font-bold text-lg">
                {speechText}
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="w-full flex flex-col items-start gap-3">
            <Link href="/register" className="w-full" style={{ maxWidth: 'min(100%, 260px)' }}>
              <Button 
                size="lg" 
                className="w-full bg-[#234c38] hover:bg-[#1d3f2f] text-white font-bold rounded-full py-6 text-lg shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
                style={{
                  animation: 'cta-pulse 0.6s ease-in-out infinite alternate',
                  transformOrigin: 'center',
                  willChange: 'transform'
                }}
              >
                Começar
              </Button>
            </Link>
            <Link href="/login" className="w-full" style={{ maxWidth: 'min(100%, 260px)' }}>
              <button className="w-full text-white font-bold text-base opacity-90 hover:opacity-100 bg-transparent border-none cursor-pointer transition-opacity">
                Já tenho uma conta!
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
