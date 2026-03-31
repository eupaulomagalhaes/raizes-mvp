'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface ParentReportModalProps {
  open: boolean
  onClose: () => void
  childId: string
  childName: string
}

interface Feedback {
  sessionId: string
  timestamp: string
  child_behavior: string
  child_interaction: string
  parent_difficulty: string
  completed_levels?: number
  correct_count?: number
}

interface GameProgress {
  sessions: number
  totalAttempts: number
  totalCorrect: number
  totalErrors: number
  accuracy: number
  avgLevel: number
}

const getBehaviorLabel = (value: string) => {
  const labels: Record<string, string> = {
    found_alone: 'Achou sozinho',
    needed_help: 'Precisou de ajuda',
    not_interested: 'Não se interessou'
  }
  return labels[value] || value
}

const getInteractionLabel = (value: string) => {
  const labels: Record<string, string> = {
    looked_at_me: 'Olhou para mim',
    pointed: 'Apontou',
    vocalized: 'Vocalizou/fez som'
  }
  return labels[value] || value
}

const getDifficultyLabel = (value: string) => {
  const labels: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil'
  }
  return labels[value] || value
}

export function ParentReportModal({ open, onClose, childId, childName }: ParentReportModalProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && childId) {
      loadData()
    }
  }, [open, childId])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Buscar sessões da criança
      const { data: sessions } = await supabase
        .from('sessoes_jogo')
        .select('id_sessao, id_crianca')
        .eq('id_crianca', childId)
        .eq('id_jogo', 'onde-esta-o-brinquedo')

      if (!sessions || sessions.length === 0) {
        setFeedbacks([])
        setGameProgress({
          sessions: 0,
          totalAttempts: 0,
          totalCorrect: 0,
          totalErrors: 0,
          accuracy: 0,
          avgLevel: 0
        })
        setLoading(false)
        return
      }

      const sessionIds = sessions.map(s => s.id_sessao)

      // Buscar feedbacks dos pais
      const { data: feedbackData } = await supabase
        .from('eventos_jogo')
        .select('id_sessao, data_hora, dados_adicionais')
        .in('id_sessao', sessionIds)
        .eq('tipo_evento', 'parent_feedback')
        .order('data_hora', { ascending: false })

      const formattedFeedbacks: Feedback[] = (feedbackData || []).map(f => ({
        sessionId: f.id_sessao,
        timestamp: f.data_hora,
        child_behavior: f.dados_adicionais?.child_behavior || '',
        child_interaction: f.dados_adicionais?.child_interaction || '',
        parent_difficulty: f.dados_adicionais?.parent_difficulty || '',
        completed_levels: f.dados_adicionais?.completed_levels,
        correct_count: f.dados_adicionais?.correct_count
      }))

      setFeedbacks(formattedFeedbacks)

      // Calcular métricas gerais
      const { data: events } = await supabase
        .from('eventos_jogo')
        .select('tipo_evento, dados_adicionais')
        .in('id_sessao', sessionIds)

      let totalCorrect = 0
      let totalErrors = 0
      let totalAttempts = 0
      let totalLevel = 0
      let levelCount = 0

      events?.forEach(e => {
        if (e.tipo_evento === 'correct_answer') {
          totalCorrect++
          totalAttempts++
          if (e.dados_adicionais?.level !== undefined) {
            totalLevel += e.dados_adicionais.level
            levelCount++
          }
        } else if (e.tipo_evento === 'wrong_answer') {
          totalErrors++
          totalAttempts++
        }
      })

      setGameProgress({
        sessions: sessions.length,
        totalAttempts,
        totalCorrect,
        totalErrors,
        accuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
        avgLevel: levelCount > 0 ? totalLevel / levelCount : 0
      })
    } catch (error) {
      console.error('Error loading parent report:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-[#234c38]">
              Relatório do Responsável
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-[#edf4f0] p-4 rounded-2xl">
            <h3 className="font-bold text-[#234c38] mb-2">
              Feedback sobre: {childName}
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-[#3a5144]">Carregando...</div>
          ) : (
            <>
              {/* Métricas das Sessões */}
              {gameProgress && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border-2 border-[#edf4f0]">
                    <div className="text-sm text-[#3a5144] mb-1">Sessões</div>
                    <div className="text-2xl font-bold text-[#234c38]">
                      {gameProgress.sessions}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-[#edf4f0]">
                    <div className="text-sm text-[#3a5144] mb-1">Acertos</div>
                    <div className="text-2xl font-bold text-green-600">
                      {gameProgress.totalCorrect}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-[#edf4f0]">
                    <div className="text-sm text-[#3a5144] mb-1">Erros</div>
                    <div className="text-2xl font-bold text-red-600">
                      {gameProgress.totalErrors}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-[#edf4f0]">
                    <div className="text-sm text-[#3a5144] mb-1">Acurácia</div>
                    <div className="text-2xl font-bold text-[#234c38]">
                      {(gameProgress.accuracy * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Feedbacks */}
              <div>
                <h3 className="font-bold text-[#234c38] mb-4">
                  Histórico de Feedbacks ({feedbacks.length})
                </h3>

                {feedbacks.length === 0 ? (
                  <p className="text-[#3a5144] text-center py-8">
                    Nenhum feedback registrado ainda.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.map((feedback, index) => (
                      <div
                        key={index}
                        className="bg-white border-2 border-[#edf4f0] rounded-xl p-4"
                      >
                        <div className="text-sm text-[#3a5144] mb-3 font-semibold">
                          {new Date(feedback.timestamp).toLocaleDateString('pt-BR')} -{' '}
                          {new Date(feedback.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        <div className="space-y-2">
                          <div>
                            <strong className="text-[#234c38]">Comportamento da criança:</strong>{' '}
                            <span className="text-[#3a5144]">
                              {getBehaviorLabel(feedback.child_behavior)}
                            </span>
                          </div>
                          <div>
                            <strong className="text-[#234c38]">Interação durante a atividade:</strong>{' '}
                            <span className="text-[#3a5144]">
                              {getInteractionLabel(feedback.child_interaction)}
                            </span>
                          </div>
                          <div>
                            <strong className="text-[#234c38]">Dificuldade para o pai:</strong>{' '}
                            <span className="text-[#3a5144]">
                              {getDifficultyLabel(feedback.parent_difficulty)}
                            </span>
                          </div>
                          {feedback.completed_levels !== undefined && (
                            <div>
                              <strong className="text-[#234c38]">Níveis completados:</strong>{' '}
                              <span className="text-[#3a5144]">{feedback.completed_levels}</span>
                            </div>
                          )}
                          {feedback.correct_count !== undefined && (
                            <div>
                              <strong className="text-[#234c38]">Acertos:</strong>{' '}
                              <span className="text-[#3a5144]">{feedback.correct_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
