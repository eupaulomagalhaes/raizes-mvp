'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Gamepad2, TrendingUp, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface Jogo {
  id_jogo: string
  nome: string
  descricao: string | null
  slug: string
  habilitado: boolean
}

interface Crianca {
  id_crianca: string
  nome_completo: string
}

interface Usuario {
  nome_completo: string
}

export default function GamesPage() {
  const router = useRouter()
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [criancaAtiva, setCriancaAtiva] = useState<Crianca | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      // Verificar sessão
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Buscar jogos
      const { data: jogosData } = await supabase
        .from('jogos')
        .select('*')
        .eq('habilitado', true)

      if (jogosData) {
        setJogos(jogosData)
      }

      // Buscar dados do usuário
      const { data: userData } = await supabase
        .from('usuarios')
        .select('nome_completo')
        .eq('id_usuario', session.user.id)
        .single()

      if (userData) {
        setUsuario(userData)
      }

      // Buscar crianças do usuário
      const { data: criancasData } = await supabase
        .from('criancas')
        .select('id_crianca, nome_completo')
        .eq('id_responsavel', session.user.id)

      if (criancasData && criancasData.length > 0) {
        setCriancaAtiva(criancasData[0])
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const getGreetingName = () => {
    if (criancaAtiva) {
      return criancaAtiva.nome_completo.split(' ')[0]
    }
    if (usuario) {
      return usuario.nome_completo.split(' ')[0]
    }
    return null
  }

  const greetingName = getGreetingName()

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#f6fff9] to-[#e9f7f0] flex items-center justify-center">
        <p className="text-[#234c38] font-bold">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6fff9] to-[#e9f7f0]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
            <img
              src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/don_mascote_final.png"
              alt="Don"
              className="w-12 h-auto"
            />
          </div>
          <div className="relative bg-white rounded-2xl p-3 shadow-lg flex-1">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-white" />
            <p className="text-[#234c38] font-bold">
              VAMOS BRINCAR!
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <h1 className="text-2xl font-bold text-[#234c38] mb-2">
          Escolha um jogo
        </h1>

        <p className="text-[#3a5144] mb-6">
          {greetingName ? (
            <>Olá de novo, <strong>{greetingName}</strong>!</>
          ) : (
            'Olá de novo!'
          )}
        </p>

        {!criancaAtiva && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            Cadastre uma criança para vincular as sessões de jogo.
          </div>
        )}

        {/* Games List */}
        <div className="space-y-3 mb-6">
          {jogos.map((jogo, index) => (
            <Card
              key={jogo.id_jogo}
              className={`border-0 shadow-lg overflow-hidden ${
                index === 0 && jogo.habilitado
                  ? 'bg-white hover:shadow-xl transition-shadow cursor-pointer'
                  : 'bg-white/60'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#234c38]/10 flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-7 h-7 text-[#234c38]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1b2b21] truncate">
                      {jogo.nome}
                    </h3>
                    <p className="text-sm text-[#3a5144] line-clamp-1">
                      {jogo.descricao || 'Em breve'}
                    </p>
                  </div>
                  {index === 0 && jogo.habilitado ? (
                    <Link href={`/games/${jogo.slug}`}>
                      <Button
                        size="sm"
                        className="bg-[#234c38] hover:bg-[#1d3f2f] text-white rounded-full px-4"
                      >
                        Jogar <ChevronRight size={16} />
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-[#3a5144] bg-[#edf4f0] px-3 py-1 rounded-full">
                      EM BREVE
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/progress">
            <Button
              variant="outline"
              className="w-full border-[#234c38] text-[#234c38] hover:bg-[#234c38]/5 rounded-full py-5"
            >
              <TrendingUp className="mr-2" size={18} />
              Ver progresso
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-[#3a5144] hover:text-[#234c38]"
          >
            <LogOut className="mr-2" size={18} />
            Sair
          </Button>
        </div>
      </div>
    </main>
  )
}
