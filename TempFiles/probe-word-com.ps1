$ErrorActionPreference = 'Stop'
$sampleA = 'C:\temp\RdLn_MVP_Stream\TempFiles\output-claude-1.docx'
$sampleB = 'C:\temp\RdLn_MVP_Stream\TempFiles\output-claude-2.docx'
$base = Join-Path $env:TEMP 'rdln-wave2-base.docx'
$changed = Join-Path $env:TEMP 'rdln-wave2-changed.docx'
$missing = Join-Path $env:TEMP 'rdln-wave2-missing.docx'
$readonly = Join-Path $env:TEMP 'rdln-wave2-readonly.docx'

function Release-Com($obj) {
  if ($null -eq $obj) { return }
  try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($obj) | Out-Null } catch {}
}

function Capture-Error([scriptblock]$block, $label) {
  $word = $null
  try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    & $block $word
    Write-Output ($label + '=none')
  } catch {
    Write-Output ($label + '=' + $_.Exception.Message)
  } finally {
    try {
      if ($word -and $word.Documents.Count -gt 0) {
        foreach ($d in @($word.Documents)) { try { $d.Close(0) } catch {} }
      }
    } catch {}
    if ($word) { try { $word.Quit() } catch {} }
    Release-Com $word
  }
}

try {
  $probe = New-Object -ComObject Word.Application
  $probe.Quit()
  Release-Com $probe
  Write-Output 'WORD_COM=available'
} catch {
  Write-Output 'WORD_COM=unavailable'
  Write-Output $_.Exception.Message
  exit 0
}

Copy-Item -LiteralPath $sampleA -Destination $base -Force
Copy-Item -LiteralPath $sampleB -Destination $changed -Force
Copy-Item -LiteralPath $sampleA -Destination $readonly -Force
(Get-Item -LiteralPath $readonly).IsReadOnly = $true
if (Test-Path -LiteralPath $missing) { Remove-Item -LiteralPath $missing -Force }

Capture-Error { param($word) $null = $word.Documents.Open($missing) } 'MISSING_FILE_ERROR'
Capture-Error { param($word) $null = $word.Documents.Open($readonly, $false, $false) } 'READONLY_OPEN_ERROR'
Capture-Error {
  param($word)
  $document = $word.Documents.Open($readonly, $false, $false)
  $null = $document.Compare($changed, [ref]'RdLn Comparison', [ref]2, [ref]$true, [ref]$true)
} 'READONLY_COMPARE_ERROR'

$holder = New-Object -ComObject Word.Application
$holder.Visible = $false
$holder.DisplayAlerts = 0
$held = $holder.Documents.Open($base, $false, $false)
try {
  Capture-Error {
    param($word)
    $document = $word.Documents.Open($base, $false, $false)
    $null = $document.Compare($changed, [ref]'RdLn Comparison', [ref]2, [ref]$true, [ref]$true)
  } 'IN_USE_COMPARE_ERROR'
} finally {
  try { $held.Close(0) } catch {}
  try { $holder.Quit() } catch {}
  Release-Com $held
  Release-Com $holder
}

try {
  if (-not (Test-Path -LiteralPath $missing)) { throw 'Original file not found.' }
} catch {
  Write-Output ('SCRIPT_MISSING_THROW=' + $_.Exception.Message)
}

foreach ($path in @($base, $changed, $readonly)) {
  if (Test-Path -LiteralPath $path) {
    try {
      $item = Get-Item -LiteralPath $path
      $item.IsReadOnly = $false
      Remove-Item -LiteralPath $path -Force
    } catch {}
  }
}
