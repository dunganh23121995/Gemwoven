# Temporary test link: a Cloudflare quick tunnel (random *.trycloudflare.com URL, no account
# or DNS change) to the local web server. Runs as svc-gemwoven via task GemwovenQuickTunnel.
$logs = 'C:\Srv\Gemwoven\logs'
Remove-Item "$logs\quicktunnel.log" -ErrorAction SilentlyContinue
& 'C:\Program Files (x86)\cloudflared\cloudflared.exe' tunnel --no-autoupdate --url http://127.0.0.1:8090 --logfile "$logs\quicktunnel.log"
