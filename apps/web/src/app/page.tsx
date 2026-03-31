import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { STORAGE } from '@/lib/storage'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6fff9] to-[#e9f7f0] flex flex-col">
      {/* Top Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-8">
        <div className="text-center space-y-2">
          <p className="text-sm font-bold tracking-widest text-[#3a5144]">
            BEM-VINDO AO
          </p>
          <div className="bg-white rounded-2xl p-6 shadow-xl inline-block">
            <img 
              src={STORAGE.images.logo} 
              alt="Raízes Educacional" 
              className="h-16 w-auto mx-auto mb-2"
            />
            <h1 className="text-3xl font-extrabold text-[#234c38] font-[family-name:var(--font-montserrat)]">
              Raízes Educacional
            </h1>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-6 pb-12">
        <div className="flex items-end justify-center gap-4">
          {/* Mascot */}
          <div className="flex-shrink-0">
            <img 
              src={STORAGE.images.donMascote} 
              alt="DON - Mascote" 
              className="w-32 h-auto drop-shadow-2xl"
            />
          </div>

          {/* Speech Bubble + CTAs */}
          <div className="flex flex-col gap-4 flex-1 max-w-xs">
            {/* Speech Bubble */}
            <div className="relative bg-white rounded-2xl p-4 shadow-lg">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-white" />
              <p className="text-[#234c38] font-bold text-lg">
                Eu sou o Don!
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="w-full bg-[#234c38] hover:bg-[#1d3f2f] text-white font-bold rounded-full py-6 text-lg shadow-xl"
                >
                  Começar
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  className="w-full text-[#234c38] font-semibold underline"
                >
                  Já tenho uma conta!
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
