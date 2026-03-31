'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, RotateCcw, Home, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'
import { STORAGE } from '@/lib/storage'
import { ParentFeedbackModal } from '@/components/parent-feedback-modal'
import { ttsController } from '@/lib/tts'

const ASSETS = {
  toys: [
    { url: STORAGE.images.girafa, name: 'girafa', article: 'a', intro: 'Olhe para a girafa!' },
    { url: STORAGE.images.robo, name: 'robô', article: 'o', intro: 'Olhe para o robô!' },
    { url: STORAGE.images.dinossauro, name: 'dinossauro', article: 'o', intro: 'Olhe para o dinossauro!' },
  ],
  box: STORAGE.images.misteryBox,
  boxEmpty: STORAGE.images.misteryBoxEmpty,
  donHead: STORAGE.images.donCabeca,
  roomBg: 'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/8sgpf2p40cxs/tela_fundo_atividade_1.png',
}

type Phase = 'welcome' | 'intro' | 'show-toy' | 'hide' | 'guess' | 'result' | 'end'

export default function OndeEstaOBrinquedoPage() {
  const router = useRouter()
  const [level, setLevel] = useState(0) // 0, 1, 2 = girafa, robô, dinossauro
  const [phase, setPhase] = useState<Phase>('welcome')
  const [boxCount, setBoxCount] = useState(1)
  const [correctBox, setCorrectBox] = useState(0)
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [showParentFeedback, setShowParentFeedback] = useState(false)
  const [feedbackData, setFeedbackData] = useState({ acertos: 0, tentativas: 0, niveis: 0 })
  const [sessionId, setSessionId] = useState<string | null>(null)

  const currentToy = ASSETS.toys[level]

  // Criar sessão no Supabase
  useEffect(() => {
    const createSession = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('sessoes_jogo')
        .insert({ id_jogo: 'onde-esta-o-brinquedo' })
        .select()
        .single()
      if (data) setSessionId(data.id_sessao)
    }
    createSession()
  }, [])

  // Registrar evento
  const logEvent = useCallback(async (tipo: string, dados?: object) => {
    if (!sessionId) return
    const supabase = createClient()
    await supabase.from('eventos_jogo').insert({
      id_sessao: sessionId,
      tipo_evento: tipo,
      dados_adicionais: dados || {},
    })
  }, [sessionId])

  // Iniciar nível
  const startNewRound = useCallback(() => {
    if (level >= 3) return
    
    setPhase('show-toy')
    setCorrectBox(Math.floor(Math.random() * boxCount))
    setSelectedBox(null)

    // TTS: Narrar "Olhe para o [brinquedo]!"
    const toyName = currentToy.name
    const toyArticle = currentToy.article
    ttsController.speak(`Olhe para ${toyArticle} ${toyName}!`)

    setTimeout(() => {
      setPhase('hide')
      // TTS: Perguntar onde está o brinquedo
      setTimeout(() => {
        ttsController.speak(`Onde está ${toyArticle} ${toyName}?`)
        setPhase('guess')
      }, 500)
    }, 3000)
  }, [level, boxCount, currentToy])

  useEffect(() => {
    startNewRound()
  }, [startNewRound])

  // TTS
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'pt-BR'
      utter.rate = 0.9
      utter.pitch = 1.1
      window.speechSynthesis.speak(utter)
    }
  }, [])

  useEffect(() => {
    if (phase === 'welcome') {
      ttsController.speak('Esse é o jogo: ONDE ESTÁ O BRINQUEDO!')
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'show-toy') speak(currentToy.intro)
    if (phase === 'hide') speak('Agora vou esconder!')
    if (phase === 'guess') speak('Onde está o brinquedo?')
  }, [phase, currentToy, speak])

  const handleBoxClick = async (index: number) => {
    if (phase !== 'guess' || selectedBox !== null) return

    setSelectedBox(index)
    setAttempts(a => a + 1)

    const isCorrect = index === correctBox
    if (isCorrect) {
      setScore(s => s + 1)
      setPhase('result')
      await logEvent('correct_answer', { boxIndex: index, level })
      
      // TTS: Comemorar acerto
      ttsController.speak('Muito bem! Você encontrou!')

      if (level < 2) {
        setTimeout(() => {
          setLevel(l => l + 1)
        }, 2000)
      } else {
        setTimeout(() => {
          setShowParentFeedback(true)
          setFeedbackData({ acertos: score + 1, tentativas: attempts + 1, niveis: level + 1 })
          setPhase('end')
        }, 2000)
      }
    } else {
      setPhase('result')
      await logEvent('wrong_answer', { boxIndex: index, correctBox, level })
      setTimeout(() => {
        setSelectedBox(null)
        setPhase('guess')
      }, 1500)
    }
  }

  const handlePlayAgain = () => {
    setLevel(0)
    setScore(0)
    setAttempts(0)
    setShowParentFeedback(false)
    setSessionId(null)
    // Recriar sessão
    const createSession = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('sessoes_jogo')
        .insert({ id_jogo: 'onde-esta-o-brinquedo' })
        .select()
        .single()
      if (data) setSessionId(data.id_sessao)
    }
    createSession()
  }

  const handleStartGame = () => {
    if (phase === 'welcome') {
      setPhase('intro')
      ttsController.speak('Clique na tela para começar!')
      setTimeout(() => {
        startNewRound()
      }, 1500)
    }
  }

  const getSpeechText = () => {
    switch (phase) {
      case 'welcome': return 'Esse é o jogo: ONDE ESTÁ O BRINQUEDO'
      case 'intro': return 'Clique na tela para começar!'
      case 'show-toy': return currentToy.intro
      case 'hide': return 'Escondendo...'
      case 'guess': return 'Clique na caixa!'
      case 'result':
        if (selectedBox === correctBox) return 'Muito bem! 🎉'
        return 'Tente de novo!'
      default: return ''
    }
  }

  return (
    <main 
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${ASSETS.roomBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background overlay para melhor contraste */}
      <div className="absolute inset-0 bg-white/10" />

      {/* Header */}
      <header className="relative z-10 px-4 py-4 flex items-center justify-between">
        <Link href="/games">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/80 backdrop-blur">
            <ChevronLeft className="w-6 h-6 text-[#234c38]" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-[#234c38]">{score}/{attempts}</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Mascote - Posição igual ao legado (topo esquerda) */}
      <div className="relative z-10 px-6 flex items-start gap-3 mb-4">
        <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center flex-shrink-0 border-2 border-[#234c38]">
          <img src={ASSETS.donHead} alt="Don" className="w-12 h-auto" />
        </div>
        <div className="relative bg-white rounded-2xl p-4 shadow-lg flex-1 mt-2">
          <div className="absolute -left-3 top-4 w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-white" />
          <p className="text-[#234c38] font-bold text-sm leading-tight">
            {getSpeechText()}
          </p>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-6">
        {/* Welcome Screen - Click to start */}
        {phase === 'welcome' && (
          <button
            onClick={handleStartGame}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#f6fff9]/50 z-10"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center animate-pulse">
              <p className="text-[#234c38] font-bold text-lg mb-2">Clique na tela para começar!</p>
              <div className="w-12 h-12 mx-auto rounded-full bg-[#234c38] flex items-center justify-center">
                <span className="text-white text-2xl">👆</span>
              </div>
            </div>
          </button>
        )}

        {/* Toy Display */}
        {(phase === 'show-toy') && (
          <div className="mb-8 animate-bounce">
            <img
              src={currentToy.url}
              alt={currentToy.name}
              className="w-32 h-32 object-contain drop-shadow-xl"
            />
          </div>
        )}

        {/* Boxes Grid */}
        <div className={`grid gap-4 ${boxCount === 1 ? 'grid-cols-1' : boxCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {Array.from({ length: boxCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleBoxClick(i)}
              disabled={phase !== 'guess' || selectedBox !== null}
              className={`relative w-24 h-24 transition-all duration-500 ${
                phase === 'hide' && i === correctBox ? 'animate-shake' : ''
              } ${
                selectedBox === i && i !== correctBox ? 'animate-wiggle' : ''
              } ${
                selectedBox === i && i === correctBox ? 'scale-110' : ''
              }`}
            >
              {/* Box */}
              <img
                src={selectedBox === i && i === correctBox && phase === 'result'
                  ? ASSETS.boxEmpty
                  : ASSETS.box
                }
                alt="Caixa"
                className="w-full h-full object-contain drop-shadow-lg"
              />

              {/* Toy revealed */}
              {selectedBox === i && i === correctBox && phase === 'result' && (
                <img
                  src={currentToy.url}
                  alt={currentToy.name}
                  className="absolute inset-0 w-16 h-16 m-auto object-contain animate-pop"
                />
              )}

              {/* Wrong indicator */}
              {selectedBox === i && i !== correctBox && phase === 'result' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">❌</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Level indicator */}
        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < level ? 'bg-green-500' : i === level ? 'bg-[#234c38]' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Parent Feedback Modal */}
      <ParentFeedbackModal
        open={showParentFeedback}
        onClose={() => {
          setShowParentFeedback(false)
          router.push('/games')
        }}
        sessionId={sessionId}
        completedLevels={feedbackData.niveis}
        correctCount={feedbackData.acertos}
      />
    </main>
  )
}
