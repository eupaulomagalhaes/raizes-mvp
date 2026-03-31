import { Database } from './supabase';

// Tipos estendidos para as novas tabelas de relatórios
export interface RelatorioDesenvolvimento {
  id_relatorio: string;
  id_crianca: string;
  mes_referencia: number;
  ano_referencia: number;
  pontuacao_cognicao: number;
  pontuacao_motricidade: number;
  pontuacao_linguagem: number;
  pontuacao_socioemocional: number;
  pontuacao_autorregulacao: number;
  pontuacao_total: number;
  observacoes_gerais: string | null;
  pontos_fortes: string | null;
  areas_desenvolver: string | null;
  alerta_gerado: boolean;
  tipo_alerta: string | null;
  recomendacoes_praticas: string | null;
  atividades_sugeridas: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ObservacaoAtividade {
  id_observacao: string;
  id_crianca: string;
  id_sessao: string | null;
  nome_atividade: string;
  area_desenvolvimento: string;
  idade_recomendada_meses: number | null;
  avaliacao: 'fez' | 'tentou' | 'nao_fez';
  pontos: 0 | 1 | 2;
  observacao_livre: string | null;
  tempo_duracao_segundos: number | null;
  necessitou_ajuda: boolean;
  tipo_ajuda: string | null;
  humor_crianca: string | null;
  momento_dia: string | null;
  urls_anexos: string[] | null;
  data_observacao: string;
  created_at: string;
}

export interface MarcoDesenvolvimento {
  id_marco: string;
  codigo_marco: string;
  descricao: string;
  area_desenvolvimento: string;
  idade_minima_meses: number;
  idade_maxima_meses: number;
  protocolo_referencia: string | null;
  nivel_dificuldade: number;
  created_at: string;
}

export interface MarcoCrianca {
  id_marco_crianca: string;
  id_crianca: string;
  id_marco: string;
  status: 'nao_avaliado' | 'em_desenvolvimento' | 'conquistado' | 'nao_aplicavel';
  data_conquista: string | null;
  data_primeira_tentativa: string | null;
  idade_conquista_meses: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessaoProfissional {
  id_sessao: string;
  id_crianca: string;
  nome_profissional: string | null;
  tipo_profissional: string | null;
  registro_profissional: string | null;
  data_sessao: string;
  duracao_minutos: number | null;
  avaliacao_profissional: string | null;
  recomendacoes: string | null;
  exercicios_casa: string[] | null;
  atividades_recomendadas: string[] | null;
  anexos_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

// Re-export do Database original
export type { Database };
