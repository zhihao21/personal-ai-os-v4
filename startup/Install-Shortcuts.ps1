$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath('Desktop')
$shell = New-Object -ComObject WScript.Shell
$animated = $shell.CreateShortcut((Join-Path $desktop 'Codex Animated.lnk'))
$animated.TargetPath = "$env:WINDIR\System32\wscript.exe"
$animated.Arguments = ('"{0}"' -f (Join-Path $root 'Launch-Codex.vbs'))
$animated.WorkingDirectory = $root
$animated.Description = 'Play startup animation, then open the official Codex app'
$animated.Save()
$direct = $shell.CreateShortcut((Join-Path $desktop 'Codex Direct.lnk'))
$direct.TargetPath = "$env:WINDIR\explorer.exe"
$direct.Arguments = 'shell:AppsFolder\OpenAI.Codex_2p2nqsd0c76g0!App'
$direct.Description = 'Open the official Codex app directly'
$direct.Save()
Write-Output "Created $($animated.FullName) and $($direct.FullName)"
