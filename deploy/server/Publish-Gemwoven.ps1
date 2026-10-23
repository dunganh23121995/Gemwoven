# Publish a new build (run as an administrator on the server from the staging folder that
# holds Gemwoven_6_Man.html, Game.html, index.html and the app scripts): copies the files,
# writes the .gz copies serve.py sends to gzip-capable browsers, and restarts the web server.
param([string]$Staging = "$env:USERPROFILE\gemwoven-staging")
$ErrorActionPreference = 'Stop'
$root = 'C:\Srv\Gemwoven'
Copy-Item "$Staging\serve.py", "$Staging\Start-Gemwoven.ps1", "$Staging\Start-QuickTunnel.ps1" "$root\app" -Force
Copy-Item "$Staging\Gemwoven_6_Man.html" "$root\www\Gemwoven.html" -Force
Copy-Item "$Staging\Game.html", "$Staging\index.html" "$root\www" -Force
foreach ($file in Get-ChildItem "$root\www" -Filter *.html) {
    $in = [IO.File]::OpenRead($file.FullName); $out = [IO.File]::Create("$($file.FullName).gz")
    $gz = New-Object IO.Compression.GZipStream($out, [IO.Compression.CompressionLevel]::Optimal)
    $in.CopyTo($gz); $gz.Dispose(); $out.Dispose(); $in.Dispose()
    (Get-Item "$($file.FullName).gz").LastWriteTime = $file.LastWriteTime
}
Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object CommandLine -like "*$root\app\serve.py*" | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Start-ScheduledTask GemwovenServer
'Published.'
