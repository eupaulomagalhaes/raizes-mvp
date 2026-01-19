$filePath = "c:\Users\paulo\OneDrive - NoBots\2025\Raizes\windsurf\alpha\public\supabase.js"
$content = Get-Content $filePath -Raw

# Add debug logs in listChildren
$content = $content -replace '(async listChildren\(\)\{[\s\S]*?const \{ criancas \} = await this\.getUserBundle\(\);)', '$1
    console.log("[DEBUG] listChildren - criancas from getUserBundle:", criancas);'

$content = $content -replace '(if \(Array\.isArray\(criancas\) && criancas\.length\) return criancas\.map)', 'console.log("[DEBUG] listChildren - criancas is array with length:", criancas?.length);
    $1'

Set-Content $filePath -Value $content -NoNewline
Write-Host "listChildren debug logs added"
