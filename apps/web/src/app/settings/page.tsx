'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronRight, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  useEffect(() => {
    loadUser();
    loadSettings();
  }, []);

  const loadUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUserEmail(user.email || 'Não disponível');
    } else {
      router.push('/login');
    }
  };

  const loadSettings = () => {
    const bgm = localStorage.getItem('bgm_enabled');
    const tts = localStorage.getItem('tts_enabled');
    
    setBgmEnabled(bgm !== '0');
    setTtsEnabled(tts !== '0');
  };

  const handleBgmToggle = (checked: boolean) => {
    setBgmEnabled(checked);
    localStorage.setItem('bgm_enabled', checked ? '1' : '0');
  };

  const handleTtsToggle = (checked: boolean) => {
    setTtsEnabled(checked);
    localStorage.setItem('tts_enabled', checked ? '1' : '0');
  };

  const handleLogout = async () => {
    if (!confirm('Deseja realmente sair?')) return;
    
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 pb-20">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Configurações</h1>

        <div className="space-y-6">
          {/* Áudio */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Áudio</h2>
            <Card>
              <CardContent className="divide-y">
                <div className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <Label htmlFor="bgm-toggle" className="text-base font-medium cursor-pointer">
                      Música de fundo
                    </Label>
                    <p className="text-sm text-gray-500">Tocar música durante o app</p>
                  </div>
                  <Switch
                    id="bgm-toggle"
                    checked={bgmEnabled}
                    onCheckedChange={handleBgmToggle}
                  />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <Label htmlFor="tts-toggle" className="text-base font-medium cursor-pointer">
                      Voz do mascote
                    </Label>
                    <p className="text-sm text-gray-500">Don fala as instruções</p>
                  </div>
                  <Switch
                    id="tts-toggle"
                    checked={ttsEnabled}
                    onCheckedChange={handleTtsToggle}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conta */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Conta</h2>
            <Card>
              <CardContent className="divide-y">
                <button className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Meu perfil</p>
                      <p className="text-sm text-gray-500">{userEmail}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between py-4 text-left hover:bg-red-50 transition-colors rounded-lg px-2 -mx-2 text-red-600"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Sair da conta</p>
                      <p className="text-sm text-red-500">Encerrar sessão</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-400" />
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Sobre */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre</h2>
            <Card>
              <CardContent className="divide-y">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">Versão</p>
                  </div>
                  <p className="text-sm text-gray-500">2.0.0</p>
                </div>

                <button className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2">
                  <div>
                    <p className="font-medium">Política de Privacidade</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
