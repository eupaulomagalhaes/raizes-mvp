$filePath = "c:\Users\paulo\OneDrive - NoBots\2025\Raizes\windsurf\alpha\public\supabase.js"
$content = Get-Content $filePath -Raw

# Add debug logs in getUserBundle
$content = $content -replace '(const authId = session\.user\.id;)', '$1
        console.log("[DEBUG] getUserBundle - authId:", authId);'

$content = $content -replace '(if \(usuarioError && usuarioError\.code !== ''PGRST116''\) throw usuarioError;)', 'if (usuarioError && usuarioError.code !== ''PGRST116'') throw usuarioError;
        console.log("[DEBUG] getUserBundle - usuarioData:", usuarioData);'

$content = $content -replace '(const usuario = usuarioData \? \{)', 'console.log("[DEBUG] getUserBundle - usuario.id:", usuarioData?.id_usuario);
        $1'

$content = $content -replace '(if \(criError\) throw criError;)', 'if (criError) throw criError;
          console.log("[DEBUG] getUserBundle - criData:", criData);'

$content = $content -replace '(return \{ usuario, criancas \};)', 'console.log("[DEBUG] getUserBundle - returning criancas:", criancas);
        $1'

Set-Content $filePath -Value $content -NoNewline
Write-Host "Debug logs added successfully"
