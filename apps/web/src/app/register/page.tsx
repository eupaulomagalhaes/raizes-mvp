'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Eye, EyeOff, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

const STEPS = [
  { heading: 'Conta de Acesso', speech: 'Comece criando seu login para seguir com o cadastro.' },
  { heading: 'Dados do Responsável', speech: 'Agora precisamos conhecer um pouco mais sobre você.' },
  { heading: 'Dados da Criança', speech: 'Vamos falar sobre a criança?' },
  { heading: 'Terapias', speech: 'Isso nos ajuda a apoiar com mais carinho.' },
  { heading: 'Confirmação', speech: 'Revise tudo com atenção antes de concluir.' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    u_nome: '',
    u_nasc: '',
    u_cel: '',
    u_parentesco: '',
    u_escolaridade: '',
    u_prof: '',
    u_cidade: '',
    c_nome: '',
    c_nasc: '',
    c_sexo: '',
    c_estuda: 'false',
    c_tipo_escola: '',
    c_terapia: 'false',
    c_tipos: '',
    c_outras: '',
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Erro ao criar usuário')
      setLoading(false)
      return
    }

    // Inserir dados do responsável
    const { error: userError } = await supabase.from('usuarios').insert({
      id_usuario: authData.user.id,
      nome_completo: formData.u_nome,
      data_nascimento: formData.u_nasc,
      parentesco: formData.u_parentesco,
      escolaridade: formData.u_escolaridade,
      profissao: formData.u_prof,
      email: formData.email,
      celular: formData.u_cel,
      cidade_estado: formData.u_cidade,
    })

    if (userError) {
      setError('Erro ao salvar dados do responsável')
      setLoading(false)
      return
    }

    // Inserir dados da criança
    const { error: childError } = await supabase.from('criancas').insert({
      id_responsavel: authData.user.id,
      nome_completo: formData.c_nome,
      data_nascimento: formData.c_nasc,
      sexo: formData.c_sexo,
      estuda: formData.c_estuda === 'true',
      tipo_escola: formData.c_tipo_escola,
      terapia: formData.c_terapia === 'true',
      tipos_terapia: formData.c_tipos ? [formData.c_tipos] : null,
      outras_terapias: formData.c_outras,
    })

    if (childError) {
      setError('Erro ao salvar dados da criança')
      setLoading(false)
      return
    }

    router.push('/games')
    router.refresh()
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="seunome@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Crie sua senha"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#234c38]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u_nome">Nome Completo *</Label>
              <Input
                id="u_nome"
                value={formData.u_nome}
                onChange={(e) => updateField('u_nome', e.target.value)}
                placeholder="Digite seu nome aqui..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u_nasc">Data de Nascimento *</Label>
              <Input
                id="u_nasc"
                type="date"
                value={formData.u_nasc}
                onChange={(e) => updateField('u_nasc', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u_cel">Celular *</Label>
              <Input
                id="u_cel"
                value={formData.u_cel}
                onChange={(e) => updateField('u_cel', e.target.value)}
                placeholder="(00) 0 0000-0000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u_parentesco">Grau de Parentesco *</Label>
              <select
                id="u_parentesco"
                value={formData.u_parentesco}
                onChange={(e) => updateField('u_parentesco', e.target.value)}
                className="w-full border rounded-xl px-4 py-3 bg-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="mae">Mãe</option>
                <option value="pai">Pai</option>
                <option value="responsavel">Responsável</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u_escolaridade">Escolaridade *</Label>
              <select
                id="u_escolaridade"
                value={formData.u_escolaridade}
                onChange={(e) => updateField('u_escolaridade', e.target.value)}
                className="w-full border rounded-xl px-4 py-3 bg-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="fundamental">Fundamental</option>
                <option value="medio">Médio</option>
                <option value="superior">Superior</option>
                <option value="pos">Pós/Outros</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u_prof">Profissão *</Label>
              <Input
                id="u_prof"
                value={formData.u_prof}
                onChange={(e) => updateField('u_prof', e.target.value)}
                placeholder="Digite sua profissão..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u_cidade">Cidade/Estado *</Label>
              <Input
                id="u_cidade"
                value={formData.u_cidade}
                onChange={(e) => updateField('u_cidade', e.target.value)}
                placeholder="Ex: São Paulo/SP"
                required
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c_nome">Nome da criança *</Label>
              <Input
                id="c_nome"
                value={formData.c_nome}
                onChange={(e) => updateField('c_nome', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c_nasc">Data de nascimento *</Label>
              <Input
                id="c_nasc"
                type="date"
                value={formData.c_nasc}
                onChange={(e) => updateField('c_nasc', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c_sexo">Sexo</Label>
              <select
                id="c_sexo"
                value={formData.c_sexo}
                onChange={(e) => updateField('c_sexo', e.target.value)}
                className="w-full border rounded-xl px-4 py-3 bg-white"
              >
                <option value="">Selecione...</option>
                <option value="f">Feminino</option>
                <option value="m">Masculino</option>
                <option value="n">Prefiro não dizer</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c_estuda">Estuda?</Label>
              <select
                id="c_estuda"
                value={formData.c_estuda}
                onChange={(e) => updateField('c_estuda', e.target.value)}
                className="w-full border rounded-xl px-4 py-3 bg-white"
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            {formData.c_estuda === 'true' && (
              <div className="space-y-2">
                <Label htmlFor="c_tipo_escola">Tipo de Escola</Label>
                <Input
                  id="c_tipo_escola"
                  value={formData.c_tipo_escola}
                  onChange={(e) => updateField('c_tipo_escola', e.target.value)}
                  placeholder="Pública, Particular, etc."
                />
              </div>
            )}
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c_terapia">Faz algum tipo de terapia?</Label>
              <select
                id="c_terapia"
                value={formData.c_terapia}
                onChange={(e) => updateField('c_terapia', e.target.value)}
                className="w-full border rounded-xl px-4 py-3 bg-white"
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            {formData.c_terapia === 'true' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="c_tipos">Tipo(s) de Terapia</Label>
                  <select
                    id="c_tipos"
                    value={formData.c_tipos}
                    onChange={(e) => updateField('c_tipos', e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 bg-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="fonoaudiologia">Fonoaudiologia</option>
                    <option value="terapia_ocupacional">Terapia Ocupacional</option>
                    <option value="psicologia">Psicologia</option>
                    <option value="psicopedagogia">Psicopedagogia</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c_outras">Outras Terapias</Label>
                  <Input
                    id="c_outras"
                    value={formData.c_outras}
                    onChange={(e) => updateField('c_outras', e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </>
            )}
          </div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-[#edf4f0] rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-[#234c38]">Responsável</h3>
              <p><span className="font-semibold">Nome:</span> {formData.u_nome}</p>
              <p><span className="font-semibold">Email:</span> {formData.email}</p>
              <p><span className="font-semibold">Celular:</span> {formData.u_cel}</p>
            </div>
            <div className="bg-[#edf4f0] rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-[#234c38]">Criança</h3>
              <p><span className="font-semibold">Nome:</span> {formData.c_nome}</p>
              <p><span className="font-semibold">Nascimento:</span> {formData.c_nasc}</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6fff9] to-[#e9f7f0] flex flex-col">
      {/* Header com progresso */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          {step > 1 && (
            <button onClick={handleBack} className="p-2 rounded-full hover:bg-white/50">
              <ChevronLeft size={24} className="text-[#234c38]" />
            </button>
          )}
          <h1 className="text-xl font-bold text-[#234c38]">{STEPS[step - 1].heading}</h1>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full ${
                idx < step ? 'bg-[#234c38]' : 'bg-[#234c38]/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6">
        <Card className="bg-white rounded-3xl shadow-xl border-0">
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}
            {renderStep()}
          </CardContent>
        </Card>

        {/* Mascot speech */}
        <div className="flex items-center gap-4 mt-6">
          <img
            src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/don_mascote_final.png"
            alt="Don"
            className="w-20 h-auto"
          />
          <div className="relative bg-white rounded-2xl p-4 shadow-lg flex-1">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-white" />
            <p className="text-[#234c38] font-bold text-sm">
              {STEPS[step - 1].speech}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {step < 5 ? (
            <Button
              onClick={handleNext}
              className="w-full bg-[#234c38] hover:bg-[#1d3f2f] text-white font-bold rounded-full py-6 text-lg"
            >
              Continuar <ChevronRight className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#234c38] hover:bg-[#1d3f2f] text-white font-bold rounded-full py-6 text-lg"
            >
              {loading ? 'Criando conta...' : <><Check className="mr-2" /> Concluir Cadastro</>}
            </Button>
          )}

          <p className="text-center text-sm text-[#3a5144]">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#234c38] font-bold underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
