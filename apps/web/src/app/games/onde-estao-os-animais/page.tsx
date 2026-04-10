'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Lottie from 'lottie-react';
import { LeadQuestionnaire } from '@/components/lead-questionnaire';
import { GAME_ASSETS, getAnimalsList } from '@/config/game-assets';

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

// Assets do Supabase Storage
const ASSETS = {
  don: GAME_ASSETS.shared.mascot.don,
  confetti: GAME_ASSETS.shared.animations.confetti,
  scenery: GAME_ASSETS.ondeEstaoOsAnimais.scenery,
  animals: getAnimalsList(),
}

// Posições fixas dos elementos do cenário (pixel-perfect baseado no layout)
const SCENERY_POSITIONS = [
  // Cabana - canto inferior esquerdo
  { id: 'cabana', type: 'structure' as const, x: 15, y: 75, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.structures[0] },
  // Arbusto - centro inferior
  { id: 'arbusto1', type: 'bush' as const, x: 45, y: 85, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.bushes[0] },
  // Arbusto - direita inferior
  { id: 'arbusto2', type: 'bush' as const, x: 75, y: 80, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.bushes[0] },
  // Árvores - meio esquerda
  { id: 'arvore1', type: 'tree' as const, x: 25, y: 55, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.trees[0] },
  // Árvores - centro
  { id: 'arvore2', type: 'tree' as const, x: 40, y: 50, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.trees[0] },
  // Pinheiros - fundo direita
  { id: 'pinheiro1', type: 'tree' as const, x: 65, y: 45, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.trees[1] },
  // Pinheiros - fundo centro
  { id: 'pinheiro2', type: 'tree' as const, x: 80, y: 48, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.trees[1] },
  // Pedras - direita
  { id: 'pedra1', type: 'rock' as const, x: 85, y: 70, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.rocks[0] },
  // Pedras - direita inferior
  { id: 'pedra2', type: 'rock' as const, x: 70, y: 75, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.rocks[0] },
  // Nuvem - céu
  { id: 'nuvem', type: 'cloud' as const, x: 70, y: 15, image: GAME_ASSETS.ondeEstaoOsAnimais.scenery.clouds[0] },
]

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
  type: 'tree' | 'rock' | 'bush' | 'structure' | 'cloud'
  x: number
  y: number
  hasAnimal: boolean
  animalId?: string
  image?: string
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
      
      // Buscar id_jogo pelo slug
      const { data: jogo, error: jogoError } = await supabase
        .from('jogos')
        .select('id_jogo')
        .eq('slug', 'onde-estao-os-animais')
        .single()
      
      if (jogoError || !jogo) {
        console.error('Erro ao buscar jogo:', jogoError)
        return
      }

      const { data, error } = await supabase
        .from('sessoes_jogo')
        .insert({
          id_crianca: activeChildId,
          id_jogo: jogo.id_jogo,
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

  // Gerar posições dos elementos (usando posições fixas do cenário)
  const generateHidingSpots = useCallback((levelNum: number) => {
    const config = LEVEL_CONFIG[levelNum as keyof typeof LEVEL_CONFIG]
    
    // Selecionar posições baseadas no nível
    let selectedPositions = SCENERY_POSITIONS
    if (levelNum === 0) {
      // Nível 1: 3 elementos (cabana, arbusto, pedra)
      selectedPositions = SCENERY_POSITIONS.filter(p => 
        ['cabana', 'arbusto1', 'pedra1'].includes(p.id)
      )
    } else if (levelNum === 1) {
      // Nível 2: 5 elementos
      selectedPositions = SCENERY_POSITIONS.filter(p => 
        ['cabana', 'arbusto1', 'arbusto2', 'arvore1', 'pedra1'].includes(p.id)
      )
    }
    // Nível 3: usa todos os 10 elementos
    
    const spots: HidingSpot[] = selectedPositions.map(pos => ({
      id: pos.id,
      type: pos.type,
      x: pos.x,
      y: pos.y,
      hasAnimal: false,
      image: pos.image,
    }))
    
    // Distribuir animais aleatoriamente
    const availableAnimals = [...ASSETS.animals].slice(0, config.animalCount)
    const shuffled = [...spots].sort(() => Math.random() - 0.5)
    
    availableAnimals.forEach((animal, idx) => {
      if (shuffled[idx]) {
        shuffled[idx].hasAnimal = true
        shuffled[idx].animalId = animal.id
      }
    })
    
    return spots
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
    <main 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `url(${ASSETS.scenery.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Estilos CSS para animação de respiração */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .animal-breathe {
          animation: breathe 2s ease-in-out infinite;
        }
      `}</style>
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/games')}
          className="bg-white/80 hover:bg-white shadow-lg pointer-events-auto"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {/* Indicador de nível - só aparece durante o jogo, não na intro */}
        {phase !== 'intro' && (
          <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg">
            <span className="font-bold text-lg">{LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG]?.stars || '⭐'}</span>
          </div>
        )}
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
          <img src={ASSETS.don} alt="Don" className="h-32 w-auto object-contain drop-shadow-2xl" />
        </div>
      )}

      {/* Intro */}
      {phase === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-black/30">
          <img src={ASSETS.don} alt="Don" className="h-48 w-auto object-contain mb-6 animate-bounce drop-shadow-2xl" />
          <h1 className="text-4xl font-bold text-center mb-4 text-white drop-shadow-lg">
            Onde estão os animais?
          </h1>
          <p className="text-lg text-center mb-8 text-white/90 max-w-md drop-shadow-md">
            Observe onde os animais estão e depois encontre-os escondidos na floresta!
          </p>
          <Button
            onClick={() => startNewRound()}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-xl shadow-xl"
          >
            <Play className="mr-2 h-6 w-6" />
            Começar
          </Button>
        </div>
      )}

      {/* Jogo */}
      {['show', 'countdown', 'hide', 'guess'].includes(phase) && (
        <div className="relative w-full h-screen pt-20 pb-8">
          {/* Contagem regressiva */}
          {phase === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-40">
              <div className="text-9xl font-bold text-white animate-ping drop-shadow-2xl">
                {countdown}
              </div>
            </div>
          )}

          {/* Área de jogo - já tem o background da tela inteira */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full">
              
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
                  {/* Elemento do cenário (imagem real na posição fixa) */}
                  <img 
                    src={spot.image}
                    alt={spot.type}
                    className="w-32 h-32 object-contain drop-shadow-lg hover:scale-110 transition-transform"
                  />
                  
                  {/* Mostrar animais na fase 'show' - posicionados ao lado da estrutura */}
                  {phase === 'show' && spot.hasAnimal && spot.animalId && (
                    <div className={`
                      absolute animal-breathe drop-shadow-xl
                      ${spot.type === 'structure' ? '-right-16 top-0' : ''}
                      ${spot.type === 'tree' ? '-left-12 -top-4' : ''}
                      ${spot.type === 'bush' ? '-right-12 top-2' : ''}
                      ${spot.type === 'rock' ? '-left-10 top-0' : ''}
                    `}>
                      <img 
                        src={ASSETS.animals.find(a => a.id === spot.animalId)?.image}
                        alt={ASSETS.animals.find(a => a.id === spot.animalId)?.name}
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                  )}
                  
                  {/* Mostrar animais encontrados - aparecem de novo ao clicar */}
                  {foundAnimals.includes(spot.animalId || '') && (
                    <div className={`
                      absolute drop-shadow-xl
                      ${spot.type === 'structure' ? '-right-16 top-0' : ''}
                      ${spot.type === 'tree' ? '-left-12 -top-4' : ''}
                      ${spot.type === 'bush' ? '-right-12 top-2' : ''}
                      ${spot.type === 'rock' ? '-left-10 top-0' : ''}
                    `}>
                      <img 
                        src={ASSETS.animals.find(a => a.id === spot.animalId)?.image}
                        alt={ASSETS.animals.find(a => a.id === spot.animalId)?.name}
                        className="w-20 h-20 object-contain"
                      />
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
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-pulse">
                      <div className="text-4xl drop-shadow-lg">⭐</div>
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
    </main>
  )
}
