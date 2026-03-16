# Simulated 4-hour JavaScript download with blue loading bar
# This script will simulate a download by printing a blue progress bar every minute for 4 hours (240 minutes)
# To run: powershell -ExecutionPolicy Bypass -File javascript-download.ps1

$durationMinutes = 240
$barLength = 40
for ($i = 1; $i -le $durationMinutes; $i++) {
    $percent = [math]::Round(($i / $durationMinutes) * 100, 2)
    $filledLength = [math]::Floor(($i / $durationMinutes) * $barLength)
    $bar = ('█' * $filledLength).PadRight($barLength)
    Write-Host ("[" + $bar + "] $percent% ($i/$durationMinutes min)") -ForegroundColor Blue -NoNewline
    Start-Sleep -Seconds 60
    Write-Host "`r" -NoNewline
}
Write-Host "Download complete!" -ForegroundColor Blue