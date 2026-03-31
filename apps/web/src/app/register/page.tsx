'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { STORAGE } from '@/lib/storage'
import toast, { Toaster } from 'react-hot-toast'

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
  const [showPassword2, setShowPassword2] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [emailExists, setEmailExists] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
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

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}-${digits.slice(3, 7)} ${digits.slice(7)}`
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`
    } else if (digits.length > 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`
    } else if (digits.length > 2) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    } else if (digits.length > 0) {
      return `(${digits}`
    }
    return ''
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    updateField('u_cel', formatted)
  }

  const [cities, setCities] = useState<Array<{ id_cidade: number; cidade_uf: string }>>([])
  const [citySearch, setCitySearch] = useState('')

  useEffect(() => {
    const fetchCities = async () => {
      if (!citySearch || citySearch.length < 2) {
        setCities([])
        return
      }

      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('cidades')
          .select('id_cidade, cidade_uf')
          .ilike('cidade_uf', `%${citySearch}%`)
          .limit(20)

        setCities(data || [])
      } catch (err) {
        console.error('Erro ao buscar cidades:', err)
        setCities([])
      }
    }

    const timer = setTimeout(fetchCities, 300)
    return () => clearTimeout(timer)
  }, [citySearch])

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCitySearch(value)
    updateField('u_cidade', value)
  }

  useEffect(() => {
    const checkEmailAvailability = async () => {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(formData.email)) {
        setEmailExists(false)
        setCheckingEmail(false)
        return
      }

      setCheckingEmail(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('usuarios')
          .select('email')
          .eq('email', formData.email)
          .maybeSingle()

        if (!error && data) {
          setEmailExists(true)
        } else {
          setEmailExists(false)
        }
      } catch (err) {
        console.error('Erro ao verificar email:', err)
        setEmailExists(false)
      }
      setCheckingEmail(false)
    }

    const timer = setTimeout(checkEmailAvailability, 500)
    return () => clearTimeout(timer)
  }, [formData.email])

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.email.trim()) {
        errors.email = 'Campo obrigatório'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(formData.email)) {
        errors.email = 'E-mail inválido'
      } else if (emailExists) {
        errors.email = 'E-mail já cadastrado! Use outro e-mail.'
      }
      if (!formData.password.trim()) {
        errors.password = 'Campo obrigatório'
      } else if (formData.password.length < 6) {
        errors.password = 'Senha deve ter no mínimo 6 caracteres'
      }
      if (!formData.password2.trim()) {
        errors.password2 = 'Campo obrigatório'
      } else if (formData.password !== formData.password2) {
        errors.password2 = 'Senha não é a mesma'
      }
    } else if (step === 2) {
      if (!formData.u_nome.trim()) errors.u_nome = 'Campo obrigatório'
      if (!formData.u_nasc.trim()) errors.u_nasc = 'Campo obrigatório'
      if (!formData.u_cel.trim()) errors.u_cel = 'Campo obrigatório'
      if (!formData.u_parentesco.trim()) errors.u_parentesco = 'Campo obrigatório'
      if (!formData.u_escolaridade.trim()) errors.u_escolaridade = 'Campo obrigatório'
      if (!formData.u_prof.trim()) errors.u_prof = 'Campo obrigatório'
      if (!formData.u_cidade.trim()) errors.u_cidade = 'Campo obrigatório'
    } else if (step === 3) {
      if (!formData.c_nome.trim()) errors.c_nome = 'Campo obrigatório'
      if (!formData.c_nasc.trim()) errors.c_nasc = 'Campo obrigatório'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      toast.error('Preencha os campos obrigatórios (*) para continuar.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fff',
          color: '#b02035',
          fontWeight: '600',
          padding: '16px',
          borderRadius: '12px',
        },
      })
      return
    }

    if (step < 5) {
      setFieldErrors({})
      setStep(step + 1)
    } else {
      await handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.push('/')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

    if (authError) {
      const errorMsg = authError.message.includes('already registered') 
        ? 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.'
        : authError.message.includes('Invalid email')
        ? 'E-mail inválido'
        : authError.message.includes('Password')
        ? 'Senha inválida. Use no mínimo 6 caracteres.'
        : authError.message
      setError(errorMsg)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Erro ao criar usuário')
      setLoading(false)
      return
    }

    // Verificar se já existe usuário antes de inserir
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('id_usuario', authData.user.id)
      .maybeSingle()

    if (!existingUser) {
      const { error: userError } = await supabase.from('usuarios').insert({
        id_usuario: authData.user.id,
        nome_completo: formData.u_nome,
        data_nascimento: formData.u_nasc,
        parentesco: formData.u_parentesco,
        escolaridade: formData.u_escolaridade,
        profissao: formData.u_prof,
        email: formData.email,
        celular: formData.u_cel.replace(/\D/g, ''),
        cidade_estado: formData.u_cidade,
      })

      if (userError) {
        setError('Erro ao salvar dados do responsável: ' + userError.message)
        setLoading(false)
        return
      }
    }

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
      setError('Erro ao salvar dados da criança: ' + childError.message)
      setLoading(false)
      return
    }

    router.push('/games')
    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      setError(err?.message || 'Erro ao criar conta')
      setLoading(false)
    }
  }

  const formatDateToBR = (dateString: string) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block font-bold text-[#52462a] text-[0.95rem]">E-mail *</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  updateField('email', e.target.value)
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: '' }))
                  }
                  setEmailExists(false)
                }}
                placeholder="seunome@email.com"
                className={`w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)] ${
                  fieldErrors.email || emailExists ? 'border-2 !border-[#e63946] shadow-[inset_0_3px_6px_rgba(230,57,70,0.18)]' : ''
                }`}
                required
              />
              {(fieldErrors.email || emailExists) && (
                <p className="text-[#b02035] text-[0.8rem] font-semibold mt-[0.35rem]">* {fieldErrors.email || 'E-mail já cadastrado! Use outro e-mail.'}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block font-bold text-[#52462a] text-[0.95rem]">Senha *</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    updateField('password', e.target.value)
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }))
                    }
                  }}
                  placeholder="Crie sua senha"
                  minLength={6}
                  className={`w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)] ${
                    fieldErrors.password ? 'border-2 !border-[#e63946] shadow-[inset_0_3px_6px_rgba(230,57,70,0.18)]' : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[0.65rem] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[1.35rem] leading-none p-1 flex items-center justify-center"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[#b02035] text-[0.8rem] font-semibold mt-[0.35rem]">* {fieldErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password2" className="block font-bold text-[#52462a] text-[0.95rem]">Confirme sua senha *</label>
              <div className="relative">
                <input
                  id="password2"
                  type={showPassword2 ? 'text' : 'password'}
                  value={formData.password2}
                  onChange={(e) => {
                    updateField('password2', e.target.value)
                    if (fieldErrors.password2) {
                      setFieldErrors(prev => ({ ...prev, password2: '' }))
                    }
                  }}
                  placeholder="Repita a senha"
                  minLength={6}
                  className={`w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)] ${
                    fieldErrors.password2 || (formData.password2 && formData.password !== formData.password2) ? 'border-2 !border-[#e63946] shadow-[inset_0_3px_6px_rgba(230,57,70,0.18)]' : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-[0.65rem] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[1.35rem] leading-none p-1 flex items-center justify-center"
                >
                  {showPassword2 ? '🙈' : '👁'}
                </button>
              </div>
              {(fieldErrors.password2 || (formData.password2 && formData.password !== formData.password2 && !fieldErrors.password2)) && (
                <p className="text-[#b02035] text-[0.8rem] font-semibold mt-[0.35rem]">* {fieldErrors.password2 || 'Senha não é a mesma'}</p>
              )}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="u_nome" className="block font-bold text-[#52462a] text-[0.95rem]">Nome Completo *</label>
              <input
                id="u_nome"
                value={formData.u_nome}
                onChange={(e) => updateField('u_nome', e.target.value)}
                placeholder="Digite seu nome aqui..."
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="u_nasc" className="block font-bold text-[#52462a] text-[0.95rem]">Data de Nascimento *</label>
              <input
                id="u_nasc"
                type="date"
                value={formData.u_nasc}
                onChange={(e) => updateField('u_nasc', e.target.value)}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="u_cel" className="block font-bold text-[#52462a] text-[0.95rem]">Celular *</label>
              <input
                id="u_cel"
                type="tel"
                inputMode="numeric"
                value={formData.u_cel}
                onChange={handlePhoneChange}
                placeholder="(00) 0 0000-0000"
                maxLength={19}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="u_parentesco" className="block font-bold text-[#52462a] text-[0.95rem]">Grau de Parentesco *</label>
              <select
                id="u_parentesco"
                value={formData.u_parentesco}
                onChange={(e) => updateField('u_parentesco', e.target.value)}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
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
              <label htmlFor="u_escolaridade" className="block font-bold text-[#52462a] text-[0.95rem]">Escolaridade *</label>
              <select
                id="u_escolaridade"
                value={formData.u_escolaridade}
                onChange={(e) => updateField('u_escolaridade', e.target.value)}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
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
              <label htmlFor="u_prof" className="block font-bold text-[#52462a] text-[0.95rem]">Profissão *</label>
              <input
                id="u_prof"
                value={formData.u_prof}
                onChange={(e) => updateField('u_prof', e.target.value)}
                placeholder="Digite sua profissão..."
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="u_cidade" className="block font-bold text-[#52462a] text-[0.95rem]">Cidade/Estado *</label>
              <input
                id="u_cidade"
                value={formData.u_cidade}
                onChange={handleCityChange}
                placeholder="Ex: São Paulo/SP"
                list="cities-list"
                autoComplete="off"
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
                required
              />
              <datalist id="cities-list">
                {cities.map((city) => (
                  <option key={city.id_cidade} value={city.cidade_uf} />
                ))}
              </datalist>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="c_nome" className="block font-bold text-[#52462a] text-[0.95rem]">Nome da criança *</label>
              <input
                id="c_nome"
                value={formData.c_nome}
                onChange={(e) => updateField('c_nome', e.target.value)}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="c_nasc" className="block font-bold text-[#52462a] text-[0.95rem]">Data de nascimento *</label>
              <input
                id="c_nasc"
                type="date"
                value={formData.c_nasc}
                onChange={(e) => updateField('c_nasc', e.target.value)}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="c_sexo" className="block font-bold text-[#52462a] text-[0.95rem]">Sexo</label>
              <select
                id="c_sexo"
                value={formData.c_sexo}
                onChange={(e) => updateField('c_sexo', e.target.value)}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
              >
                <option value="">Selecione...</option>
                <option value="f">Feminino</option>
                <option value="m">Masculino</option>
                <option value="n">Prefiro não dizer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="c_estuda" className="block font-bold text-[#52462a] text-[0.95rem]">Estuda?</label>
              <select
                id="c_estuda"
                value={formData.c_estuda}
                onChange={(e) => updateField('c_estuda', e.target.value)}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="c_tipo_escola" className="block font-bold text-[#52462a] text-[0.95rem]">Tipo de Escola</label>
              <input
                id="c_tipo_escola"
                value={formData.c_tipo_escola}
                onChange={(e) => updateField('c_tipo_escola', e.target.value)}
                placeholder="Pública, Particular, etc."
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
              />
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="c_terapia" className="block font-bold text-[#52462a] text-[0.95rem]">Faz algum tipo de terapia?</label>
              <select
                id="c_terapia"
                value={formData.c_terapia}
                onChange={(e) => updateField('c_terapia', e.target.value)}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="c_tipos" className="block font-bold text-[#52462a] text-[0.95rem]">Tipo(s) de Terapia</label>
              <select
                id="c_tipos"
                value={formData.c_tipos}
                onChange={(e) => updateField('c_tipos', e.target.value)}
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
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
              <label htmlFor="c_outras" className="block font-bold text-[#52462a] text-[0.95rem]">Outras Terapias</label>
              <input
                id="c_outras"
                value={formData.c_outras}
                onChange={(e) => updateField('c_outras', e.target.value)}
                placeholder="Opcional"
                className="w-full bg-[#ffe7a4] border-none rounded-[1.2rem] px-[1.1rem] py-[0.9rem] text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:outline focus:outline-[3px] focus:outline-[rgba(35,76,56,0.35)]"
              />
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-3 text-sm text-[#3a2f16]">
            <p className="font-semibold">Revise seus dados e confirme o cadastro.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>E-mail:</strong> {formData.email}</li>
              <li><strong>Responsável:</strong> {formData.u_nome}</li>
              <li><strong>Nascimento:</strong> {formatDateToBR(formData.u_nasc)}</li>
              <li><strong>Celular:</strong> {formData.u_cel}</li>
              <li><strong>Parentesco:</strong> {formData.u_parentesco}</li>
              <li><strong>Criança:</strong> {formData.c_nome}</li>
              <li><strong>Nascimento:</strong> {formatDateToBR(formData.c_nasc)}</li>
            </ul>
          </div>
        )
      default:
        return null
    }
  }

  const progress = Math.round((step - 0.5) / 5 * 100)

  return (
    <>
      <Toaster />
      <main 
        className="min-h-screen flex items-center justify-center p-8"
        style={{
          background: 'linear-gradient(180deg, #fde9a5 0%, #f9d97d 100%)'
        }}
      >
        <div className="w-full max-w-[420px] flex flex-col gap-7">
        {/* Header */}
        <header className="text-center text-[#3a2f16]">
          <h1 className="text-[1.75rem] font-extrabold tracking-wide uppercase font-[family-name:var(--font-montserrat)]">
            PAIS OU RESPONSÁVEIS
          </h1>
          <p className="mt-[0.35rem] font-semibold text-base">{STEPS[step - 1].heading}</p>
        </header>

        {/* Card */}
        <section className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.16)] p-7 flex flex-col gap-5">
          {/* Progress */}
          <div className="flex items-center gap-4">
            <span className="font-bold text-[#3a2f16] text-base min-w-[3.5rem]">{step}/5</span>
            <div className="h-[10px] bg-[#f4f0dd] flex-1 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #f6a13f, #234c38)'
                }}
              />
            </div>
          </div>

          {/* Form */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}
          {renderStep()}
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-6 items-center">
          {/* Mascot + Speech */}
          <div className="flex items-start gap-4">
            <img
              src={STORAGE.images.donMascote}
              alt="Don"
              className="w-24 h-auto"
            />
            <div className="relative bg-white rounded-2xl p-4 shadow-lg max-w-[210px]">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white" />
              <p className="text-[#234c38] font-semibold text-[0.95rem]">
                {STEPS[step - 1].speech}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 w-full justify-center">
            <button
              onClick={handleBack}
              className="min-w-[140px] bg-white text-[#234c38] border-none rounded-full px-6 py-3 font-bold text-base cursor-pointer transition-all hover:scale-105 shadow-[0_12px_24px_rgba(0,0,0,0.14)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(35,76,56,0.45)] focus-visible:outline-offset-2"
            >
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="min-w-[140px] bg-[#234c38] text-white border-none rounded-full px-6 py-3 font-bold text-base cursor-pointer transition-all hover:scale-105 shadow-[0_16px_32px_rgba(0,0,0,0.22)] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(35,76,56,0.45)] focus-visible:outline-offset-2"
            >
              {loading ? 'Aguarde...' : (step === 5 ? 'Concluir' : 'Avançar')}
            </button>
          </div>
        </footer>
      </div>
      </main>
    </>
  )
}
