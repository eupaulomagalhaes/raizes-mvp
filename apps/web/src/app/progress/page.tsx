'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Child {
  id_crianca: string;
  nome_completo: string;
}

interface GameProgress {
  sessions: number;
  totalAttempts: number;
  totalCorrect: number;
  totalErrors: number;
  avgReactionMs: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadProgress(selectedChildId);
    }
  }, [selectedChildId]);

  const loadChildren = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('criancas')
        .select('id_crianca, nome_completo')
        .eq('id_responsavel', user.id);

      if (error) throw error;

      setChildren(data || []);
      
      // Auto-selecionar criança ativa
      const activeId = localStorage.getItem('active_child_id');
      if (activeId && data?.some(c => c.id_crianca === activeId)) {
        setSelectedChildId(activeId);
      } else if (data && data.length > 0) {
        setSelectedChildId(data[0].id_crianca);
      }
    } catch (error) {
      console.error('Erro ao carregar crianças:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (childId: string) => {
    try {
      const supabase = createClient();
      
      // Buscar sessões do jogo "Onde está o brinquedo"
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessoes_jogo')
        .select('id_sessao, pontos, acertos, tentativas')
        .eq('id_crianca', childId)
        .eq('finalizada', true);

      if (sessionsError) throw sessionsError;

      // Buscar eventos para calcular tempo médio de reação
      const { data: events, error: eventsError } = await supabase
        .from('eventos_jogo')
        .select('tempo_reacao_ms')
        .in('id_sessao', sessions?.map(s => s.id_sessao) || [])
        .eq('evento', 'click')
        .not('tempo_reacao_ms', 'is', null);

      if (eventsError) throw eventsError;

      const totalSessions = sessions?.length || 0;
      const totalAttempts = sessions?.reduce((sum, s) => sum + (s.tentativas || 0), 0) || 0;
      const totalCorrect = sessions?.reduce((sum, s) => sum + (s.acertos || 0), 0) || 0;
      const totalErrors = totalAttempts - totalCorrect;
      
      const avgReactionMs = events && events.length > 0
        ? events.reduce((sum, e) => sum + (e.tempo_reacao_ms || 0), 0) / events.length
        : 0;

      setProgress({
        sessions: totalSessions,
        totalAttempts,
        totalCorrect,
        totalErrors,
        avgReactionMs
      });
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      setProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/games')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Progresso</h1>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">Nenhuma criança cadastrada ainda.</p>
              <Button onClick={() => router.push('/children')} className="mt-4">
                Cadastrar Criança
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a criança
              </label>
              <Select value={selectedChildId} onValueChange={(value) => setSelectedChildId(value || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha uma criança" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id_crianca} value={child.id_crianca}>
                      {child.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {progress && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Sessões</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary-600">{progress.sessions}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Tentativas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary-600">{progress.totalAttempts}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Acertos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{progress.totalCorrect}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Erros</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{progress.totalErrors}</div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio de Reação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary-600">
                        {(progress.avgReactionMs / 1000).toFixed(1)}s
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {progress.totalAttempts > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Taxa de Acerto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full bg-gray-200 rounded-full h-8">
                        <div 
                          className="bg-green-600 h-8 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ width: `${(progress.totalCorrect / progress.totalAttempts) * 100}%` }}
                        >
                          {((progress.totalCorrect / progress.totalAttempts) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {!progress && selectedChildId && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-600">Nenhum dado de progresso ainda.</p>
                  <p className="text-sm text-gray-500 mt-2">Jogue alguns jogos para ver as estatísticas!</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
