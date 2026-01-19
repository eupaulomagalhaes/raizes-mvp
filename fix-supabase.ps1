$filePath = "c:\Users\paulo\OneDrive - NoBots\2025\Raizes\windsurf\alpha\public\supabase.js"
$content = Get-Content $filePath -Raw

# First, remove the duplicate getUserBundle function (lines 606-664)
$content = $content -replace '(?s)(\s+async emailExists\(email\)\{[^}]+\}\s+\},)\s+(async getUserBundle\(\)\{.*?return fallback\(\);\s+\},)\s+(ensureActiveChild\(childId\)\{)', '$1$3'

# Add birthdate field mapping
$content = $content -replace "name: c\.nome_completo \|\| 'Criança'", "name: c.nome_completo || 'Criança',`n            birthdate: c.data_nascimento"

# Add return fallback() in catch block
$content = $content -replace "console\.error\('Erro ao buscar dados do usuário no Supabase', err\);(\s+)\}", "console.error('Erro ao buscar dados do usuário no Supabase', err);`n        return fallback();`$1}"

Set-Content $filePath -Value $content -NoNewline
Write-Host "File updated successfully"
