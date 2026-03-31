'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { STORAGE } from '@/lib/storage'
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: boolean; password?: boolean }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setFieldErrors({ email: true, password: true })
      toast.error(
        (t) => (
          <div style={{ width: '100%', position: 'relative' }}>
            <div style={{ paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>❌</span>
              <span>Credenciais inválidas. Verifique seu e-mail e senha.</span>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '4px',
                background: '#fca5a5',
                borderRadius: '0 0 12px 12px',
                animation: 'shrink 5s linear forwards',
                width: '100%',
              }}
            />
          </div>
        ),
        {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#dc2626',
            color: '#fff',
            fontWeight: '600',
            padding: '16px 24px',
            paddingBottom: '20px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(220, 38, 38, 0.4)',
            minWidth: '320px',
          },
        }
      )
      setLoading(false)
      return
    }

    toast.success(
      (t) => (
        <div style={{ width: '100%', position: 'relative' }}>
          <div style={{ paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>✔️</span>
            <span>Login realizado com sucesso!</span>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '4px',
              background: '#86efac',
              borderRadius: '0 0 12px 12px',
              animation: 'shrink 2s linear forwards',
              width: '100%',
            }}
          />
        </div>
      ),
      {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#16a34a',
          color: '#fff',
          fontWeight: '600',
          padding: '16px 24px',
          paddingBottom: '20px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(22, 163, 74, 0.4)',
          minWidth: '320px',
        },
      }
    )

    setTimeout(() => {
      router.push('/games')
      router.refresh()
    }, 500)
  }

  return (
    <>
      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <Toaster />
      <main 
        className="min-h-screen flex items-center justify-center px-6 py-12"
        style={{
          backgroundImage: 'url(https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/raizes-m-v-p-i9jdtd/assets/l8o6ilu1qm8g/tela_fundo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
      <div className="w-full max-w-md space-y-8">
        {/* Greeting */}
        <p className="text-center text-xl font-bold tracking-widest text-[#1f3328] uppercase drop-shadow-lg">
          OLÁ DE NOVO!
        </p>

        {/* Login Card */}
        <Card className="bg-white/95 rounded-[2.5rem] shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="space-y-0">
              <h1 className="text-4xl font-extrabold text-[#234c38] font-[family-name:var(--font-montserrat)]">
                Raízes
              </h1>
              <p className="text-sm font-bold tracking-[0.28em] text-[#2d4a3b]">
                EDUCACIONAL
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#324c3d] font-bold">
                  Email <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setFieldErrors(prev => ({ ...prev, email: false }))
                  }}
                  placeholder="Digite seu email ..."
                  required
                  className={`border-0 rounded-3xl py-5 px-4 bg-[#edf4f0] text-[#1b2b21] font-semibold shadow-inner focus:ring-4 focus:ring-[#234c38]/20 focus-visible:ring-[#234c38]/35 ${
                    fieldErrors.email ? 'border-2 !border-[#e63946] shadow-[inset_0_3px_6px_rgba(230,57,70,0.18)]' : ''
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#324c3d] font-bold">
                  Senha <span aria-hidden="true">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setFieldErrors(prev => ({ ...prev, password: false }))
                    }}
                    placeholder="Digite sua senha ..."
                    required
                    className={`border-0 rounded-3xl py-5 px-4 bg-[#edf4f0] text-[#1b2b21] font-semibold shadow-inner focus:ring-4 focus:ring-[#234c38]/20 focus-visible:ring-[#234c38]/35 pr-12 ${
                      fieldErrors.password ? 'border-2 !border-[#e63946] shadow-[inset_0_3px_6px_rgba(230,57,70,0.18)]' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#234c38] text-xl hover:opacity-80"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#3a5144]">
                Use um e-mail e senha cadastrados.
              </p>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#234c38] hover:bg-[#1d3f2f] text-white font-extrabold text-lg rounded-full py-6 shadow-xl mt-2"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <img
              src={STORAGE.images.donMascote}
              alt="Mascote Don acenando"
              className="w-28 h-auto drop-shadow-2xl"
            />
            <div className="relative bg-white rounded-2xl p-4 shadow-lg">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-white" />
              <p className="text-[#234c38] font-bold">
                Que bom te ver aqui de novo!
              </p>
            </div>
          </div>

          <p className="text-[#1f3328] font-semibold">
            Novo por aqui?{' '}
            <Link href="/register" className="text-[#234c38] underline font-bold">
              Cadastre-se aqui!
            </Link>
          </p>
        </div>
      </div>
      </main>
    </>
  )
}
