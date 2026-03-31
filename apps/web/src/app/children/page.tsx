'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, User, Check, BarChart3, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Child {
  id_crianca: string;
  nome_completo: string;
  data_nascimento: string;
  sexo?: string;
}

export default function ChildrenPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birthdate: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childStats, setChildStats] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<number[]>([0,0,0,0,0,0,0]);

  useEffect(() => {
    checkAuth();
    loadChildren();
    loadActiveChild();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadChildren = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('User:', user?.id);
      if (!user) {
        console.log('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('criancas')
        .select('*')
        .eq('id_responsavel', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro Supabase:', error);
        throw error;
      }
      console.log('Crianças carregadas:', data);
      setChildren(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar crianças:', error);
      console.error('Detalhes do erro:', error.message, error.details, error.hint);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveChild = () => {
    const stored = localStorage.getItem('active_child_id');
    if (stored) {
      setActiveChildId(stored);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('criancas')
        .insert({
          id_responsavel: user.id,
          nome_completo: formData.name,
          data_nascimento: formData.birthdate
        });

      if (error) throw error;

      setShowAddModal(false);
      setFormData({ name: '', birthdate: '' });
      loadChildren();
    } catch (error: any) {
      console.error('Erro ao adicionar criança:', error);
      alert('Erro ao adicionar criança: ' + error.message);
    }
  };

  const handleSelectChild = (childId: string) => {
    setActiveChildId(childId);
    localStorage.setItem('active_child_id', childId);
  };

  const handleShowDetails = async (child: Child) => {
    setSelectedChild(child);
    setShowDetailsModal(true);
    
    try {
      const supabase = createClient();
      
      // Buscar estatísticas da criança (sessões do jogo)
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessoes_jogo')
        .select('id_sessao, data_hora')
        .eq('id_crianca', child.id_crianca);
      
      if (sessionsError) throw sessionsError;
      
      const totalSessions = sessions?.length || 0;
      
      // Buscar eventos das sessões
      const sessionIds = sessions?.map(s => s.id_sessao) || [];
      let accuracy = 0;
      let avgReactionTime = 0;
      let maxLevel = 0;
      
      if (sessionIds.length > 0) {
        const { data: events, error: eventsError } = await supabase
          .from('eventos_jogo')
          .select('dados_adicionais')
          .in('id_sessao', sessionIds);
        
        if (!eventsError && events) {
          let total = 0, hits = 0, rtSum = 0, levelSum = 0, levelCount = 0;
          
          events.forEach(e => {
            const payload = e.dados_adicionais || {};
            if (typeof payload.correct === 'boolean') {
              total++;
              if (payload.correct) hits++;
            }
            if (typeof payload.reactionTimeMs === 'number') rtSum += payload.reactionTimeMs;
            if (typeof payload.level === 'number') {
              levelSum++;
              levelCount++;
              if (payload.level > maxLevel) maxLevel = payload.level;
            }
          });
          
          accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;
          avgReactionTime = total > 0 ? Math.round(rtSum / total) : 0;
        }
      }
      
      // Buscar progresso semanal
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const { data: weeklySessions, error: weeklyError } = await supabase
        .from('sessoes_jogo')
        .select('data_hora')
        .eq('id_crianca', child.id_crianca)
        .gte('data_hora', weekAgo.toISOString());
      
      const weekData = [0, 0, 0, 0, 0, 0, 0]; // Dom-Sáb
      
      if (!weeklyError && weeklySessions) {
        weeklySessions.forEach(s => {
          const d = new Date(s.data_hora);
          weekData[d.getDay()]++;
        });
      }
      
      setChildStats({
        totalSessions,
        accuracy,
        avgReactionTime,
        maxLevel
      });
      
      setWeeklyData(weekData);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      setChildStats({ totalSessions: 0, accuracy: 0, avgReactionTime: 0, maxLevel: 0 });
      setWeeklyData([0,0,0,0,0,0,0]);
    }
  };

  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    const ageYears = today.getFullYear() - birth.getFullYear();
    const ageMonths = today.getMonth() - birth.getMonth();
    
    if (ageYears < 1) {
      const totalMonths = ageYears * 12 + ageMonths;
      return `${totalMonths} ${totalMonths === 1 ? 'mês' : 'meses'}`;
    }
    
    if (ageMonths < 0) {
      return `${ageYears - 1} ${ageYears - 1 === 1 ? 'ano' : 'anos'}`;
    }
    
    return `${ageYears} ${ageYears === 1 ? 'ano' : 'anos'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0fdf4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a34a] mx-auto mb-4"></div>
          <p className="text-[#166534]">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0fdf4] pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#166534]">Crianças</h1>
          <Button 
            onClick={() => setShowAddModal(true)} 
            size="lg"
            className="bg-[#16a34a] hover:bg-[#15803d] text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar
          </Button>
        </div>

        {children.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">👶</div>
              <p className="text-xl text-gray-600 mb-2">Nenhuma criança cadastrada</p>
              <p className="text-gray-500">Toque em Adicionar para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {children.map((child) => {
              const isActive = activeChildId === child.id_crianca;
              
              return (
                <Card key={child.id_crianca} className={isActive ? 'border-[#16a34a] border-2' : ''}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center">
                      <User className="w-8 h-8 text-[#16a34a]" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {child.nome_completo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {calculateAge(child.data_nascimento)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleShowDetails(child)}
                        className="border-[#16a34a] text-[#16a34a] hover:bg-[#f0fdf4] w-full"
                        title="Ver estatísticas"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Resultados
                      </Button>
                      <Button
                        variant={isActive ? 'default' : 'outline'}
                        onClick={() => handleSelectChild(child.id_crianca)}
                        className={`w-full ${isActive ? 'bg-[#16a34a] hover:bg-[#15803d] text-white' : 'border-[#16a34a] text-[#16a34a] hover:bg-[#f0fdf4]'}`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Selecionado
                          </>
                        ) : (
                          'Selecionar'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Criança</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddChild} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da criança</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: João"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="birthdate">Data de nascimento</Label>
              <Input
                id="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes da criança */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[#166534]">{selectedChild?.nome_completo}</DialogTitle>
            </div>
          </DialogHeader>
          
          {childStats && childStats.totalSessions > 0 ? (
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#dcfce7] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#166534]">{childStats.totalSessions}</div>
                  <div className="text-xs text-[#166534]">Sessões jogadas</div>
                </div>
                <div className="bg-[#dcfce7] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#166534]">{childStats.accuracy}%</div>
                  <div className="text-xs text-[#166534]">Taxa de acerto</div>
                </div>
                <div className="bg-[#dcfce7] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#166534]">{childStats.avgReactionTime > 0 ? (childStats.avgReactionTime / 1000).toFixed(1) + 's' : '0s'}</div>
                  <div className="text-xs text-[#166534]">Tempo médio</div>
                </div>
                <div className="bg-[#dcfce7] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#166534]">{childStats.maxLevel}</div>
                  <div className="text-xs text-[#166534]">Nível máximo</div>
                </div>
              </div>
              
              {/* Gráfico semanal */}
              <div>
                <h4 className="font-semibold text-[#166534] mb-3 text-center">Evolução Semanal</h4>
                
                {/* Resumo */}
                <div className="flex justify-center gap-8 mb-4">
                  <div className="text-center">
                    <span className="text-xl font-bold text-[#166534]">{weeklyData.reduce((a, b) => a + b, 0)}</span>
                    <span className="text-xs text-[#166534] block">sessões na semana</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold text-[#166534]">{weeklyData.filter(v => v > 0).length}</span>
                    <span className="text-xs text-[#166534] block">dias ativos</span>
                  </div>
                </div>
                
                {/* Barras do gráfico */}
                <div className="flex items-end justify-between h-32 gap-1 mb-2">
                  {(() => {
                    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                    const today = new Date();
                    const orderedDays = [];
                    for (let i = 6; i >= 0; i--) {
                      const date = new Date(today);
                      date.setDate(today.getDate() - i);
                      const dayIndex = date.getDay();
                      const dd = String(date.getDate()).padStart(2, '0');
                      const mm = String(date.getMonth() + 1).padStart(2, '0');
                      orderedDays.push({
                        dayName: days[dayIndex],
                        dateStr: `${dd}/${mm}`,
                        value: weeklyData[dayIndex] || 0,
                        isToday: i === 0
                      });
                    }
                    const maxValue = Math.max(...orderedDays.map(d => d.value), 1);
                    
                    return orderedDays.map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-1">
                        <div 
                          className={`w-full rounded-t-sm flex items-end justify-center ${day.value > 0 ? 'bg-[#16a34a]' : 'bg-[#dcfce7]'}`}
                          style={{ height: `${Math.max((day.value / maxValue) * 100, day.value > 0 ? 20 : 8)}%`, minHeight: day.value > 0 ? '20px' : '8px' }}
                        >
                          {day.value > 0 && <span className="text-xs text-white font-bold pb-1">{day.value}</span>}
                        </div>
                        <div className={`text-center mt-1 ${day.isToday ? 'font-bold text-[#16a34a]' : 'text-gray-500'}`}>
                          <span className="text-[10px] block">{day.dateStr}</span>
                          <span className="text-[10px] block">{day.dayName}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                <p className="text-center text-xs text-gray-500">Atividades realizadas nos últimos 7 dias</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-2">Ainda não há dados de jogos</p>
              <p className="text-sm text-gray-500">Jogue "Onde está o brinquedo" para ver estatísticas</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
