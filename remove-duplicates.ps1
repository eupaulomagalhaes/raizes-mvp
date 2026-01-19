$filePath = "c:\Users\paulo\OneDrive - NoBots\2025\Raizes\windsurf\alpha\public\supabase.js"
$lines = Get-Content $filePath

# Find the duplicate section - it starts with a second "init(){" around line 590
# We need to remove lines 590-791 (the duplicate init, getCurrentUser, emailExists, etc. up to the duplicate listChildren)

$output = @()
$skipStart = -1
$skipEnd = -1
$inDuplicateSection = $false
$braceCount = 0

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1
    
    # Detect start of duplicate section (second init() function around line 590)
    if ($lineNum -ge 588 -and $lineNum -le 592 -and $line -match '^\s+init\(\)\{') {
        $inDuplicateSection = $true
        $skipStart = $lineNum
        Write-Host "Found duplicate section start at line $lineNum"
        continue
    }
    
    # Skip until we find the end of duplicate listChildren (around line 782)
    if ($inDuplicateSection) {
        # Look for the end marker - the line after duplicate listChildren ends
        # which is "setActiveChild(childId){" that we want to KEEP (the second one)
        if ($lineNum -ge 783 -and $line -match '^\s+setActiveChild\(childId\)\{') {
            $inDuplicateSection = $false
            $skipEnd = $lineNum - 1
            Write-Host "Found duplicate section end at line $skipEnd"
            # Don't skip this line, we want to keep it
            $output += $line
        }
        continue
    }
    
    $output += $line
}

Write-Host "Removed lines $skipStart to $skipEnd"
$output | Set-Content $filePath
Write-Host "Duplicate code removed successfully!"
