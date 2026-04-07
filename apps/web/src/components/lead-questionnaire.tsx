'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronRight, ChevronLeft, Sparkles, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface LeadQuestionnaireProps {
  onComplete: () => void
  childId: string
  childName?: string
}

interface StepOption {
  value: string
  label: string
  highlight?: boolean
}

interface Step {
  id: string
  title: string
  question: string
  type: 'single' | 'multiple'
  highlight?: boolean
  options: StepOption[]
}

const STEPS: Step[] = [
  {
    id: 'diagnosis',
    title: 'Situação Atual',
    question: 'A criança já possui algum diagnóstico ou dificuldade de aprendizagem?',
    type: 'single',
    options: [
      { value: 'diagnosed', label: 'Sim, possui diagnóstico' },
      { value: 'difficulties', label: 'Apresenta dificuldades, mas sem diagnóstico' },
      { value: 'stimulate', label: 'Não, mas quero estimular o desenvolvimento' },
      { value: 'no_info', label: 'Prefiro não informar' },
    ],
  },
  {
    id: 'challenges',
    title: 'Principais Desafios',
    question: 'Quais são as maiores dificuldades que você percebe?',
    type: 'multiple',
    options: [
      { value: 'concentration', label: 'Concentração' },
      { value: 'memory', label: 'Memória' },
      { value: 'learning', label: 'Aprendizagem escolar' },
      { value: 'language', label: 'Linguagem/fala' },
      { value: 'behavior', label: 'Comportamento' },
      { value: 'other', label: 'Outro' },
    ],
  },
  {
    id: 'interest',
    title: 'Acesso Antecipado',
    question: 'Você teria interesse em testar gratuitamente antes do lançamento?',
    type: 'single',
    highlight: true,
    options: [
      { value: 'yes', label: '🎁 Sim, quero acesso antecipado!', highlight: true },
      { value: 'maybe', label: 'Talvez, quero saber mais' },
      { value: 'no', label: 'Não tenho interesse agora' },
    ],
  },
  {
    id: 'benefit',
    title: 'Objetivo Principal',
    question: 'O que você mais gostaria de melhorar no desenvolvimento da criança?',
    type: 'multiple',
    options: [
      { value: 'performance', label: 'Melhor desempenho escolar' },
      { value: 'focus', label: 'Mais foco e atenção' },
      { value: 'emotional', label: 'Desenvolvimento emocional' },
      { value: 'autonomy', label: 'Autonomia' },
      { value: 'other', label: 'Outro' },
    ],
  },
  {
    id: 'digital_usage',
    title: 'Uso de Tecnologia',
    question: 'A criança utiliza celular ou tablet com frequência?',
    type: 'single',
    options: [
      { value: 'daily', label: 'Sim, todos os dias' },
      { value: 'weekly', label: 'Algumas vezes na semana' },
      { value: 'rarely', label: 'Raramente' },
      { value: 'never', label: 'Não utiliza' },
    ],
  },
  {
    id: 'vip',
    title: '🌟 Última Etapa',
    question: 'Quer entrar no grupo VIP com acesso exclusivo e vagas limitadas?',
    type: 'single',
    highlight: true,
    options: [
      { value: 'yes', label: '⭐ Sim, quero fazer parte!', highlight: true },
      { value: 'no', label: 'Não, obrigado' },
    ],
  },
]

export function LeadQuestionnaire({ onComplete, childId, childName }: LeadQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({
    diagnosis: '',
    challenges: [],
    interest: '',
    benefit: [],
    digital_usage: '',
    vip: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStepData = STEPS[currentStep]
  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleSingleChoice = (value: string) => {
    setAnswers({ ...answers, [currentStepData.id]: value })
  }

  const handleMultipleChoice = (value: string, checked: boolean) => {
    const current = answers[currentStepData.id] || []
    if (checked) {
      setAnswers({ ...answers, [currentStepData.id]: [...current, value] })
    } else {
      setAnswers({ ...answers, [currentStepData.id]: current.filter((v: string) => v !== value) })
    }
  }

  const canProceed = () => {
    const answer = answers[currentStepData.id]
    if (currentStepData.type === 'single') return !!answer
    if (currentStepData.type === 'multiple') return answer && answer.length > 0
    return false
  }

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Última etapa - salvar e finalizar
      await saveAnswers()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveAnswers = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      await supabase.from('questionario_leads').insert({
        id_crianca: childId,
        situacao_diagnostico: answers.diagnosis,
        desafios: answers.challenges,
        interesse_teste: answers.interest,
        beneficio_desejado: answers.benefit,
        uso_digital: answers.digital_usage,
        grupo_vip: answers.vip,
        data_resposta: new Date().toISOString(),
      })

      onComplete()
    } catch (error) {
      console.error('Erro ao salvar questionário:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-[#234c38] to-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            {childName && currentStep === 0 && (
              <p className="text-[#234c38] font-semibold">
                Sobre: <span className="text-green-600">{childName}</span>
              </p>
            )}
            {currentStepData.highlight && (
              <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                Vagas Limitadas
              </div>
            )}
            <h3 className="text-xl font-bold text-[#234c38]">{currentStepData.title}</h3>
            <p className="text-gray-600 text-sm">
              Etapa {currentStep + 1} de {STEPS.length}
            </p>
          </div>

          {/* Question */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-gray-800 font-medium text-center">
              {currentStepData.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentStepData.type === 'single' ? (
              <RadioGroup
                value={answers[currentStepData.id]}
                onValueChange={handleSingleChoice}
              >
                {currentStepData.options.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-[#234c38] ${
                      answers[currentStepData.id] === option.value
                        ? 'border-[#234c38] bg-green-50'
                        : 'border-gray-200'
                    } ${option.highlight ? 'bg-gradient-to-r from-yellow-50 to-green-50' : ''}`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-3">
                {currentStepData.options.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-[#234c38] ${
                      answers[currentStepData.id]?.includes(option.value)
                        ? 'border-[#234c38] bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <Checkbox
                      id={option.value}
                      checked={answers[currentStepData.id]?.includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleMultipleChoice(option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 text-base"
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 h-12 bg-[#234c38] hover:bg-[#1a3829] text-white text-base font-semibold"
            >
              {isSubmitting ? (
                'Salvando...'
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <Gift className="w-5 h-5 mr-2" />
                  Finalizar
                </>
              ) : (
                <>
                  Continuar
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
