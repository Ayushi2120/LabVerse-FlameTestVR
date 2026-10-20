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
    Write-Error "Microsoft George voice not found!"
    exit 1
}
$synth.Voice = $voice
Write-Output "Using Narrator Voice: $($voice.DisplayName) ($($voice.Language))"

$outDir = "c:\Users\HP\.gemini\antigravity-ide\scratch\labverse-flame-test\public\audio\narration"

$tracks = @{
    "letter_p1" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-14%" pitch="-2%">To the Curious Seeker,</prosody></speak>'
    "letter_p2" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-14%" pitch="-2%">A little magic finds those <break time="180ms"/> who dare to explore.</prosody></speak>'
    "letter_p3" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-14%" pitch="-2%">Keep your eyes open, <break time="220ms"/> your mind curious, <break time="220ms"/> and your discoveries close to your heart.</prosody></speak>'
    "letter_p4" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-14%" pitch="-2%">The most extraordinary secrets <break time="200ms"/> are often hidden in plain sight.</prosody></speak>'
    "letter_p5" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-14%" pitch="-2%">Continue exploring, <break time="250ms"/> for every great discovery begins with a single moment of curiosity.</prosody></speak>'
    "letter_p6" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-14%" pitch="-2%">Yours in wonder, <break time="300ms"/> The Keepers of Curiosity.</prosody></speak>'
    "snitchCaught" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-8%" pitch="-1%">Well caught, <break time="120ms"/> Seeker!</prosody></speak>'
    "letter_full" = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><prosody rate="-14%" pitch="-2%">To the Curious Seeker, <break time="650ms"/> A little magic finds those <break time="180ms"/> who dare to explore. <break time="600ms"/> Keep your eyes open, <break time="220ms"/> your mind curious, <break time="220ms"/> and your discoveries close to your heart. <break time="600ms"/> The most extraordinary secrets <break time="200ms"/> are often hidden in plain sight. <break time="600ms"/> Continue exploring, <break time="250ms"/> for every great discovery begins with a single moment of curiosity. <break time="700ms"/> Yours in wonder, <break time="350ms"/> The Keepers of Curiosity.</prosody></speak>'
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
