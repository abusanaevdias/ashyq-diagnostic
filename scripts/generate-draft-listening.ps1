# Offline Windows TTS for original synthetic author-review scripts only.
# This does not approve or publish the exercises as learner practice.
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
$taskBank = Get-Content -LiteralPath (Join-Path $taskRoot 'src/data/trainer-drafts/batch-02.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ($taskBank.methodically_approved -ne $false) { throw 'Expected an unapproved draft bank.' }
$taskUnits = @($taskBank.units | Where-Object { $_.exercise_data.kind -eq 'listening-pair-v1' })
if ($taskUnits.Count -ne 2) { throw 'Expected exactly two original Listening pairs.' }
$taskOutput = [IO.Path]::GetFullPath((Join-Path $taskRoot 'public/audio/trainers/drafts'))
if (-not $taskOutput.StartsWith($taskRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Audio output is outside the workspace.' }
[IO.Directory]::CreateDirectory($taskOutput) | Out-Null
Add-Type -AssemblyName System.Speech
$taskSpeaker = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$taskAssets = @()
try {
    $taskSpeaker.SelectVoice('Microsoft Zira Desktop')
    $taskSpeaker.Rate = -1
    foreach ($taskUnit in $taskUnits) {
        if ($taskUnit.status -ne 'DRAFT' -or $taskUnit.id -notmatch '^L\d{2}$' -or $taskUnit.exercise_data.publication_ready -ne $false -or $taskUnit.exercise_data.rounds.Count -ne 2) { throw 'Unexpected draft unit.' }
        for ($taskRound = 0; $taskRound -lt 2; $taskRound++) {
            $taskItem = $taskUnit.exercise_data.rounds[$taskRound]
            if (-not $taskItem.script.Contains($taskItem.segment)) { throw 'Replay excerpt is not in the original script.' }
            foreach ($taskKind in @('full', 'segment')) {
                $taskText = if ($taskKind -eq 'full') { $taskItem.script } else { $taskItem.segment }
                if ([string]::IsNullOrWhiteSpace($taskText) -or $taskText.Length -gt 5000) { throw 'Invalid original text.' }
                $taskName = $taskUnit.id.ToLowerInvariant() + '-' + ($taskRound + 1) + '-' + $taskKind + '.wav'
                $taskPath = [IO.Path]::GetFullPath((Join-Path $taskOutput $taskName))
                if (-not $taskPath.StartsWith($taskOutput + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe audio target.' }
                $taskSpeaker.SetOutputToWaveFile($taskPath)
                $taskSpeaker.Speak($taskText)
                $taskSpeaker.SetOutputToNull()
                $taskFile = Get-Item -LiteralPath $taskPath
                if ($taskFile.Length -le 44) { throw 'Empty generated WAV.' }
                $taskAssets += [ordered]@{ unit = $taskUnit.id; round = $taskRound; kind = $taskKind; text = $taskText; url = '/audio/trainers/drafts/' + $taskName; sha256 = (Get-FileHash -LiteralPath $taskPath -Algorithm SHA256).Hash.ToLowerInvariant(); bytes = $taskFile.Length }
            }
        }
    }
} finally { $taskSpeaker.Dispose() }
if ($taskAssets.Count -ne 8) { throw 'Expected eight generated assets.' }
$taskManifest = [ordered]@{ format = 'ashyq-draft-listening-audio-v1'; batch = '02'; publication_ready = $false; synthetic_voice = 'Microsoft Zira Desktop'; voice_rate = -1; generation = 'offline Windows System.Speech'; assets = $taskAssets }
$taskManifestPath = Join-Path $taskRoot 'src/data/trainer-drafts/listening-audio-02.json'
[IO.File]::WriteAllText($taskManifestPath, ($taskManifest | ConvertTo-Json -Depth 8) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
Write-Output ('Generated {0} synthetic DRAFT audio assets; no learner practice was approved.' -f $taskAssets.Count)
