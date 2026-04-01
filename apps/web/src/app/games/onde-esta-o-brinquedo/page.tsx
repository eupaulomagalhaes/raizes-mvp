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
import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

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
  clickHand: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/Click_hand2.json',
  confetti: 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/confetti.json',
}

type Phase = 'welcome' | 'intro' | 'show-toy' | 'hide' | 'guess' | 'reveal' | 'result' | 'end' | 'congratulations'

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
  const [showHand, setShowHand] = useState(false)
  const [showNextButton, setShowNextButton] = useState(false)
  const [handAnimation, setHandAnimation] = useState<any>(null)
  const [confettiAnimation, setConfettiAnimation] = useState<any>(null)
  const [wrongBoxes, setWrongBoxes] = useState<number[]>([])
  const [handTargetBox, setHandTargetBox] = useState(0)
  const [revealedToy, setRevealedToy] = useState<typeof ASSETS.toys[0] | null>(null)
  const [completedLevel, setCompletedLevel] = useState(0)

  const currentToy = ASSETS.toys[Math.min(level, 2)]

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

  // Carregar animações Lottie
  useEffect(() => {
    fetch(ASSETS.clickHand)
      .then(res => res.json())
      .then(data => setHandAnimation(data))
      .catch(err => console.error('Erro ao carregar mão:', err))

    fetch(ASSETS.confetti)
      .then(res => res.json())
      .then(data => setConfettiAnimation(data))
      .catch(err => console.error('Erro ao carregar confetti:', err))
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
  const startNewRound = useCallback((levelToUse?: number) => {
    const actualLevel = levelToUse !== undefined ? levelToUse : level
    if (actualLevel >= 3) return
    
    // Usar o brinquedo correto do nível atual
    const toy = ASSETS.toys[actualLevel]
    
    setPhase('show-toy')
    setCorrectBox(Math.floor(Math.random() * boxCount))
    setSelectedBox(null)
    setWrongBoxes([])
    setHandTargetBox(0)

    // TTS: Narrar "Olhe para o [brinquedo]!"
    const toyName = toy.name
    const toyArticle = toy.article
    ttsController.speak(`Olhe para ${toyArticle} ${toyName}!`)

    setTimeout(() => {
      setPhase('hide')
      // TTS: Perguntar onde está o brinquedo
      setTimeout(() => {
        ttsController.speak(`Onde está ${toyArticle} ${toyName}?`)
        setPhase('guess')
      }, 500)
    }, 3000)
  }, [level, boxCount])

  // Removido: não inicia automaticamente, só após o usuário clicar no intro

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

  // Fluxo welcome -> intro
  useEffect(() => {
    if (phase === 'welcome') {
      ttsController.speak('Esse é o jogo: ONDE ESTÁ O BRINQUEDO!')
      
      // Após 5s, muda para intro (dar tempo do TTS terminar)
      const timer = setTimeout(() => {
        setPhase('intro')
        ttsController.speak('Clique na tela para começar!')
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [phase])

  // Mão indicadora após 5s
  useEffect(() => {
    if ((phase === 'intro' || phase === 'guess') && !showHand) {
      const timer = setTimeout(() => {
        setShowHand(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [phase, showHand])

  // Mão alternando entre caixas no nível 2+
  useEffect(() => {
    if (phase === 'guess' && showHand && boxCount >= 2) {
      const interval = setInterval(() => {
        setHandTargetBox(prev => (prev + 1) % boxCount)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [phase, showHand, boxCount])

  // Mostrar mão após 5s no guess
  useEffect(() => {
    if (phase === 'guess') {
      const handTimer = setTimeout(() => {
        setShowHand(true)
      }, 5000)

      return () => {
        clearTimeout(handTimer)
        setShowHand(false)
      }
    }
  }, [phase])

  // Removido: TTS duplicado - já é chamado no startNewRound

  const handleBoxClick = async (index: number) => {
    if (selectedBox !== null || wrongBoxes.includes(index) || level >= 3) return
    setSelectedBox(index)
    setAttempts(a => a + 1)
    await logEvent('box_clicked', { boxIndex: index, correctBox, level })

    if (index === correctBox) {
      setScore(s => s + 1)
      
      // Salvar toy e nível atual antes de incrementar (máximo 2 = nível 3)
      setRevealedToy(currentToy)
      setCompletedLevel(Math.min(level, 2))
      
      setPhase('reveal') // Mostrar brinquedo primeiro
      await logEvent('correct_answer', { boxIndex: index, level })
      
      // Incrementar nível imediatamente para sincronizar troféu com card
      setLevel(l => l + 1)
      setBoxCount(c => c + 1)
      
      ttsController.speak('MUITO BEM! VOCÊ ACERTOU!')

      // Após 2.5s, mostrar card de conclusão
      setTimeout(() => {
        setPhase('result')
        // Mostrar botão próximo nível após mais 0.5s
        setTimeout(() => {
          setShowNextButton(true)
        }, 500)
      }, 2500)
    } else {
      // Erro: adicionar caixa à lista de erradas
      setWrongBoxes(prev => [...prev, index])
      await logEvent('wrong_answer', { boxIndex: index, correctBox, level })
      
      ttsController.speak('Ops! Tente outra caixa!')
      
      setTimeout(() => {
        setSelectedBox(null)
      }, 1500)
    }
  }

  const handleNextLevel = () => {
    setShowNextButton(false)
    
    if (level < 3) {
      // Pequeno delay antes de iniciar próximo round
      setTimeout(() => {
        startNewRound(level)
      }, 300)
    } else {
      setShowParentFeedback(true)
      setFeedbackData({ acertos: score, tentativas: attempts, niveis: level + 1 })
      setPhase('end')
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
    if (phase === 'intro') {
      setShowHand(false)
      startNewRound()
    }
  }

  const getSpeechText = () => {
    switch (phase) {
      case 'welcome': return 'Esse é o jogo: ONDE ESTÁ O BRINQUEDO'
      case 'intro': return 'Clique na tela para começar!'
      case 'show-toy': return currentToy.intro
      case 'hide': return 'Escondendo...'
      case 'guess': return `Onde está ${currentToy.article} ${currentToy.name}?`
      case 'result':
        if (selectedBox === correctBox) return 'MUITO BEM! VOCÊ ACERTOU!'
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
          <span className="font-bold text-[#234c38]">{level}/3</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Mascote - Posição igual ao legado (topo esquerda) */}
      <div className="relative z-10 px-4 flex items-start gap-3 mb-4 mt-2">
        <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center flex-shrink-0 border-4 border-[#234c38]">
          <img src={ASSETS.donHead} alt="Don" className="w-14 h-auto" />
        </div>
        <div className="relative bg-white rounded-3xl px-5 py-4 shadow-xl max-w-md">
          <div className="absolute -left-3 top-6 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[16px] border-r-white" />
          <p className="text-[#234c38] font-bold text-base leading-snug">
            {getSpeechText()}
          </p>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end px-6 pb-20">
        {/* Intro Screen - Click to start */}
        {phase === 'intro' && (
          <button
            onClick={handleStartGame}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
          >
            {showHand && handAnimation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32">
                <Lottie animationData={handAnimation} loop />
              </div>
            )}
          </button>
        )}

        {/* Toy Display - Mostrar em show-toy e reveal */}
        {phase === 'show-toy' && (
          <div className="mb-4 animate-bounce">
            <img
              src={currentToy.url}
              alt={currentToy.name}
              className="w-32 h-32 object-contain drop-shadow-xl"
            />
          </div>
        )}
        {phase === 'reveal' && revealedToy && (
          <div className="mb-4 animate-bounce">
            <img
              src={revealedToy.url}
              alt={revealedToy.name}
              className="w-32 h-32 object-contain drop-shadow-xl"
            />
          </div>
        )}

        {/* Boxes Grid - Mostrar apenas em hide e guess */}
        {(phase === 'hide' || phase === 'guess') && (
        <div className="relative">
          <div className={`grid gap-4 ${boxCount === 1 ? 'grid-cols-1' : boxCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {Array.from({ length: boxCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleBoxClick(i)}
                disabled={phase !== 'guess' || selectedBox !== null || wrongBoxes.includes(i)}
                className={`relative w-36 h-36 transition-all duration-500 ${
                  phase === 'hide' && i === correctBox ? 'animate-shake' : ''
                } ${
                  selectedBox === i && i !== correctBox ? 'animate-wiggle' : ''
                } ${
                  selectedBox === i && i === correctBox ? 'scale-110' : ''
                }`}
              >
                {/* Box */}
                <img
                  src={ASSETS.box}
                  alt="Caixa"
                  className={`w-full h-full object-contain drop-shadow-lg transition-all ${
                    wrongBoxes.includes(i) ? 'grayscale brightness-75 opacity-60' : ''
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Mão indicadora na fase guess - em cima da caixa */}
          {phase === 'guess' && showHand && handAnimation && (
            <div 
              className="absolute -top-6 w-20 h-20 z-30 transition-all duration-500 pointer-events-none"
              style={{
                left: boxCount === 1 ? '50%' : `${((handTargetBox + 0.5) / boxCount) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <Lottie animationData={handAnimation} loop />
            </div>
          )}
        </div>
        )}

        {/* Confetes quando acertar - Lottie fullscreen */}
        {(phase === 'reveal' || phase === 'result') && selectedBox === correctBox && confettiAnimation && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <Lottie 
              animationData={confettiAnimation} 
              loop={false}
              style={{ width: '100vw', height: '100vh' }}
            />
          </div>
        )}

        {/* Card de Conclusão de Nível */}
        {phase === 'result' && selectedBox === correctBox && (
          <div className="flex flex-col items-center gap-6 z-40">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl px-8 py-6 shadow-xl flex flex-col items-center gap-3">
              <h2 className="text-2xl font-bold text-[#234c38]">Nível {completedLevel + 1}</h2>
              <p className="text-lg font-semibold text-[#16a34a]">Concluído!</p>
              <div className="flex gap-3 mt-2">
                {[0, 1, 2].map(i => (
                  <span key={i} className={`text-4xl ${i <= completedLevel ? '' : 'opacity-30'}`}>
                    ⭐
                  </span>
                ))}
              </div>
            </div>
            {showNextButton && (
              <Button
                onClick={handleNextLevel}
                size="lg"
                className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold px-8 py-6 text-lg rounded-2xl"
              >
                {level < 3 ? 'Próximo Nível' : 'Continuar'}
              </Button>
            )}
          </div>
        )}

        {/* Tela de Congratulações */}
        {phase === 'congratulations' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center gap-4 mb-4">
                <img src={ASSETS.donHead} alt="Don" className="w-16 h-16" />
                <h2 className="text-2xl font-bold text-[#234c38]">
                  Parabéns! 🎉
                </h2>
              </div>
              
              <p className="text-[#234c38] mb-6">
                Você completou todas as 3 fases da atividade!
              </p>

              <div className="bg-[#edf4f0] rounded-2xl p-4 mb-6 space-y-4">
                <div>
                  <h3 className="font-bold text-[#234c38] mb-2">💡 Dica para os pais:</h3>
                  <p className="text-sm text-[#3a5144] mb-3">
                    <strong>👁️ O que trabalhamos nesta atividade:</strong>
                  </p>
                  <ul className="text-sm text-[#3a5144] space-y-2 ml-4">
                    <li>• <strong>Atenção e Foco:</strong> A criança precisa prestar atenção ao brinquedo e às caixas.</li>
                    <li>• <strong>Memória Visual:</strong> Lembrar onde viu o brinquedo pela última vez.</li>
                    <li>• <strong>Permanência do Objeto:</strong> Entender que objetos continuam existindo mesmo quando não são visíveis.</li>
                    <li>• <strong>Tomada de Decisão:</strong> Escolher uma caixa e aprender com acertos e erros.</li>
                    <li>• <strong>Coordenação Motora Fina:</strong> Tocar na caixa e praticar movimentos de precisão.</li>
                  </ul>
                </div>

                <div>
                  <p className="text-sm text-[#3a5144] mb-2">
                    <strong>🎯 Sugestão prática para casa:</strong>
                  </p>
                  <p className="text-sm text-[#3a5144]">
                    Esconda um brinquedo dentro de caixas, copos ou paninhos. Peça à criança para encontrar. Celebre quando ela acertar! Faça isso, incentive sempre que ela errar, com calma: "Tente novamente!"
                  </p>
                </div>

                <div>
                  <p className="text-sm text-[#3a5144]">
                    <strong>💡 Por que é importante:</strong>
                  </p>
                  <p className="text-sm text-[#3a5144]">
                    Esse tipo de brincadeira simples fortalece o cérebro da criança de forma divertida e afetosa, desenvolvendo habilidades essenciais para o aprendizado futuro.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handlePlayAgain}
                  className="w-full bg-[#234c38] hover:bg-[#1d3f2f] text-white font-bold py-6 rounded-full text-lg"
                >
                  Jogar novamente
                </Button>
                <Button
                  onClick={() => router.push('/games')}
                  variant="outline"
                  className="w-full border-2 border-[#234c38] text-[#234c38] font-bold py-6 rounded-full text-lg hover:bg-[#edf4f0]"
                >
                  Voltar aos jogos
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Estrelas removidas - agora estão no card de conclusão */}
      </div>

      {/* Parent Feedback Modal */}
      <ParentFeedbackModal
        open={showParentFeedback}
        onClose={() => {
          setShowParentFeedback(false)
        }}
        onSuccess={() => {
          setPhase('congratulations')
          ttsController.speak('Parabéns! Você completou todas as 3 fases da atividade!')
        }}
        sessionId={sessionId}
        completedLevels={feedbackData.niveis}
        correctCount={feedbackData.acertos}
      />
    </main>
  )
}
