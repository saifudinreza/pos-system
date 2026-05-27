# ============================================================
# dev.ps1 — Start semua service development dengan satu perintah
#
# Cara pakai:
#   .\dev.ps1
#
# Yang dijalankan:
#   1. Laravel backend  (php artisan serve) di port 8000
#   2. Next.js frontend (npm run dev)       di port 3000
#   3. ngrok tunnel     untuk webhook Midtrans
#
# Ganti NGROK_DOMAIN di bawah dengan static domain kamu dari
# dashboard.ngrok.com/domains
# ============================================================

$NGROK_DOMAIN = "unseemly-roster-married.ngrok-free.dev"

Write-Host "Starting KasirAI Development Server..." -ForegroundColor Yellow
Write-Host ""

# Start Laravel di terminal baru
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Laravel Backend' -ForegroundColor Green; php artisan serve"

# Start Next.js di terminal baru
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Next.js Frontend' -ForegroundColor Blue; npm run dev"

# Start ngrok di terminal baru
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'ngrok Tunnel' -ForegroundColor Magenta; ngrok http --url=$NGROK_DOMAIN 8000"

Write-Host "Semua service sedang distart..." -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend  : http://localhost:8000" -ForegroundColor Cyan
Write-Host "  ngrok    : https://$NGROK_DOMAIN" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tutup masing-masing terminal untuk stop service." -ForegroundColor Gray
