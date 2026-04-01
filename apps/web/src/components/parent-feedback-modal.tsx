'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { STORAGE } from '@/lib/storage'
import { createClient } from '@/lib/supabase-client'

interface ParentFeedbackModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  sessionId: string | null
  completedLevels: number
  correctCount: number
}

export function ParentFeedbackModal({
  open,
  onClose,
  onSuccess,
  sessionId,
  completedLevels,
  correctCount
}: ParentFeedbackModalProps) {
  const [childBehavior, setChildBehavior] = useState('')
  const [childInteraction, setChildInteraction] = useState('')
  const [parentDifficulty, setParentDifficulty] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionId) return

    setLoading(true)
    const supabase = createClient()

    try {
      await supabase.from('eventos_jogo').insert({
        id_sessao: sessionId,
        tipo_evento: 'parent_feedback',
        dados_adicionais: {
          type: 'parent_feedback',
          child_behavior: childBehavior,
          child_interaction: childInteraction,
          parent_difficulty: parentDifficulty,
          completed_levels: completedLevels,
          correct_count: correctCount
        }
      })

      onClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error saving parent feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={STORAGE.images.donCabeca} 
              alt="Don" 
              className="w-20 h-20"
            />
            <DialogTitle className="text-2xl font-bold text-[#234c38]">
              Momento do Responsável
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="bg-[#edf4f0] p-4 rounded-2xl mb-6">
          <p className="text-[#234c38] font-bold mb-2 text-lg">
            O Raízes não substitui o adulto.
          </p>
          <p className="text-[#3a5144]">
            Ele organiza o estímulo, orienta o pai e transforma minutos comuns do dia em{' '}
            <strong>desenvolvimento cerebral intencional</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1: Child Behavior */}
          <div className="space-y-3">
            <Label className="text-[#234c38] font-bold text-base">
              Meu filho:
            </Label>
            <RadioGroup value={childBehavior} onValueChange={setChildBehavior} required>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border-2 border-[#edf4f0] hover:border-[#234c38] transition-colors">
                <RadioGroupItem value="found_alone" id="found_alone" />
                <Label htmlFor="found_alone" className="cursor-pointer flex-1">
                  Achou sozinho
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border-2 border-[#edf4f0] hover:border-[#234c38] transition-colors">
                <RadioGroupItem value="needed_help" id="needed_help" />
                <Label htmlFor="needed_help" className="cursor-pointer flex-1">
                  Precisou de ajuda
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border-2 border-[#edf4f0] hover:border-[#234c38] transition-colors">
                <RadioGroupItem value="not_interested" id="not_interested" />
                <Label htmlFor="not_interested" className="cursor-pointer flex-1">
                  Não se interessou
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question 2: Child Interaction */}
          <div className="space-y-3">
            <Label className="text-[#234c38] font-bold text-base">
              Durante a atividade, ele:
            </Label>
            <RadioGroup value={childInteraction} onValueChange={setChildInteraction} required>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border-2 border-[#edf4f0] hover:border-[#234c38] transition-colors">
                <RadioGroupItem value="looked_at_me" id="looked_at_me" />
                <Label htmlFor="looked_at_me" className="cursor-pointer flex-1">
                  Olhou para mim
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border-2 border-[#edf4f0] hover:border-[#234c38] transition-colors">
                <RadioGroupItem value="pointed" id="pointed" />
                <Label htmlFor="pointed" className="cursor-pointer flex-1">
                  Apontou
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border-2 border-[#edf4f0] hover:border-[#234c38] transition-colors">
                <RadioGroupItem value="vocalized" id="vocalized" />
                <Label htmlFor="vocalized" className="cursor-pointer flex-1">
                  Vocalizou/fez som
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question 3: Parent Difficulty */}
          <div className="space-y-3">
            <Label className="text-[#234c38] font-bold text-base">
              Como foi pra mim:
            </Label>
            <RadioGroup value={parentDifficulty} onValueChange={setParentDifficulty} required>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border-2 border-[#edf4f0] hover:border-[#234c38] transition-colors">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy" className="cursor-pointer flex-1">
                  Fácil
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border-2 border-[#edf4f0] hover:border-[#234c38] transition-colors">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer flex-1">
                  Médio
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border-2 border-[#edf4f0] hover:border-[#234c38] transition-colors">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard" className="cursor-pointer flex-1">
                  Difícil
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            disabled={loading || !childBehavior || !childInteraction || !parentDifficulty}
            className="w-full bg-[#234c38] hover:bg-[#1d3f2f] text-white font-bold rounded-full py-6 text-lg"
          >
            {loading ? 'Enviando...' : 'Enviar Feedback'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
