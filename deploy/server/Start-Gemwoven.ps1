# Runs as svc-gemwoven (task GemwovenServer, normal run level). Serves www on 127.0.0.1:8090
# and, when present, runs the Cloudflare named tunnel described by tunnel\config.yml.
$ErrorActionPreference = 'Stop'
$root = 'C:\Srv\Gemwoven'; $logs = Join-Path $root 'logs'
$python = 'C:\Program Files\Python312\python.exe'
$cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (-not (Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue)) {
    Start-Process $python -WindowStyle Hidden -ArgumentList @("`"$root\app\serve.py`"", "`"$root\www`"", '8090', "`"$logs\web.log`"")
}
$config = Join-Path $root 'tunnel\config.yml'
if ((Test-Path $config) -and -not (Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" | Where-Object CommandLine -like "*$config*")) {
    Start-Process $cloudflared -WindowStyle Hidden -ArgumentList @('tunnel', '--no-autoupdate', '--config', "`"$config`"", '--logfile', "`"$logs\cloudflared.log`"", 'run')
}
