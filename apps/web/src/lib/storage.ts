// Supabase Storage helper
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vjeizqpzzfgdxbhetfdc.supabase.co';

export const STORAGE = {
  // Base URL para assets públicos
  baseUrl: `${SUPABASE_URL}/storage/v1/object/public`,
  
  // Imagens
  images: {
    donMascote: `${SUPABASE_URL}/storage/v1/object/public/images/don_mascote_final.png`,
    donCabeca: `${SUPABASE_URL}/storage/v1/object/public/images/cabeca.png`,
    donInteiro: `${SUPABASE_URL}/storage/v1/object/public/images/inteiro.png`,
    logo: `${SUPABASE_URL}/storage/v1/object/public/images/logo_raizes_educacional.png`,
    misteryBox: `${SUPABASE_URL}/storage/v1/object/public/images/mistery_box_01.png`,
    misteryBoxEmpty: `${SUPABASE_URL}/storage/v1/object/public/images/mistery_box_empty.png`,
    girafa: `${SUPABASE_URL}/storage/v1/object/public/images/girafa.png`,
    robo: `${SUPABASE_URL}/storage/v1/object/public/images/robo.png`,
    dinossauro: `${SUPABASE_URL}/storage/v1/object/public/images/dinossauro.png`,
  },
  
  // Áudios
  audio: {
    celebration: `${SUPABASE_URL}/storage/v1/object/public/audios/celebration.mp3`,
    bgm: `${SUPABASE_URL}/storage/v1/object/public/audios/sound_trakcs/difacil_audio_track_voiceless.mp3`,
  },
  
  // Animações
  animations: {
    confetti: `${SUPABASE_URL}/storage/v1/object/public/images/confetti.json`,
  },
};

// Helper para gerar URL de asset público
export function getPublicUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
