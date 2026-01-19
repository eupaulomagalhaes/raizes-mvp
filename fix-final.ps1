$filePath = "c:\Users\paulo\OneDrive - NoBots\2025\Raizes\windsurf\alpha\public\supabase.js"
$lines = Get-Content $filePath

$output = @()
$skipUntilLine = -1
$inDuplicateSection = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Skip duplicate getUserBundle section (starts around line 606)
    if ($i -ge 605 -and $line -match '^\s+async getUserBundle') {
        $inDuplicateSection = $true
        continue
    }
    
    if ($inDuplicateSection) {
        # Skip until we find ensureActiveChild
        if ($line -match '^\s+ensureActiveChild\(childId\)') {
            $inDuplicateSection = $false
            $output += $line
        }
        continue
    }
    
    # Add birthdate field mapping in the first getUserBundle
    if ($line -match "^\s+name: c\.nome_completo \|\| 'Criança'$") {
        $output += $line.Replace("name: c.nome_completo || 'Criança'", "name: c.nome_completo || 'Criança',`n            birthdate: c.data_nascimento")
        continue
    }
    
    # Add return fallback() in catch block
    if ($line -match "^\s+console\.error\('Erro ao buscar dados do usuário no Supabase', err\);$") {
        $output += $line
        $output += "        return fallback();"
        continue
    }
    
    $output += $line
}

$output | Set-Content $filePath
Write-Host "File fixed successfully"
Write-Host "- Removed duplicate getUserBundle function"
Write-Host "- Added birthdate field mapping"
Write-Host "- Added return fallback() in catch block"
