$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$programs = [Environment]::GetFolderPath('Programs')
$shortcutPath = Join-Path $programs 'Codex.lnk'
$package = Get-AppxPackage OpenAI.Codex | Select-Object -First 1
if (-not $package) { throw 'The official OpenAI Codex MSIX package is not installed.' }

# Keep the icon outside the read-only package so the pinned shortcut survives updates.
$iconDir = Join-Path $env:LOCALAPPDATA 'Codex Startup'
New-Item -ItemType Directory -Path $iconDir -Force | Out-Null
$iconPath = Join-Path $iconDir 'Codex.ico'
$source = Join-Path $package.InstallLocation 'assets\Square44x44Logo.targetsize-256_altform-unplated.png'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class IconCleanup {
  [DllImport("user32.dll")] public static extern bool DestroyIcon(IntPtr handle);
}
'@
$bitmap = [Drawing.Bitmap]::FromFile($source)
try {
    $handle = $bitmap.GetHicon()
    try {
        $icon = [Drawing.Icon]::FromHandle($handle)
        $file = [IO.File]::Create($iconPath)
        try { $icon.Save($file) } finally { $file.Dispose(); $icon.Dispose() }
    } finally { [void][IconCleanup]::DestroyIcon($handle) }
} finally { $bitmap.Dispose() }

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "$env:WINDIR\System32\wscript.exe"
$shortcut.Arguments = ('"{0}"' -f (Join-Path $root 'Launch-Codex.vbs'))
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Description = 'Codex cinematic startup, then official app'
$shortcut.Save()

# Remove only the two shortcuts created by the previous implementation.
$desktop = [Environment]::GetFolderPath('Desktop')
foreach ($name in @('Codex Animated.lnk', 'Codex Direct.lnk')) {
    $oldPath = Join-Path $desktop $name
    if (-not (Test-Path -LiteralPath $oldPath)) { continue }
    $old = $shell.CreateShortcut($oldPath)
    if (($name -eq 'Codex Animated.lnk' -and $old.Arguments -like '*Launch-Codex.vbs*') -or
        ($name -eq 'Codex Direct.lnk' -and $old.Arguments -like '*OpenAI.Codex_2p2nqsd0c76g0!App*')) {
        Remove-Item -LiteralPath $oldPath
    }
}
Write-Output "Created $shortcutPath"
Write-Output 'If Windows offers Pin to taskbar for this Start shortcut, pin it and then unpin the original MSIX pin. The existing pin cannot be redirected safely.'
