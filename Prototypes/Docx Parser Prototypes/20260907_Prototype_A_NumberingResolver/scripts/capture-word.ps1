param([string]$FixtureDirectory = (Join-Path $PSScriptRoot '../artifacts/fixtures'), [string]$OutputPath = (Join-Path $PSScriptRoot '../tests/word-reference.json'))
$ErrorActionPreference = 'Stop'
$fixtureRoot = (Resolve-Path -LiteralPath $FixtureDirectory).Path
$manifest = Get-Content -LiteralPath (Join-Path $fixtureRoot 'manifest.json') -Raw | ConvertFrom-Json
$word = $null
$doc = $null
function Release-Reference($reference) {
  if ($null -ne $reference -and [Runtime.InteropServices.Marshal]::IsComObject($reference)) {
    [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($reference)
  }
}
try {
  # Create and close only this automation instance; never attach to the user's Word session.
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $word.AutomationSecurity = 3
  $captures = @()
  foreach ($fixture in $manifest) {
    $fixturePath = [IO.Path]::GetFullPath((Join-Path $fixtureRoot $fixture.file))
    if (-not $fixturePath.StartsWith($fixtureRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Fixture path escaped its directory.' }
    Write-Output "Reading Word labels: $($fixture.id)"
    $doc = $word.Documents.Open($fixturePath, $false, $true, $false)
    $paragraphs = @()
    for ($index = 1; $index -le $doc.Paragraphs.Count; $index++) {
      $paragraph = $doc.Paragraphs.Item($index)
      $range = $paragraph.Range
      $list = $range.ListFormat
      $position = $range.Duplicate
      $position.Collapse(1)
      $rowMarker = [bool]$position.IsEndOfRowMark
      Release-Reference $position
      $paragraphs += [ordered]@{
        text = [string]$range.Text
        label = [string]$list.ListString
        level = if ($list.ListType -ne 0) { [int]$list.ListLevelNumber - 1 } else { $null }
        start = [int]$range.Start
        end = [int]$range.End
        isTableRowMarker = $rowMarker
      }
      Release-Reference $list
      Release-Reference $range
      Release-Reference $paragraph
    }
    $captures += [ordered]@{ id = $fixture.id; sourceHash = $fixture.sourceHash; paragraphs = $paragraphs }
    $doc.Close(0)
    Release-Reference $doc
    $doc = $null
  }
  $reference = [ordered]@{
    source = 'Microsoft Word COM: paragraph.Range.ListFormat.ListString'
    capturedAt = [DateTime]::UtcNow.ToString('o')
    wordVersion = [string]$word.Version
    wordBuild = [string]$word.Build
    fixtures = $captures
  }
  $json = $reference | ConvertTo-Json -Depth 12
  [IO.File]::WriteAllText([IO.Path]::GetFullPath($OutputPath), $json + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
  Write-Output "Captured $($captures.Count) fixtures to $OutputPath"
} finally {
  if ($null -ne $doc) { $doc.Close(0); Release-Reference $doc }
  if ($null -ne $word) { $word.Quit(); Release-Reference $word }
}
