$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$fixtures = [IO.Path]::GetFullPath((Join-Path $root '../../prototypes/Docx Parser Prototypes/20260907_Prototype_A_NumberingResolver/artifacts/fixtures'))
$manifest = Get-Content -LiteralPath (Join-Path $fixtures 'manifest.json') -Raw | ConvertFrom-Json
$word = $null
$doc = $null
function Release-Com($value) {
  if ($null -ne $value -and [Runtime.InteropServices.Marshal]::IsComObject($value)) { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($value) }
}
function Capture-Paragraphs($document) {
  $rows = @()
  for ($i = 1; $i -le $document.Paragraphs.Count; $i++) {
    $p = $document.Paragraphs.Item($i)
    $r = $p.Range
    $l = $r.ListFormat
    $position = $r.Duplicate
    $position.Collapse(1)
    $rows += [ordered]@{ text = [string]$r.Text; label = [string]$l.ListString; level = if ($l.ListType -ne 0) { [int]$l.ListLevelNumber - 1 } else { $null }; isTableRowMarker = [bool]$position.IsEndOfRowMark }
    Release-Com $position
    Release-Com $l
    Release-Com $r
    Release-Com $p
  }
  return ,$rows
}
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $word.AutomationSecurity = 3
  $word.Options.UpdateLinksAtOpen = $false
  $results = @()
  foreach ($fixture in $manifest) {
    if ($fixture.id -eq 'repeated-and-future-placeholders') { continue }
    $source = Join-Path $fixtures $fixture.file
    $copy = Join-Path $root ($fixture.id + '.source.docx')
    $binary = Join-Path $root ($fixture.id + '.doc')
    $converted = Join-Path $root ($fixture.id + '.converted.docx')
    Copy-Item -LiteralPath $source -Destination $copy
    $doc = $word.Documents.Open($copy, $false, $false, $false)
    $original = Capture-Paragraphs $doc
    $doc.SaveAs2($binary, 0)
    $doc.Close(0)
    Release-Com $doc
    $doc = $word.Documents.Open($binary, $false, $true, $false)
    $binaryRows = Capture-Paragraphs $doc
    $doc.SaveAs2($converted, 12)
    $doc.Close(0)
    Release-Com $doc
    $doc = $null
    $results += [ordered]@{ id = $fixture.id; sourceSha256 = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash; docSha256 = (Get-FileHash -LiteralPath $binary -Algorithm SHA256).Hash; original = $original; binary = $binaryRows }
    Write-Output ('Converted fixture: ' + $fixture.id)
  }
  $report = [ordered]@{ capturedAt = [DateTime]::UtcNow.ToString('o'); wordVersion = [string]$word.Version; wordBuild = [string]$word.Build; method = 'Copy existing synthetic DOCX fixture, save as binary DOC with Word, reopen DOC and capture Word labels, save temporary DOCX'; fixtures = $results }
  [IO.File]::WriteAllText((Join-Path $root 'word-reference.json'), ($report | ConvertTo-Json -Depth 12), [Text.UTF8Encoding]::new($false))
} finally {
  if ($null -ne $doc) { $doc.Close(0); Release-Com $doc }
  if ($null -ne $word) { $word.Quit(); Release-Com $word }
}
