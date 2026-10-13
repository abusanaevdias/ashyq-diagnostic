# Offline Windows TTS for original synthetic author-review scripts only.
# This does not approve or publish the exercises as learner practice.
param(
    [ValidatePattern('^\d{2,4}$')][string]$Batch = '02',
    [ValidateSet('Microsoft Zira Desktop', 'Microsoft David Desktop')][string]$Voice = 'Microsoft Zira Desktop'
)
$ErrorActionPreference = 'Stop'
function Get-TaskAudioHash([string]$TaskFilePath) {
    $taskHashStream = [IO.File]::OpenRead($TaskFilePath)
    $taskSha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($taskSha.ComputeHash($taskHashStream))).Replace('-', '').ToLowerInvariant() }
    finally { $taskSha.Dispose(); $taskHashStream.Dispose() }
}
$taskRoot = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
$taskBank = Get-Content -LiteralPath (Join-Path $taskRoot ('src/data/trainer-drafts/batch-' + $Batch + '.json')) -Raw -Encoding UTF8 | ConvertFrom-Json
if ($taskBank.methodically_approved -ne $false) { throw 'Expected an unapproved draft bank.' }
$taskUnits = @($taskBank.units | Where-Object { $_.exercise_data.kind -eq 'listening-pair-v1' })
if ($taskBank.batch -ne $Batch -or $taskUnits.Count -lt 1 -or $taskUnits.Count -gt 100) { throw 'Expected a matching batch with original Listening pairs.' }
if (@($taskUnits.id | Select-Object -Unique).Count -ne $taskUnits.Count) { throw 'Duplicate draft unit IDs.' }
foreach ($taskExistingManifest in Get-ChildItem -LiteralPath (Join-Path $taskRoot 'src/data/trainer-drafts') -Filter 'listening-audio-*.json' -File) {
    $taskExisting = Get-Content -LiteralPath $taskExistingManifest.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($taskExisting.batch -ne $Batch -and @($taskExisting.assets | Where-Object { $_.unit -in $taskUnits.id }).Count -gt 0) { throw 'Another batch owns an audio unit ID; refusing to overwrite its files.' }
}
$taskOutput = [IO.Path]::GetFullPath((Join-Path $taskRoot 'public/audio/trainers/drafts'))
if (-not $taskOutput.StartsWith($taskRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Audio output is outside the workspace.' }
[IO.Directory]::CreateDirectory($taskOutput) | Out-Null
if ((Get-Item -LiteralPath $taskOutput -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refusing a linked audio output directory.' }
# Validate bound media before selecting a voice or writing a generated file.
foreach ($taskUnit in $taskUnits) {
    if ($taskUnit.status -ne 'DRAFT' -or $taskUnit.id -notmatch '^L\d{2}$' -or $taskUnit.exercise_data.publication_ready -ne $false -or $taskUnit.exercise_data.rounds.Count -ne 2) { throw 'Unexpected draft unit.' }
    $taskIdentity = $taskUnit.exercise_data.media_identity
    if ($null -eq $taskIdentity) { continue }
    if ($taskIdentity.format -ne 'ashyq-draft-listening-media-v1' -or $taskIdentity.voice -cne $Voice -or $taskIdentity.rate -ne -1 -or $taskIdentity.assets.Count -ne 4) { throw 'Bound media voice/rate/shape differs; create a new source version before activation.' }
    for ($taskRound = 0; $taskRound -lt 2; $taskRound++) {
        foreach ($taskKind in @('full', 'segment')) {
            $taskMatches = @($taskIdentity.assets | Where-Object { $_.round -eq $taskRound -and $_.kind -ceq $taskKind })
            if ($taskMatches.Count -ne 1) { throw 'Ambiguous bound media identity.' }
            $taskBoundAsset = $taskMatches[0]
            $taskStem = $taskUnit.id.ToLowerInvariant() + '-' + ($taskRound + 1) + '-' + $taskKind
            if ($taskBoundAsset.sha256 -cnotmatch '^[a-f0-9]{64}$' -or $taskBoundAsset.bytes -le 44 -or $taskBoundAsset.bytes -gt 10000000 -or ($taskBoundAsset.url -cne ('/audio/trainers/drafts/' + $taskStem + '.wav') -and $taskBoundAsset.url -cne ('/audio/trainers/drafts/' + $taskStem + '-' + $taskBoundAsset.sha256 + '.wav'))) { throw 'Invalid bound media path/hash/size.' }
            $taskBoundPath = [IO.Path]::GetFullPath((Join-Path $taskOutput ([IO.Path]::GetFileName([string]$taskBoundAsset.url))))
            if (-not $taskBoundPath.StartsWith($taskOutput + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe bound audio target.' }
            if (Test-Path -LiteralPath $taskBoundPath) {
                if ((Get-Item -LiteralPath $taskBoundPath).Length -ne $taskBoundAsset.bytes -or (Get-TaskAudioHash -TaskFilePath $taskBoundPath) -cne $taskBoundAsset.sha256) { throw 'Existing bound audio differs; refusing to overwrite it.' }
            }
        }
    }
}
Add-Type -AssemblyName System.Speech
$taskSpeaker = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$taskAssets = @()
$taskPending = @()
$taskTemporaryFiles = @()
$taskTempDir = $null
try {
    $taskSpeaker.SelectVoice($Voice)
    $taskSpeaker.Rate = -1
    $taskTempDir = [IO.Path]::GetFullPath((Join-Path $taskOutput ('.generate-' + [Guid]::NewGuid().ToString())))
    if (-not $taskTempDir.StartsWith($taskOutput + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe generated temporary directory.' }
    [IO.Directory]::CreateDirectory($taskTempDir) | Out-Null
    foreach ($taskUnit in $taskUnits) {
        for ($taskRound = 0; $taskRound -lt 2; $taskRound++) {
            $taskItem = $taskUnit.exercise_data.rounds[$taskRound]
            if (-not $taskItem.script.Contains($taskItem.segment)) { throw 'Replay excerpt is not in the original script.' }
            foreach ($taskKind in @('full', 'segment')) {
                $taskText = if ($taskKind -eq 'full') { $taskItem.script } else { $taskItem.segment }
                if ([string]::IsNullOrWhiteSpace($taskText) -or $taskText.Length -gt 5000) { throw 'Invalid original text.' }
                $taskStem = $taskUnit.id.ToLowerInvariant() + '-' + ($taskRound + 1) + '-' + $taskKind
                $taskTemporary = Join-Path $taskTempDir ($taskStem + '.wav')
                $taskTemporaryFiles += $taskTemporary
                $taskSpeaker.SetOutputToWaveFile($taskTemporary)
                $taskSpeaker.Speak($taskText)
                $taskSpeaker.SetOutputToNull()
                $taskFile = Get-Item -LiteralPath $taskTemporary
                if ($taskFile.Length -le 44 -or $taskFile.Length -gt 10000000) { throw 'Empty or oversized generated WAV.' }
                $taskHash = Get-TaskAudioHash -TaskFilePath $taskTemporary
                $taskIdentity = $taskUnit.exercise_data.media_identity
                if ($null -ne $taskIdentity) {
                    $taskBoundAsset = @($taskIdentity.assets | Where-Object { $_.round -eq $taskRound -and $_.kind -ceq $taskKind })[0]
                    if ($taskBoundAsset.sha256 -cne $taskHash -or $taskBoundAsset.bytes -ne $taskFile.Length) { throw 'Generated audio differs from the bound source identity; create a new source version before activation.' }
                    $taskName = [IO.Path]::GetFileName([string]$taskBoundAsset.url)
                } else {
                    $taskName = $taskStem + '-' + $taskHash + '.wav'
                }
                $taskPath = [IO.Path]::GetFullPath((Join-Path $taskOutput $taskName))
                if (-not $taskPath.StartsWith($taskOutput + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe audio target.' }
                if (Test-Path -LiteralPath $taskPath) {
                    if ((Get-Item -LiteralPath $taskPath).Length -ne $taskFile.Length -or (Get-TaskAudioHash -TaskFilePath $taskPath) -cne $taskHash) { throw 'Existing immutable audio differs; refusing to overwrite it.' }
                }
                $taskPending += [ordered]@{ temporary = $taskTemporary; target = $taskPath }
                $taskAssets += [ordered]@{ unit = $taskUnit.id; round = $taskRound; kind = $taskKind; text = $taskText; url = '/audio/trainers/drafts/' + $taskName; sha256 = $taskHash; bytes = $taskFile.Length }
            }
        }
    }
    if ($taskAssets.Count -ne $taskUnits.Count * 4) { throw 'Expected full and segment audio for every paired round.' }
    if (@($taskPending.target | Select-Object -Unique).Count -ne $taskPending.Count) { throw 'Generated target collision.' }
    # All generation and bound-identity checks finish before any final asset is written.
    foreach ($taskMove in $taskPending) { if (-not (Test-Path -LiteralPath $taskMove.target)) { [IO.File]::Move($taskMove.temporary, $taskMove.target) } }
    $taskManifest = [ordered]@{ format = 'ashyq-draft-listening-audio-v1'; batch = $Batch; publication_ready = $false; synthetic_voice = $Voice; voice_rate = -1; generation = 'offline Windows System.Speech'; assets = $taskAssets }
    $taskManifestPath = Join-Path $taskRoot ('src/data/trainer-drafts/listening-audio-' + $Batch + '.json')
    $taskPrevious = if (Test-Path -LiteralPath $taskManifestPath) { Get-Content -LiteralPath $taskManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json | ConvertTo-Json -Depth 8 -Compress } else { $null }
    if ($taskPrevious -cne ($taskManifest | ConvertTo-Json -Depth 8 -Compress)) { [IO.File]::WriteAllText($taskManifestPath, ($taskManifest | ConvertTo-Json -Depth 8) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false)) }
} finally {
    $taskSpeaker.Dispose()
    if ($null -ne $taskTempDir -and (Test-Path -LiteralPath $taskTempDir)) {
        $taskResolvedTemporary = [IO.Path]::GetFullPath($taskTempDir)
        if (-not $taskResolvedTemporary.StartsWith($taskOutput + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($taskResolvedTemporary) -notmatch '^\.generate-[a-f0-9-]{36}$' -or ((Get-Item -LiteralPath $taskResolvedTemporary -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Refusing cleanup outside the exact generated temporary directory.' }
        # Delete only the exact files this run created. Unexpected files prevent empty-directory cleanup.
        foreach ($taskTemporary in $taskTemporaryFiles) {
            $taskResolvedFile = [IO.Path]::GetFullPath($taskTemporary)
            if (-not $taskResolvedFile.StartsWith($taskResolvedTemporary + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe generated temporary file cleanup.' }
            if ([IO.File]::Exists($taskResolvedFile)) { [IO.File]::Delete($taskResolvedFile) }
        }
        [IO.Directory]::Delete($taskResolvedTemporary, $false)
    }
}
Write-Output ('Verified/generated {0} immutable synthetic DRAFT audio assets; no learner practice was approved.' -f $taskAssets.Count)
