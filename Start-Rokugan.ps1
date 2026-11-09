$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Установите Node.js 22+ и повторите запуск.' }
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules'))) {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось установить зависимости.' }
}
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Сборка не прошла. См. сообщение выше.' }
Write-Host 'Откройте http://localhost:3001. Остановка сервера: Ctrl+C.'
& npm.cmd run serve
