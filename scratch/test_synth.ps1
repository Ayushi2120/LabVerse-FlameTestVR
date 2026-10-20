Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

[Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media, ContentType=WindowsRuntime] | Out-Null
$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -like '*George*' } | Select-Object -First 1

if (-not $voice) {
    Write-Output "George voice not found"
    exit 1
}

$synth.Voice = $voice
Write-Output "Selected voice: $($voice.DisplayName) ($($voice.Language))"

$ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-10%" pitch="-2%">To the Curious Seeker,</prosody></speak>'
$op = $synth.SynthesizeSsmlToStreamAsync($ssml)
$stream = Await $op ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])

$reader = New-Object Windows.Storage.Streams.DataReader($stream)
$loadOp = $reader.LoadAsync($stream.Size)
$loadTask = [System.WindowsRuntimeSystemExtensions]::AsTask($loadOp)
$loadTask.Wait(-1) | Out-Null

$bytes = New-Object byte[] $stream.Size
$reader.ReadBytes($bytes)

if (!(Test-Path "scratch")) { New-Item -ItemType Directory -Path "scratch" -Force }
[System.IO.File]::WriteAllBytes("scratch\test_george.wav", $bytes)
Write-Output "Successfully wrote scratch\test_george.wav ($($bytes.Length) bytes)"
