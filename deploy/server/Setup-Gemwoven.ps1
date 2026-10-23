# One-time (re-runnable) setup of Gemwoven on the LAN server, run as an administrator.
# Mirrors the BaoPiu layout: C:\Srv\Gemwoven, its own non-admin account svc-gemwoven with no
# SSH/RDP/interactive logon, a normal-run-level startup task, LAN egress blocked, and the
# site reachable only through Cloudflare Tunnel (the web server binds 127.0.0.1:8090).
# The game keeps saves in the player's browser, so there is no server database to back up.
param([switch]$ResetPassword)
$ErrorActionPreference = 'Stop'
$svc = 'svc-gemwoven'; $U = "$env:COMPUTERNAME\$svc"; $root = 'C:\Srv\Gemwoven'
$credFile = 'C:\Srv\_ops\svc-gemwoven.cred'
Add-Type -AssemblyName System.Security
$scope = [Security.Cryptography.DataProtectionScope]::LocalMachine

# 1. Account (random 44-char password, kept DPAPI-machine-encrypted, Administrators/SYSTEM only).
if (-not (Get-LocalUser $svc -ErrorAction SilentlyContinue) -or $ResetPassword -or -not (Test-Path $credFile)) {
    $pw = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ }) + '!aA1'
    $secure = ConvertTo-SecureString $pw -AsPlainText -Force
    if (Get-LocalUser $svc -ErrorAction SilentlyContinue) { Set-LocalUser $svc -Password $secure }
    else { New-LocalUser $svc -Password $secure -PasswordNeverExpires -UserMayNotChangePassword -Description 'Gemwoven web service (no logon)' | Out-Null }
    [IO.File]::WriteAllBytes($credFile, [Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes($pw), $null, $scope))
}
$pw = [Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($credFile), $null, $scope))
$sid = (Get-LocalUser $svc).SID.Value
$acl = Get-Acl $credFile; $acl.SetAccessRuleProtection($true, $false)
foreach ($who in 'BUILTIN\Administrators', 'NT AUTHORITY\SYSTEM') { $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($who, 'FullControl', 'Allow'))) }
Set-Acl $credFile $acl

# 2. Logon rights: batch (scheduled task) only; deny network, interactive and RDP logon.
$inf = Join-Path $env:TEMP 'gw-sec.inf'; $db = Join-Path $env:TEMP 'gw-sec.sdb'
secedit /export /cfg $inf /areas USER_RIGHTS | Out-Null
$lines = Get-Content $inf
$wanted = 'SeBatchLogonRight', 'SeDenyNetworkLogonRight', 'SeDenyInteractiveLogonRight', 'SeDenyRemoteInteractiveLogonRight'
$out = foreach ($line in $lines) {
    $name = ($line -split '\s*=\s*', 2)[0]
    if ($wanted -contains $name -and $line -notmatch [regex]::Escape("*$sid") -and $line -notmatch "\b$svc\b") { "$line,*$sid" } else { $line }
}
foreach ($name in $wanted) { if (-not ($lines -match "^$name\s*=")) { $out += "$name = *$sid" } }
$out | Set-Content $inf -Encoding Unicode
secedit /configure /db $db /cfg $inf /areas USER_RIGHTS /quiet | Out-Null
Remove-Item $inf, $db -ErrorAction SilentlyContinue

# 3. Folders: only Administrators, SYSTEM and svc-gemwoven; the account may write logs only.
foreach ($dir in "$root", "$root\www", "$root\app", "$root\logs", "$root\tunnel", 'G:\Backups\Gemwoven') { New-Item -ItemType Directory -Force $dir | Out-Null }
function Set-Owned($path, $svcRights) {
    $a = New-Object Security.AccessControl.DirectorySecurity
    $a.SetAccessRuleProtection($true, $false)
    $inherit = 'ContainerInherit,ObjectInherit'
    foreach ($who in 'BUILTIN\Administrators', 'NT AUTHORITY\SYSTEM') { $a.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($who, 'FullControl', $inherit, 'None', 'Allow'))) }
    if ($svcRights) { $a.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($U, $svcRights, $inherit, 'None', 'Allow'))) }
    Set-Acl $path $a
}
Set-Owned $root 'ReadAndExecute'
Set-Owned "$root\logs" 'Modify'
Set-Owned 'G:\Backups\Gemwoven' $null

# 4. Windows Firewall: the account's processes may not reach the LAN.
Get-NetFirewallRule -DisplayName 'Gemwoven svc - block LAN*' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName 'Gemwoven svc - block LAN outbound' -Direction Outbound -Action Block -RemoteAddress 192.168.0.0/16 -LocalUser "O:LSD:(A;;CC;;;$sid)" -Profile Any | Out-Null

# 5. Startup task at normal run level; the quick-tunnel task is on demand (temporary test link).
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
$trigger = New-ScheduledTaskTrigger -AtStartup; $trigger.Delay = 'PT1M'
$start = New-ScheduledTaskAction -Execute powershell.exe -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$root\app\Start-Gemwoven.ps1`"" -WorkingDirectory $root
Register-ScheduledTask -TaskName GemwovenServer -Action $start -Trigger $trigger -Settings $settings -User $U -Password $pw -RunLevel Limited -Force | Out-Null
$quick = New-ScheduledTaskAction -Execute powershell.exe -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$root\app\Start-QuickTunnel.ps1`"" -WorkingDirectory $root
Register-ScheduledTask -TaskName GemwovenQuickTunnel -Action $quick -Settings $settings -User $U -Password $pw -RunLevel Limited -Force | Out-Null

# 6. sshd: refuse the service account outright (in addition to the denied network logon).
$sshd = 'C:\ProgramData\ssh\sshd_config'
$text = Get-Content $sshd
if (-not ($text -match "^DenyUsers .*\b$svc\b")) {
    Copy-Item $sshd "$sshd.bak-gemwoven" -Force
    $text = $text | ForEach-Object { if ($_ -match '^DenyUsers ') { "$_ $svc" } else { $_ } }
    if (-not ($text -match '^DenyUsers ')) { $text += "DenyUsers $svc" }
    $text | Set-Content $sshd -Encoding ascii
    & 'C:\Windows\System32\OpenSSH\sshd.exe' -t
    if ($LASTEXITCODE -ne 0) { Copy-Item "$sshd.bak-gemwoven" $sshd -Force; throw 'sshd_config check failed; restored.' }
    $global:RestartSshd = $true
}
'Gemwoven setup done.'
