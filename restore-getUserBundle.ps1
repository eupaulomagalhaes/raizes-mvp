$filePath = "c:\Users\paulo\OneDrive - NoBots\2025\Raizes\windsurf\alpha\public\supabase.js"
$content = Get-Content $filePath -Raw

# Find where to insert getUserBundle (after emailExists function)
$insertPoint = "  async emailExists(email){"

$getUserBundleFunction = @"
  async getUserBundle(){
    const session = this.getCurrentUser();
    if (!session) return { usuario:null, criancas:[] };

    const fallback = ()=>{
      const db = getDB();
      const profile = db.profiles.find(p=>p.id === session.user.id) || null;
      const criancas = db.children
        .filter(c=>c.profile_id === session.user.id)
        .map(c=>({
          ...c,
          id: c.id,
          name: c.nome_completo || c.name || c.nome || 'Criança'
        }));
      const usuario = profile ? {
        id: profile.id,
        nome_completo: profile.name,
        email: profile.email
      } : null;
      return { usuario, criancas };
    };

    if (client){
      try{
        const authId = session.user.id;
        const { data: usuarioData, error: usuarioError } = await client
          .from('usuarios')
          .select('id_usuario, uuid, nome_completo, data_nascimento, parentesco, escolaridade, profissao, email, celular, cidade_estado')
          .eq('uuid', authId)
          .maybeSingle();
        if (usuarioError && usuarioError.code !== 'PGRST116') throw usuarioError;

        const usuario = usuarioData ? {
          id: usuarioData.id_usuario,
          ...usuarioData
        } : null;

        let criancas = [];
        if (usuario?.id){
          const { data: criData, error: criError } = await client
            .from('criancas')
            .select('id_crianca, nome_completo, data_nascimento, sexo, estuda, tipo_escola, terapia, tipos_terapia, outras_terapias')
            .eq('id_responsavel', usuario.id);
          if (criError) throw criError;
          criancas = (criData||[]).map(c=>({
            ...c,
            id: c.id_crianca,
            name: c.nome_completo || 'Criança',
            birthdate: c.data_nascimento
          }));
        }

        return { usuario, criancas };
      }catch(err){
        console.error('Erro ao buscar dados do usuário no Supabase', err);
        return fallback();
      }
    }

    return fallback();
  },
"@

# Find the emailExists function and add getUserBundle after it
$pattern = '(?s)(async emailExists\(email\)\{.*?return db\.profiles\.some\(p=>p\.email===email\);\s+\},)\s+(ensureActiveChild)'
$replacement = "`$1`n$getUserBundleFunction`n  `$2"

$content = $content -replace $pattern, $replacement

Set-Content $filePath -Value $content -NoNewline
Write-Host "getUserBundle function restored successfully"
