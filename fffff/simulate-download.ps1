# Simulated 4-hour download script
# This script will simulate a download by printing progress every minute for 4 hours (240 minutes)
# To run: powershell -ExecutionPolicy Bypass -File simulate-download.ps1

$durationMinutes = 240
for ($i = 1; $i -le $durationMinutes; $i++) {
    $percent = [math]::Round(($i / $durationMinutes) * 100, 2)
    Write-Host "Downloading... $percent% complete ($i/$durationMinutes minutes)" -NoNewline
    Start-Sleep -Seconds 60
    Write-Host "`r" -NoNewline
}
Write-Host "Download complete!"