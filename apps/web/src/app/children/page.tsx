'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, User, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Child {
  id_crianca: number;
  nome_completo: string;
  data_nascimento: string;
  sexo?: string;
}

export default function ChildrenPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birthdate: ''
  });

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
      
      if (!user) return;

      const { data, error } = await supabase
        .from('criancas')
        .select('*')
        .eq('id_responsavel', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Erro ao carregar crianças:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveChild = () => {
    const stored = localStorage.getItem('active_child_id');
    if (stored) {
      setActiveChildId(parseInt(stored));
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

  const handleSelectChild = (childId: number) => {
    setActiveChildId(childId);
    localStorage.setItem('active_child_id', childId.toString());
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Crianças</h1>
          <Button onClick={() => setShowAddModal(true)} size="lg">
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
                <Card key={child.id_crianca} className={isActive ? 'border-primary-600 border-2' : ''}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {child.nome_completo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {calculateAge(child.data_nascimento)}
                      </p>
                    </div>

                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => handleSelectChild(child.id_crianca)}
                      className="min-w-[120px]"
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
    </div>
  );
}
