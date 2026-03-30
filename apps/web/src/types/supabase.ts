export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id_usuario: string
          nome_completo: string
          data_nascimento: string | null
          parentesco: string | null
          escolaridade: string | null
          profissao: string | null
          email: string
          celular: string | null
          cidade_estado: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id_usuario: string
          nome_completo: string
          data_nascimento?: string | null
          parentesco?: string | null
          escolaridade?: string | null
          profissao?: string | null
          email: string
          celular?: string | null
          cidade_estado?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          nome_completo?: string
          data_nascimento?: string | null
          parentesco?: string | null
          escolaridade?: string | null
          profissao?: string | null
          email?: string
          celular?: string | null
          cidade_estado?: string | null
          updated_at?: string
        }
      }
      criancas: {
        Row: {
          id_crianca: string
          id_responsavel: string
          nome_completo: string
          data_nascimento: string
          sexo: string | null
          estuda: boolean
          tipo_escola: string | null
          terapia: boolean
          tipos_terapia: string[] | null
          outras_terapias: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id_responsavel: string
          nome_completo: string
          data_nascimento: string
          sexo?: string | null
          estuda?: boolean
          tipo_escola?: string | null
          terapia?: boolean
          tipos_terapia?: string[] | null
          outras_terapias?: string | null
        }
        Update: {
          nome_completo?: string
          data_nascimento?: string
          sexo?: string | null
          estuda?: boolean
          tipo_escola?: string | null
          terapia?: boolean
          tipos_terapia?: string[] | null
          outras_terapias?: string | null
        }
      }
      jogos: {
        Row: {
          id_jogo: string
          nome: string
          descricao: string | null
          slug: string
          habilitado: boolean
          created_at: string
        }
        Insert: {
          nome: string
          descricao?: string | null
          slug: string
          habilitado?: boolean
        }
        Update: {
          nome?: string
          descricao?: string | null
          slug?: string
          habilitado?: boolean
        }
      }
      sessoes_jogo: {
        Row: {
          id_sessao: string
          id_crianca: string | null
          id_jogo: string | null
          data_hora: string
          finalizada: boolean
          pontos: number
          acertos: number
          tentativas: number
          duracao_segundos: number | null
        }
        Insert: {
          id_crianca?: string | null
          id_jogo?: string | null
          data_hora?: string
          finalizada?: boolean
          pontos?: number
          acertos?: number
          tentativas?: number
          duracao_segundos?: number | null
        }
        Update: {
          finalizada?: boolean
          pontos?: number
          acertos?: number
          tentativas?: number
          duracao_segundos?: number | null
        }
      }
      eventos_jogo: {
        Row: {
          id_evento: string
          id_sessao: string
          tipo_evento: string
          data_hora: string
          dados_adicionais: Json | null
        }
        Insert: {
          id_sessao: string
          tipo_evento: string
          data_hora?: string
          dados_adicionais?: Json | null
        }
      }
    }
  }
}
