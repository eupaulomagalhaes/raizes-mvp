'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Lottie from 'lottie-react';
import { LeadQuestionnaire } from '@/components/lead-questionnaire';

// TTS Controller
const ttsController = {
  speak: (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'pt-BR'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  },
  cancel: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }
}

// PLACEHOLDER - Assets serão substituídos quando você enviar
const ASSETS = {
  don: '/assets/don-mascot.png',
  confetti: 'https://lottie.host/3f3c0e4a-8e4a-4e4a-9c4a-0e4a3f3c0e4a/3f3c0e4a.json',
  
  // Layers do cenário (placeholder)
  scenery: {
    background: '/assets/forest/background.png',
    trees: '/assets/forest/trees.png',
    rocks: '/assets/forest/rocks.png',
    bushes: '/assets/forest/bushes.png',
  },
  
  // Animais (placeholder)
  animals: [
    { id: 'lion', name: 'leão', article: 'o', image: '/assets/animals/lion.png' },
    { id: 'monkey', name: 'macaco', article: 'o', image: '/assets/animals/monkey.png' },
    { id: 'parrot', name: 'papagaio', article: 'o', image: '/assets/animals/parrot.png' },
    { id: 'elephant', name: 'elefante', article: 'o', image: '/assets/animals/elephant.png' },
    { id: 'tiger', name: 'tigre', article: 'o', image: '/assets/animals/tiger.png' },
    { id: 'zebra', name: 'zebra', article: 'a', image: '/assets/animals/zebra.png' },
  ]
}

// Configuração dos níveis
const LEVEL_CONFIG = {
  0: { // Nível I ⭐
    stars: '⭐',
    elementCount: 3,
    animalCount: 3,
    observeTime: 8000, // 5s + 3s countdown
  },
  1: { // Nível II ⭐⭐
    stars: '⭐⭐',
    elementCount: 5,
    animalCount: 5,
    observeTime: 8000,
  },
  2: { // Nível III ⭐⭐⭐
    stars: '⭐⭐⭐',
    elementCount: 8,
    animalCount: 6, // 70% aproximado
    observeTime: 8000,
  }
}

type Phase = 'intro' | 'show' | 'countdown' | 'hide' | 'guess' | 'reveal' | 'reveal-error' | 'congratulations'
type DonState = 'game' | 'celebration'

interface HidingSpot {
  id: string
  type: 'tree' | 'rock' | 'bush'
  x: number
  y: number
  hasAnimal: boolean
  animalId?: string
}

export default function OndeEstaoOsAnimaisPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const [childId, setChildId] = useState<string>('')
  const [childName, setChildName] = useState<string>('')
  
  // Estados do jogo
  const [phase, setPhase] = useState<Phase>('intro')
  const [level, setLevel] = useState(0)
  const [hidingSpots, setHidingSpots] = useState<HidingSpot[]>([])
  const [clickedSpots, setClickedSpots] = useState<string[]>([])
  const [foundAnimals, setFoundAnimals] = useState<string[]>([])
  const [wrongSpots, setWrongSpots] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [guessStartTime, setGuessStartTime] = useState<number | null>(null)
  
  // Estados visuais
  const [donState, setDonState] = useState<DonState>('game')
  const [confettiAnimation, setConfettiAnimation] = useState<any>(null)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)

  // Criar sessão ao montar
  useEffect(() => {
    const createSession = async () => {
      const supabase = createClient()
      const activeChildId = typeof window !== 'undefined' ? localStorage.getItem('active_child_id') : null
      
      if (!activeChildId) {
        router.push('/children')
        return
      }

      const { data, error } = await supabase
        .from('sessoes_jogo')
        .insert({
          id_crianca: activeChildId,
          slug_jogo: 'onde-estao-os-animais',
          pontos: 0,
          acertos: 0,
          tentativas: 0,
          finalizada: false
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar sessão:', error)
        return
      }

      if (data) {
        setSessionId(data.id_sessao)
        sessionIdRef.current = data.id_sessao
      }
    }
    createSession()
    
    // Cleanup
    return () => {
      if (sessionId) {
        const finalSessionId = sessionId
        const supabase = createClient()
        
        ;(async () => {
          try {
            const { data: events } = await supabase
              .from('eventos_jogo')
              .select('dados_adicionais')
              .eq('id_sessao', finalSessionId)
            
            let pontos = 0
            let acertos = 0
            let tentativas = 0
            
            events?.forEach(e => {
              const payload = e.dados_adicionais || {}
              if (typeof payload.correct === 'boolean') {
                tentativas++
                if (payload.correct) {
                  acertos++
                  pontos += payload.level || 1
                }
              }
            })
            
            await supabase
              .from('sessoes_jogo')
              .update({ finalizada: true, pontos, acertos, tentativas })
              .eq('id_sessao', finalSessionId)
          } catch (err) {
            console.error('[DEBUG] Erro no cleanup:', err)
          }
        })()
      }
    }
  }, [])

  // Carregar animação confetti e nome da criança
  useEffect(() => {
    fetch(ASSETS.confetti)
      .then(res => res.json())
      .then(data => setConfettiAnimation(data))

    const fetchChildName = async () => {
      const activeChildId = typeof window !== 'undefined' ? localStorage.getItem('active_child_id') : null
      if (activeChildId) {
        setChildId(activeChildId)
        const supabase = createClient()
        const { data } = await supabase
          .from('criancas')
          .select('nome_completo')
          .eq('id_crianca', activeChildId)
          .single()
        if (data) setChildName(data.nome_completo)
      }
    }
    fetchChildName()
  }, [])

  // Registrar evento
  const logEvent = useCallback(async (tipo: string, dados?: object) => {
    if (!sessionId) return
    const supabase = createClient()
    
    const payload: any = { ...dados }
    if (tipo === 'spot_clicked') {
      payload.correct = dados && 'hasAnimal' in dados ? dados.hasAnimal : false
    }
    
    await supabase
      .from('eventos_jogo')
      .insert({
        id_sessao: sessionId,
        tipo_evento: tipo,
        dados_adicionais: payload
      })
  }, [sessionId])

  // Gerar posições dos elementos
  const generateHidingSpots = useCallback((levelNum: number) => {
    const config = LEVEL_CONFIG[levelNum as keyof typeof LEVEL_CONFIG]
    const spots: HidingSpot[] = []
    const types: ('tree' | 'rock' | 'bush')[] = ['tree', 'rock', 'bush']
    
    // Gerar elementos
    for (let i = 0; i < config.elementCount; i++) {
      spots.push({
        id: `spot-${i}`,
        type: types[i % types.length],
        x: 10 + (i * (80 / config.elementCount)),
        y: 30 + Math.random() * 40,
        hasAnimal: false
      })
    }
    
    // Distribuir animais aleatoriamente
    const availableAnimals = [...ASSETS.animals].slice(0, config.animalCount)
    const shuffled = [...spots].sort(() => Math.random() - 0.5)
    
    availableAnimals.forEach((animal, idx) => {
      if (shuffled[idx]) {
        shuffled[idx].hasAnimal = true
        shuffled[idx].animalId = animal.id
      }
    })
    
    return spots.sort((a, b) => parseFloat(a.id.split('-')[1]) - parseFloat(b.id.split('-')[1]))
  }, [])

  // Iniciar novo round
  const startNewRound = useCallback(() => {
    if (level >= 3) {
      setPhase('congratulations')
      return
    }

    const spots = generateHidingSpots(level)
    setHidingSpots(spots)
    setClickedSpots([])
    setFoundAnimals([])
    setWrongSpots([])
    setErrorCount(0)
    setShowHint(false)
    
    setPhase('show')
    ttsController.speak('Olhe para os animais!')
    
    // Após 5s iniciar contagem regressiva
    setTimeout(() => {
      setPhase('countdown')
      setCountdown(3)
    }, 5000)
  }, [level, generateHidingSpots])

  // Contagem regressiva
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(c => c - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
    
    if (phase === 'countdown' && countdown === 0) {
      setPhase('hide')
      setTimeout(() => {
        ttsController.speak('Onde estão os animais?')
        setPhase('guess')
        setGuessStartTime(Date.now())
      }, 500)
    }
  }, [phase, countdown])

  // Click em elemento
  const handleSpotClick = async (spotId: string) => {
    if (phase !== 'guess' || clickedSpots.includes(spotId)) return
    
    const spot = hidingSpots.find(s => s.id === spotId)
    if (!spot) return
    
    setClickedSpots([...clickedSpots, spotId])
    setAttempts(a => a + 1)
    
    const reactionTimeMs = guessStartTime ? Date.now() - guessStartTime : null
    
    await logEvent('spot_clicked', {
      spotId,
      hasAnimal: spot.hasAnimal,
      level,
      reactionTimeMs
    })
    
    if (spot.hasAnimal && spot.animalId) {
      // ACERTO
      setFoundAnimals([...foundAnimals, spot.animalId])
      setScore(s => s + 1)
      setErrorCount(0)
      
      await logEvent('animal_found', { animalId: spot.animalId, level })
      
      // Verificar se encontrou todos
      const totalAnimals = hidingSpots.filter(s => s.hasAnimal).length
      if (foundAnimals.length + 1 === totalAnimals) {
        setPhase('reveal')
        setDonState('celebration')
        ttsController.speak('Parabéns! Você encontrou todos os animais!')
        
        setTimeout(() => {
          setLevel(l => l + 1)
          setDonState('game')
          startNewRound()
        }, 3000)
      }
    } else {
      // ERRO
      setWrongSpots([...wrongSpots, spotId])
      const newErrorCount = errorCount + 1
      setErrorCount(newErrorCount)
      
      ttsController.speak('Continue procurando!')
      
      await logEvent('wrong_spot', { spotId, level })
      
      if (newErrorCount >= 2) {
        setShowHint(true)
      }
    }
  }

  // Renderizar
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-green-50 to-blue-50 overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/games')}
          className="bg-white/80 hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="bg-white/80 px-4 py-2 rounded-full">
          <span className="font-bold">{LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG]?.stars || '⭐'}</span>
        </div>
      </div>

      {/* Confete (quando acerta todos) */}
      {phase === 'reveal' && confettiAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Lottie animationData={confettiAnimation} loop={false} />
        </div>
      )}

      {/* Don Mascot */}
      {donState === 'celebration' && phase !== 'congratulations' && (
        <div className="absolute bottom-4 left-4 z-40 animate-bounce">
          <img src={ASSETS.don} alt="Don" className="h-32 w-auto object-contain" />
        </div>
      )}

      {/* Intro */}
      {phase === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <img src={ASSETS.don} alt="Don" className="h-48 w-auto object-contain mb-6 animate-bounce" />
          <h1 className="text-4xl font-bold text-center mb-4 text-green-800">
            Onde estão os animais?
          </h1>
          <p className="text-lg text-center mb-8 text-gray-700 max-w-md">
            Observe onde os animais estão e depois encontre-os escondidos na floresta!
          </p>
          <Button
            onClick={() => startNewRound()}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-xl"
          >
            <Volume2 className="mr-2 h-6 w-6" />
            Começar
          </Button>
        </div>
      )}

      {/* Jogo */}
      {['show', 'countdown', 'hide', 'guess'].includes(phase) && (
        <div className="relative w-full h-screen pt-20 pb-8">
          {/* Contagem regressiva */}
          {phase === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-40">
              <div className="text-9xl font-bold text-white animate-ping">
                {countdown}
              </div>
            </div>
          )}

          {/* Cenário (placeholder - será substituído por layers reais) */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative w-[90%] h-[80%] bg-gradient-to-b from-green-200 to-green-400 rounded-3xl overflow-hidden shadow-2xl">
              
              {/* Elementos escondedores */}
              {hidingSpots.map(spot => (
                <div
                  key={spot.id}
                  className={`absolute transition-all cursor-pointer ${
                    clickedSpots.includes(spot.id) ? 'opacity-50' : ''
                  }`}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => handleSpotClick(spot.id)}
                >
                  {/* Placeholder - será substituído por imagens reais */}
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl ${
                    spot.type === 'tree' ? 'bg-green-700' :
                    spot.type === 'rock' ? 'bg-gray-500' :
                    'bg-green-600'
                  }`}>
                    {spot.type === 'tree' ? '🌳' :
                     spot.type === 'rock' ? '🪨' :
                     '🌿'}
                  </div>
                  
                  {/* Mostrar animais na fase 'show' */}
                  {phase === 'show' && spot.hasAnimal && spot.animalId && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                      <div className="text-5xl animate-bounce">
                        {ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'lion' ? '🦁' :
                         ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'monkey' ? '🐵' :
                         ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'parrot' ? '🦜' :
                         ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'elephant' ? '🐘' :
                         ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'tiger' ? '🐯' :
                         '🦓'}
                      </div>
                    </div>
                  )}
                  
                  {/* Mostrar animais encontrados */}
                  {foundAnimals.includes(spot.animalId || '') && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                      <div className="text-5xl">
                        {ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'lion' ? '🦁' :
                         ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'monkey' ? '🐵' :
                         ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'parrot' ? '🦜' :
                         ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'elephant' ? '🐘' :
                         ASSETS.animals.find(a => a.id === spot.animalId)?.id === 'tiger' ? '🐯' :
                         '🦓'}
                      </div>
                    </div>
                  )}
                  
                  {/* Marcador de erro */}
                  {wrongSpots.includes(spot.id) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl">❌</div>
                    </div>
                  )}
                  
                  {/* Dica após 2 erros */}
                  {showHint && spot.hasAnimal && !foundAnimals.includes(spot.animalId || '') && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
                      <div className="text-4xl">⭐</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Parabéns */}
      {phase === 'congratulations' && !showQuestionnaire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative">
            <div className="flex items-start gap-4 mb-6">
              <img src={ASSETS.don} alt="Don" className="h-20 w-auto object-contain flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-bold text-green-800 mb-2">
                  Você completou todas as 3 fases da atividade!
                </h2>
                <p className="text-lg text-gray-700">
                  Parabéns! Você encontrou todos os animais escondidos na floresta! 🎉
                </p>
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Dica para mamãe e papai:</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Este jogo trabalha <strong>memória visual</strong> e <strong>atenção sustentada</strong>. 
                Crianças que conseguem lembrar onde múltiplos objetos estavam desenvolvem melhor a 
                capacidade de planejamento e organização espacial. Continue estimulando essa habilidade 
                brincando de "esconde-esconde" com objetos no dia a dia!
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setLevel(0)
                  setPhase('intro')
                  setScore(0)
                  setAttempts(0)
                }}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Jogar novamente
              </Button>
              <Button
                onClick={() => setShowQuestionnaire(true)}
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Questionário de Leads */}
      {showQuestionnaire && (
        <LeadQuestionnaire
          childId={childId}
          onComplete={() => {
            router.push('/games')
          }}
          childName={childName}
        />
      )}
    </div>
  )
}
