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

$voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -like '*George*' -or $_.DisplayName -like '*David*' -or $_.DisplayName -like '*Zira*' } | Select-Object -First 1
if (-not $voice) {
    $voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::DefaultVoice
}
$synth.Voice = $voice
Write-Output "Using Voice: $($voice.DisplayName) ($($voice.Language))"

$outDir = "c:\Users\HP\.gemini\antigravity-ide\scratch\labverse-flame-test\public\audio\narration"

$tracks = @{
    "wristDiscovery" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">Look at your wrist. <break time="150ms"/> Gently poke the glowing button to open your Lab Menu.</prosody></speak>'
    "wristActivated" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">Your Lab Menu is opening. <break time="180ms"/> Choose an option by gently poking one of the floating objects.</prosody></speak>'
    "optionSelected" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">Option selected. <break time="150ms"/> Opening your guide now.</prosody></speak>'
    "stepsNarration" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">Follow the experiment one step at a time. <break time="200ms"/> You can reopen this guide whenever you need help.</prosody></speak>'
    "guideNarration" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">Use your right index finger to gently tap the highlighted objects. <break time="200ms"/> Watch for the glow to confirm your selection.</prosody></speak>'
    "theoryNarration" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">This guide explains the scientific principle behind the flame test. <break time="200ms"/> You can return to the experiment whenever you are ready.</prosody></speak>'
    "videoNarration" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">Select a video to see the procedure demonstrated. <break time="200ms"/> Close the guide when you are ready to continue.</prosody></speak>'
    "obsNarration" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">Record your observations in the laboratory notebook. <break time="200ms"/> Compare the flame colour with the available reference before identifying the salt.</prosody></speak>'
    "exploreNarration" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">Choose an available experiment to learn more. <break time="200ms"/> Some experiments may be marked as coming soon.</prosody></speak>'
}

foreach ($key in $tracks.Keys) {
    $ssml = $tracks[$key]
    $op = $synth.SynthesizeSsmlToStreamAsync($ssml)
    $stream = Await $op ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])

    $reader = New-Object Windows.Storage.Streams.DataReader($stream)
    $loadOp = $reader.LoadAsync($stream.Size)
    $loadTask = [System.WindowsRuntimeSystemExtensions]::AsTask($loadOp)
    $loadTask.Wait(-1) | Out-Null

    $bytes = New-Object byte[] $stream.Size
    $reader.ReadBytes($bytes)

    $targetPath = Join-Path $outDir "$key.wav"
    [System.IO.File]::WriteAllBytes($targetPath, $bytes)
    Write-Output "Generated $targetPath ($($bytes.Length) bytes)"
}
