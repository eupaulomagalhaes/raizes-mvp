'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ParentReportModal } from '@/components/parent-report-modal';
import { ProgressChart } from '@/components/progress-chart';

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
  avgLevel: number;
  progressByDay: Array<{
    date: string;
    accuracy: number;
    correct: number;
    errors: number;
  }>;
}

export default function ProgressPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showParentReport, setShowParentReport] = useState(false);

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

      // Buscar id_usuario pelo uuid do auth.user
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('uuid', user.id)
        .single();
      
      if (usuarioError) throw usuarioError;
      if (!usuarioData) throw new Error('Usuário não encontrado');

      const { data, error } = await supabase
        .from('criancas')
        .select('id_crianca, nome_completo')
        .eq('id_responsavel', usuarioData.id_usuario);

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
      
      // Buscar sessões do jogo "Onde está o brinquedo" com data
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessoes_jogo')
        .select('id_sessao, pontos, acertos, tentativas, data_hora')
        .eq('id_crianca', childId)
        .order('data_hora', { ascending: true });

      if (sessionsError) throw sessionsError;

      // Buscar eventos para calcular tempo médio de reação e nível
      const sessionIds = sessions?.map(s => s.id_sessao) || [];
      
      const { data: events, error: eventsError } = await supabase
        .from('eventos_jogo')
        .select('tipo_evento, dados_adicionais, id_sessao, data_hora')
        .in('id_sessao', sessionIds);

      if (eventsError) throw eventsError;

      const totalSessions = sessions?.length || 0;
      const totalAttempts = sessions?.reduce((sum, s) => sum + (s.tentativas || 0), 0) || 0;
      const totalCorrect = sessions?.reduce((sum, s) => sum + (s.acertos || 0), 0) || 0;
      const totalErrors = totalAttempts - totalCorrect;
      
      const reactionEvents = events?.filter(e => e.dados_adicionais?.reactionTimeMs) || [];
      const avgReactionMs = reactionEvents.length > 0
        ? reactionEvents.reduce((sum, e) => sum + (e.dados_adicionais?.reactionTimeMs || 0), 0) / reactionEvents.length
        : 0;

      // Calcular nível médio dos eventos
      const levelEvents = events?.filter(e => e.dados_adicionais?.level !== undefined) || [];
      const avgLevel = levelEvents.length > 0
        ? levelEvents.reduce((sum, e) => sum + (e.dados_adicionais?.level || 0), 0) / levelEvents.length
        : 0;

      // Agrupar dados por dia
      const dayMap = new Map<string, { correct: number; errors: number; total: number }>();
      
      events?.forEach(event => {
        if (event.tipo_evento === 'correct_answer' || event.tipo_evento === 'wrong_answer') {
          const date = new Date(event.data_hora).toISOString().split('T')[0];
          const existing = dayMap.get(date) || { correct: 0, errors: 0, total: 0 };
          
          if (event.tipo_evento === 'correct_answer') {
            existing.correct++;
          } else {
            existing.errors++;
          }
          existing.total++;
          dayMap.set(date, existing);
        }
      });

      const progressByDay = Array.from(dayMap.entries())
        .map(([date, stats]) => ({
          date,
          accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
          correct: stats.correct,
          errors: stats.errors
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setProgress({
        sessions: totalSessions,
        totalAttempts,
        totalCorrect,
        totalErrors,
        avgReactionMs,
        avgLevel,
        progressByDay
      });
      
      setShowChart(progressByDay.length > 0);
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
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
            <div className="mb-6 space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a criança
              </label>
              <Select value={selectedChildId} onValueChange={(value) => setSelectedChildId(value || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {children.find(c => c.id_crianca === selectedChildId)?.nome_completo || 'Escolha uma criança'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id_crianca} value={child.id_crianca}>
                      {child.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedChildId && (
                <Button
                  onClick={() => setShowParentReport(true)}
                  variant="outline"
                  className="w-full border-[#234c38] text-[#234c38] hover:bg-[#edf4f0]"
                >
                  <FileText className="mr-2 w-5 h-5" />
                  Relatório do Responsável
                </Button>
              )}
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

                {showChart && progress.progressByDay && progress.progressByDay.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolução do Desempenho</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <ProgressChart
                        data={progress.progressByDay}
                        sessions={progress.sessions}
                        accuracy={progress.totalAttempts > 0 ? progress.totalCorrect / progress.totalAttempts : 0}
                        avgReaction={progress.avgReactionMs}
                        avgLevel={progress.avgLevel}
                      />
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

      {/* Parent Report Modal */}
      {selectedChildId && (
        <ParentReportModal
          open={showParentReport}
          onClose={() => setShowParentReport(false)}
          childId={selectedChildId}
          childName={children.find(c => c.id_crianca === selectedChildId)?.nome_completo || ''}
        />
      )}
    </div>
  );
}
