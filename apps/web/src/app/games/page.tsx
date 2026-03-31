'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Gamepad2, TrendingUp, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { STORAGE } from '@/lib/storage'

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
      <main 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'url(https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/nuvens_background.gif) center/cover no-repeat'
        }}
      >
        <p className="text-[#234c38] font-bold">Carregando...</p>
      </main>
    )
  }

  return (
    <main 
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        background: 'url(https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/nuvens_background.gif) center/cover no-repeat'
      }}
    >
      {/* Container centralizado */}
      <div className="w-full max-w-[420px] bg-white/95 rounded-[2.25rem] p-8 pb-10 shadow-[0_26px_52px_rgba(0,0,0,0.22)] flex flex-col gap-6 items-center text-center">
        
        {/* Mascot + Speech */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-white shadow-[0_20px_40px_rgba(0,0,0,0.18)] border-4 border-[#234c38] flex items-center justify-center overflow-hidden">
            <img
              src={STORAGE.images.donMascote}
              alt="Don"
              className="w-[88px] h-auto"
            />
          </div>
          <div className="relative bg-white rounded-2xl px-4 py-2 shadow-lg">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-white" />
            <p className="text-[#234c38] font-bold text-base">
              VAMOS BRINCAR!
            </p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[1.75rem] font-extrabold text-[#234c38] font-[family-name:var(--font-montserrat)]">
          Escolha um jogo
        </h1>

        {/* Greeting */}
        <p className="text-[#1f3328] text-[1.05rem] font-semibold">
          {greetingName ? (
            <>Olá de novo, <strong>{greetingName}</strong>!</>
          ) : (
            'Olá de novo!'
          )}
        </p>

        {/* Hint */}
        {!criancaAtiva && (
          <p className="text-[#3a5144] text-sm min-h-[1.2rem]">
            Cadastre uma criança no cadastro para vincular as sessões.
          </p>
        )}

        {/* Games List */}
        <ul className="w-full flex flex-col gap-4 list-none p-0 m-0">
          {jogos.map((jogo, index) => {
            if (index === 0 && jogo.habilitado) {
              return (
                <li key={jogo.id_jogo} className="w-full">
                  <Link
                    href={`/games/${jogo.slug}`}
                    className="w-full rounded-3xl p-4 flex items-center gap-3 shadow-[0_14px_28px_rgba(0,0,0,0.16)] no-underline bg-gradient-to-br from-white to-[#e3ffec]/90 border-2 border-[#a5d9b3] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-shadow"
                  >
                    <img
                      src="https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/images/mistery_box_01.png"
                      alt="Caixa misteriosa"
                      className="w-14 h-14 object-contain"
                    />
                    <span className="text-[#234c38] font-extrabold text-[1.05rem] flex-1 text-left">
                      {jogo.nome}
                    </span>
                  </Link>
                </li>
              )
            }
            return (
              <li key={jogo.id_jogo} className="w-full rounded-3xl p-3 px-4 flex items-center gap-3 bg-white shadow-[0_14px_28px_rgba(0,0,0,0.16)]">
                <span className="text-[#2c3d33] font-extrabold text-base">#{index + 1}</span>
                <div className="flex-1 flex flex-col items-start">
                  <span className="text-[#234c38] font-bold text-sm">{jogo.nome}</span>
                </div>
                <span className="text-xs font-semibold text-[#3a5144] bg-[#edf4f0] px-3 py-1 rounded-full">
                  Em breve
                </span>
              </li>
            )
          })}
        </ul>

        {/* Actions */}
        <div className="flex gap-4 w-full justify-center text-sm">
          <Link href="/progress" className="text-[#234c38] font-bold hover:underline no-underline">
            Ver progresso
          </Link>
        </div>
      </div>
    </main>
  )
}
