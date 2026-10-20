Add-Type -AssemblyName System.Speech

$dir = "c:\Users\HP\.gemini\antigravity-ide\scratch\labverse-flame-test\public\audio\narration"
if (!(Test-Path -Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force
}

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
# Pick Microsoft Zira Desktop (clear natural female English voice) or David
try {
    $synth.SelectVoice("Microsoft Zira Desktop")
} catch {
    # fallback
}

$lines = @{
    "welcome" = "Welcome to the Flame Test Experiment! Today, you will identify different metal ions by observing the colours they produce in a flame."
    "glovePrompt" = "Step one: Put on the safety gloves before handling chemicals."
    "glovesEquipped" = "Safety gloves equipped."
    "stepTwoGrabWire" = "Step two: Grab the platinum wire."
    "selectMysterySalt" = "Choose your mystery salt and prepare the platinum wire for testing."
    "burnerPrompt" = "Bring the platinum wire near the burner and observe the flame colour."
    "obs_LiCl" = "Crimson red flame observed."
    "obs_NaCl" = "Intense yellow flame observed."
    "obs_KCl" = "Lilac flame observed."
    "obs_CaCl2" = "Orange-red brick flame observed."
    "obs_CuCl2" = "Blue-green flame observed."
    "saltIdentified" = "Your mystery salt has been identified."
    "cleanWire" = "Clean the platinum wire before testing a new salt."
    "complete" = "Experiment complete. Select another salt to compare the results."
}

foreach ($key in $lines.Keys) {
    $filePath = Join-Path $dir "$key.wav"
    $synth.SetOutputToWaveFile($filePath)
    $synth.Speak($lines[$key])
    Write-Output "Generated $filePath"
}
$synth.Dispose()
