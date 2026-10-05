# Regenerate original public pilot recordings on Windows; no credentials or student text.
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskSource = Get-Content (Join-Path $taskRoot 'src/lib/listening-replay/cases.ts') -Raw -Encoding UTF8
$taskItems = [regex]::Matches($taskSource, "id: '([^']+)', question:.*?transcript: '([^']+)'.*?segment: '([^']+)'", [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($taskItems.Count -ne 4) { throw 'Expected four original listening scripts.' }
Add-Type -AssemblyName System.Speech
$taskSpeaker = [System.Speech.Synthesis.SpeechSynthesizer]::new()
try {
    $taskSpeaker.SelectVoice('Microsoft Zira Desktop')
    $taskSpeaker.Rate = -1
    foreach ($taskItem in $taskItems) {
        foreach ($taskKind in @(@('', 2), @('-segment', 3))) {
            $taskFile = Join-Path $taskRoot ('public/audio/trainers/' + $taskItem.Groups[1].Value + $taskKind[0] + '.wav')
            $taskSpeaker.SetOutputToWaveFile($taskFile)
            $taskSpeaker.Speak($taskItem.Groups[$taskKind[1]].Value)
            $taskSpeaker.SetOutputToNull()
        }
    }
} finally { $taskSpeaker.Dispose() }
