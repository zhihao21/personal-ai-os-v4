param([switch]$NoAnimation, [switch]$ForceAnimation)

$ErrorActionPreference = 'Stop'
$appId = 'OpenAI.Codex_2p2nqsd0c76g0!App'
$mutex = $null
$ownsMutex = $false
$window = $null
$timer = $null
$sounds = New-Object System.Collections.ArrayList
$shouldLaunch = $true
$launched = $false
$config = @{ durationSeconds = 23.2; audio = $true }
try {
    $saved = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'codex-config.json') -Raw | ConvertFrom-Json
    if ($null -ne $saved.durationSeconds) { $config.durationSeconds = [Math]::Max(22, [Math]::Min(25, [double]$saved.durationSeconds)) }
    if ($null -ne $saved.audio) { $config.audio = [bool]$saved.audio }
} catch { }

function Open-Codex {
    if ($script:launched) { return }
    Start-Process -FilePath "$env:WINDIR\explorer.exe" -ArgumentList "shell:AppsFolder\$appId" | Out-Null
    $script:launched = $true
}

function Test-CodexRunning {
    # Exclude command-line workers and Chromium child processes.
    @(Get-CimInstance Win32_Process -Filter "Name = 'ChatGPT.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.ExecutablePath -like '*\WindowsApps\OpenAI.Codex_*\app\ChatGPT.exe' -and $_.CommandLine -notmatch '--type=' }).Count -gt 0
}

function Brush($value) { [System.Windows.Media.BrushConverter]::new().ConvertFromString($value) }

function Add-Text($parent, $value, $x, $y, $size, $color, $bold = $false, $family = 'Consolas') {
    $item = New-Object System.Windows.Controls.TextBlock
    $item.Text = $value
    $item.FontFamily = New-Object System.Windows.Media.FontFamily($family)
    $item.FontSize = $size
    if ($bold) { $item.FontWeight = [System.Windows.FontWeights]::Bold }
    $item.Foreground = Brush $color
    [System.Windows.Controls.Canvas]::SetLeft($item, [double]$x)
    [System.Windows.Controls.Canvas]::SetTop($item, [double]$y)
    $parent.Children.Add($item) | Out-Null
    return $item
}

function Add-Line($parent, $x1, $y1, $x2, $y2, $color, $width = 1) {
    $item = New-Object System.Windows.Shapes.Line
    $item.X1 = $x1; $item.Y1 = $y1; $item.X2 = $x2; $item.Y2 = $y2
    $item.Stroke = Brush $color
    $item.StrokeThickness = $width
    $parent.Children.Add($item) | Out-Null
    return $item
}

function Add-Box($parent, $x, $y, $width, $height, $fill, $stroke = '#355267') {
    $item = New-Object System.Windows.Shapes.Rectangle
    $item.Width = $width; $item.Height = $height
    $item.Fill = Brush $fill; $item.Stroke = Brush $stroke
    $item.StrokeThickness = 1
    [System.Windows.Controls.Canvas]::SetLeft($item, [double]$x)
    [System.Windows.Controls.Canvas]::SetTop($item, [double]$y)
    $parent.Children.Add($item) | Out-Null
    return $item
}

function Add-Ring($parent, $size, $x, $y, $color, $width = 1, $dash = '') {
    $item = New-Object System.Windows.Shapes.Ellipse
    $item.Width = $size; $item.Height = $size
    $item.Stroke = Brush $color; $item.StrokeThickness = $width
    if ($dash) {
        $item.StrokeDashArray = New-Object System.Windows.Media.DoubleCollection
        foreach ($part in $dash.Split(' ')) { $item.StrokeDashArray.Add([double]$part) }
    }
    [System.Windows.Controls.Canvas]::SetLeft($item, [double]$x)
    [System.Windows.Controls.Canvas]::SetTop($item, [double]$y)
    $parent.Children.Add($item) | Out-Null
    return $item
}

function Add-Layer($parent) {
    $layer = New-Object System.Windows.Controls.Canvas
    $layer.Width = 1440; $layer.Height = 900; $layer.Opacity = 0
    $parent.Children.Add($layer) | Out-Null
    return $layer
}

function Phase-Opacity($elapsed, $fadeInStart, $fadeInEnd, $fadeOutStart, $fadeOutEnd) {
    if ($elapsed -lt $fadeInStart -or $elapsed -ge $fadeOutEnd) { return 0.0 }
    if ($elapsed -lt $fadeInEnd) { return ($elapsed - $fadeInStart) / ($fadeInEnd - $fadeInStart) }
    if ($elapsed -lt $fadeOutStart) { return 1.0 }
    return 1.0 - ($elapsed - $fadeOutStart) / ($fadeOutEnd - $fadeOutStart)
}

function Play-Tone($hz, $lengthMs = 180) {
    if (-not $config.audio) { return }
    try {
        $stream = [IO.MemoryStream]::new([CodexTone]::MakeWav([double]$hz, [int]$lengthMs))
        $player = New-Object System.Media.SoundPlayer($stream)
        $player.Play()
        [void]$sounds.Add(@($player, $stream))
    } catch { } # Audio availability must never block Codex.
}

try {
    $mutex = New-Object Threading.Mutex($false, 'Local\CodexStartupAnimation')
    try { $ownsMutex = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) { $shouldLaunch = $false; return }
    if ($NoAnimation -or (-not $ForceAnimation -and (Test-CodexRunning))) { return }

    Add-Type -AssemblyName PresentationFramework,PresentationCore,WindowsBase
    Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Text;
public static class CodexTone {
    public static byte[] MakeWav(double hz, int milliseconds) {
        const int rate = 22050;
        int count = rate * milliseconds / 1000;
        using (var stream = new MemoryStream())
        using (var writer = new BinaryWriter(stream)) {
            writer.Write(Encoding.ASCII.GetBytes("RIFF")); writer.Write(36 + count * 2);
            writer.Write(Encoding.ASCII.GetBytes("WAVEfmt ")); writer.Write(16);
            writer.Write((short)1); writer.Write((short)1);
            writer.Write(rate); writer.Write(rate * 2);
            writer.Write((short)2); writer.Write((short)16);
            writer.Write(Encoding.ASCII.GetBytes("data")); writer.Write(count * 2);
            for (int i = 0; i < count; i++) {
                double t = (double)i / rate;
                double envelope = Math.Sin(Math.PI * i / count);
                double wave = Math.Sin(2 * Math.PI * hz * t) + .19 * Math.Sin(3 * Math.PI * hz * t);
                writer.Write((short)Math.Max(-32000, Math.Min(32000, wave * envelope * 2600)));
            }
            return stream.ToArray();
        }
    }
}
'@
    $xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" Title="Codex startup" WindowStyle="None" ResizeMode="NoResize" ShowInTaskbar="False" Topmost="True" Background="#050A11" Focusable="True">
  <Viewbox Stretch="Uniform">
    <Canvas Width="1440" Height="900" Name="Scene">
      <Canvas.Background><RadialGradientBrush Center="0.5,0.48" RadiusX="0.85" RadiusY="0.9"><GradientStop Color="#13283A" Offset="0"/><GradientStop Color="#050A11" Offset="0.78"/></RadialGradientBrush></Canvas.Background>
    </Canvas>
  </Viewbox>
</Window>
'@
    $reader = New-Object Xml.XmlNodeReader ([xml]$xaml)
    $window = [Windows.Markup.XamlReader]::Load($reader)
    $scene = $window.FindName('Scene')
    $window.Left = 0; $window.Top = 0
    $window.Width = [System.Windows.SystemParameters]::PrimaryScreenWidth
    $window.Height = [System.Windows.SystemParameters]::PrimaryScreenHeight

    # Shared architectural grid and slow scan field.
    for ($x = 80; $x -lt 1440; $x += 80) { [void](Add-Line $scene $x 0 $x 900 '#17293A') }
    for ($y = 60; $y -lt 900; $y += 80) { [void](Add-Line $scene 0 $y 1440 $y '#17293A') }
    [void](Add-Line $scene 68 94 1372 94 '#345D73')
    [void](Add-Line $scene 68 822 1372 822 '#345D73')
    $scan = Add-Line $scene 0 110 1440 110 '#547FD3E8' 2
    $scan.Opacity = .16
    $random = New-Object Random
    $particles = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt 48; $i++) {
        $dot = New-Object System.Windows.Shapes.Ellipse
        $dot.Width = 2 + $random.Next(3); $dot.Height = $dot.Width
        $dot.Fill = Brush '#74B9C8'; $dot.Opacity = .12
        [System.Windows.Controls.Canvas]::SetLeft($dot, [double]($random.Next(1380) + 30))
        [System.Windows.Controls.Canvas]::SetTop($dot, [double]($random.Next(760) + 90))
        $scene.Children.Add($dot) | Out-Null
        [void]$particles.Add($dot)
    }

    # Phase 1: OpenAI emblem, radial registration and concentric sweeps.
    $awakening = Add-Layer $scene
    [void](Add-Text $awakening 'OPENAI  /  CODEX' 86 52 17 '#AEDBE5' $true)
    [void](Add-Text $awakening 'SYSTEM AWAKENING' 1130 52 15 '#6F9CAE')
    $orbit = New-Object System.Windows.Controls.Canvas
    $orbit.Width = 560; $orbit.Height = 560
    [System.Windows.Controls.Canvas]::SetLeft($orbit, [double]440)
    [System.Windows.Controls.Canvas]::SetTop($orbit, [double]132)
    $awakening.Children.Add($orbit) | Out-Null
    [void](Add-Ring $orbit 545 7 7 '#4F9FD5EA' 2 '5 15')
    [void](Add-Ring $orbit 460 50 50 '#3877B6C5' 1 '2 9')
    [void](Add-Ring $orbit 370 95 95 '#5978C5D6' 2 '9 16')
    [void](Add-Ring $orbit 278 141 141 '#4B8ED3DD' 1 '3 12')
    [void](Add-Line $orbit 280 10 280 550 '#4280ABB9')
    [void](Add-Line $orbit 10 280 550 280 '#4280ABB9')
    $orbit.RenderTransformOrigin = New-Object System.Windows.Point(.5,.5)
    $orbitRotation = New-Object System.Windows.Media.RotateTransform
    $orbit.RenderTransform = $orbitRotation
    $emblem = New-Object System.Windows.Controls.Image
    $emblem.Width = 180; $emblem.Height = 180
    $emblem.Stretch = [System.Windows.Media.Stretch]::Uniform
    [System.Windows.Controls.Canvas]::SetLeft($emblem, [double]630)
    [System.Windows.Controls.Canvas]::SetTop($emblem, [double]322)
    try {
        $package = Get-AppxPackage OpenAI.Codex | Select-Object -First 1
        $imagePath = Join-Path $package.InstallLocation 'assets\Square44x44Logo.targetsize-256_altform-unplated.png'
        $image = New-Object System.Windows.Media.Imaging.BitmapImage
        $image.BeginInit()
        $image.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
        $image.UriSource = New-Object Uri($imagePath)
        $image.EndInit(); $image.Freeze()
        $emblem.Source = $image
    } catch { }
    $awakening.Children.Add($emblem) | Out-Null
    [void](Add-Text $awakening 'SIGNAL ACQUIRED  /  SESSION 01' 510 715 18 '#A5DAE5')
    [void](Add-Text $awakening 'LOCAL ENVIRONMENT  //  VISUAL STARTUP SEQUENCE' 457 754 14 '#648FA5')
    $awakeningScale = New-Object System.Windows.Media.ScaleTransform(1.08,1.08)
    $awakening.RenderTransformOrigin = New-Object System.Windows.Point(.5,.5)
    $awakening.RenderTransform = $awakeningScale

    # Phase 2: green terminal instrumentation. Labels are cinematic UI, not real security checks.
    $terminal = Add-Layer $scene
    [void](Add-Text $terminal 'CODEX  /  BOOT SEQUENCE' 84 51 18 '#8DECC0' $true)
    [void](Add-Text $terminal 'DIAGNOSTIC STREAM  02 / 05' 1086 52 15 '#729C8A')
    [void](Add-Box $terminal 88 168 620 548 '#B009171A' '#357D6C')
    [void](Add-Box $terminal 739 168 612 548 '#A80A171B' '#357D6C')
    [void](Add-Text $terminal 'INITIALIZATION LOG' 116 190 18 '#A6EFCB' $true)
    [void](Add-Line $terminal 116 231 680 231 '#2F795E')
    $terminalLines = New-Object System.Collections.ArrayList
    $messages = @(
        '00:01  CORE RUNTIME ............. ONLINE',
        '00:02  INTERFACE MATRIX ......... LINKED',
        '00:03  LOCAL WORKSPACE ......... MOUNTED',
        '00:04  TOOL ROUTES ............. READY',
        '00:05  SESSION PROFILE ......... LOADED',
        '00:06  SIGNAL INTEGRITY ........ STABLE',
        '00:07  IDENTITY CHANNEL ....... ALIGNED',
        '00:08  ACCESS HANDSHAKE ....... COMPLETE',
        '00:09  VISUAL SYSTEM .......... NOMINAL'
    )
    for ($i = 0; $i -lt $messages.Count; $i++) {
        $row = Add-Text $terminal $messages[$i] 116 (254 + $i * 42) 17 '#70DDA5'
        $row.Visibility = [System.Windows.Visibility]::Hidden
        [void]$terminalLines.Add($row)
    }
    [void](Add-Text $terminal 'SYSTEM SIGNALS' 768 190 18 '#A6EFCB' $true)
    [void](Add-Line $terminal 768 231 1320 231 '#2F795E')
    $metrics = @(@('RUNTIME','97.4%'),@('INTERFACE','SYNC'),@('WORKSPACE','ACTIVE'),@('CHANNEL','STABLE'))
    for ($i = 0; $i -lt $metrics.Count; $i++) {
        $y = 266 + $i * 96
        [void](Add-Text $terminal $metrics[$i][0] 776 $y 15 '#6AA98E')
        [void](Add-Text $terminal $metrics[$i][1] 1190 $y 20 '#B8F7D5' $true)
        [void](Add-Line $terminal 776 ($y + 50) 1318 ($y + 50) '#315947')
    }
    $terminalScan = Add-Line $terminal 740 255 1350 255 '#4F70F0B2' 2
    $terminalScan.Opacity = .3
    [void](Add-Text $terminal '>>  LINKING CODEX INTERFACE  _' 775 665 17 '#7FE9B3')
    $terminalShift = New-Object System.Windows.Media.TranslateTransform
    $terminal.RenderTransform = $terminalShift

    # Phase 3: layered data cards, holographic traces and a central sync core.
    $interface = Add-Layer $scene
    [void](Add-Text $interface 'CODEX  /  INTERFACE ACTIVATION' 84 51 18 '#BFE9F2' $true)
    [void](Add-Text $interface 'HOLOGRAPHIC LINK  03 / 05' 1060 52 15 '#729FB0')
    [void](Add-Box $interface 80 186 340 502 '#A80B1A2A' '#3D7894')
    [void](Add-Box $interface 1020 186 340 502 '#A80B1A2A' '#3D7894')
    [void](Add-Text $interface 'CHANNEL MAP' 105 208 17 '#A9E3EE' $true)
    [void](Add-Text $interface 'SESSION VECTOR' 1044 208 17 '#A9E3EE' $true)
    for ($i=0; $i -lt 7; $i++) {
        $y = 276 + $i * 52
        [void](Add-Line $interface 108 $y 392 $y '#2A5368')
        [void](Add-Text $interface ('NODE {0:00}' -f ($i+1)) 108 ($y + 8) 14 '#719DB2')
        [void](Add-Text $interface ('{0:000} / STABLE' -f (97+$i)) 1050 ($y + 8) 14 '#8BC5D2')
    }
    $core = New-Object System.Windows.Controls.Canvas
    $core.Width = 480; $core.Height = 480
    [System.Windows.Controls.Canvas]::SetLeft($core, [double]480)
    [System.Windows.Controls.Canvas]::SetTop($core, [double]182)
    $interface.Children.Add($core) | Out-Null
    [void](Add-Ring $core 470 5 5 '#5B7CCADA' 2 '5 14')
    [void](Add-Ring $core 368 56 56 '#4975A9BC' 1 '1 9')
    [void](Add-Ring $core 256 112 112 '#4CA6D8E5' 2 '7 15')
    [void](Add-Line $core 240 0 240 480 '#3A7692A5')
    [void](Add-Line $core 0 240 480 240 '#3A7692A5')
    $core.RenderTransformOrigin = New-Object System.Windows.Point(.5,.5)
    $coreRotation = New-Object System.Windows.Media.RotateTransform
    $core.RenderTransform = $coreRotation
    [void](Add-Text $interface 'CODEX' 591 355 46 '#E9F9FE' $true 'Segoe UI')
    [void](Add-Text $interface 'INTERFACE ACTIVE' 581 425 18 '#77D8E5')
    $bars = New-Object System.Collections.ArrayList
    for ($i=0; $i -lt 14; $i++) {
        $bar = Add-Box $interface (1029 + $i * 21) (598 - $i % 3 * 8) 12 10 '#639DC8DC' '#639DC8DC'
        [void]$bars.Add($bar)
    }
    $interfaceShift = New-Object System.Windows.Media.TranslateTransform
    $interface.RenderTransform = $interfaceShift

    # Phase 4: wide, quiet ready composition and final synchronization.
    $ready = Add-Layer $scene
    [void](Add-Line $ready 280 300 1160 300 '#3A7696')
    [void](Add-Line $ready 280 548 1160 548 '#3A7696')
    [void](Add-Text $ready 'OPENAI  /  CODEX' 613 235 19 '#81B8C6' $true)
    $readyTitle = Add-Text $ready 'SYSTEM READY TO LAUNCH' 293 363 53 '#EFFBFF' $true 'Segoe UI'
    [void](Add-Text $ready 'ALL SYSTEMS NOMINAL  //  WORKSPACE PREPARED' 459 452 19 '#8FCBD4')
    [void](Add-Text $ready 'FINAL SYNCHRONIZATION' 590 590 17 '#6EACBC')
    $readyRing = Add-Ring $ready 780 330 46 '#2869A9BE' 1 '4 20'
    $readyRing.RenderTransformOrigin = New-Object System.Windows.Point(.5,.5)
    $readyRotation = New-Object System.Windows.Media.RotateTransform
    $readyRing.RenderTransform = $readyRotation

    # Persistent status rail, drawn over the phase layers.
    [void](Add-Text $scene 'ESC  /  SKIP' 1260 845 14 '#84A9B9')
    $phaseLabel = Add-Text $scene '01  /  SYSTEM AWAKENING' 86 845 14 '#9CCDD8'
    $percent = Add-Text $scene '000%' 1287 782 18 '#B9EDF2'
    [void](Add-Line $scene 88 815 1352 815 '#2D4D62' 4)
    $progress = Add-Line $scene 88 815 88 815 '#70D6E9' 4

    $duration = [double]$config.durationSeconds
    $watch = [Diagnostics.Stopwatch]::StartNew()
    $lastPhase = -1
    $timer = New-Object System.Windows.Threading.DispatcherTimer
    $timer.Interval = [TimeSpan]::FromMilliseconds(33)
    $timer.Add_Tick({
        try {
            $t = $watch.Elapsed.TotalSeconds
            if ($t -ge $duration) { $timer.Stop(); $window.Close(); return }
            $phase = if ($t -lt 5.2) {0} elseif ($t -lt 11) {1} elseif ($t -lt 18) {2} elseif ($t -lt 22) {3} else {4}
            if ($phase -ne $lastPhase) {
                $phaseLabel.Text = @('01  /  SYSTEM AWAKENING','02  /  INITIALIZING','03  /  INTERFACE ACTIVATION','04  /  SYSTEM READY','05  /  ENTERING CODEX')[$phase]
                $lastPhase = $phase
                Play-Tone (310 + $phase * 95) (165 + $phase * 30)
            }
            if ($t -ge 22 -and -not $script:launched) { Open-Codex }
            $awakening.Opacity = Phase-Opacity $t 0 .7 4.4 5.6
            $terminal.Opacity = Phase-Opacity $t 4.6 5.7 10.3 11.6
            $interface.Opacity = Phase-Opacity $t 10.6 11.8 17.2 18.6
            $ready.Opacity = Phase-Opacity $t 17.5 18.6 22.4 $duration
            $orbitRotation.Angle = $t * 14
            $coreRotation.Angle = -$t * 9
            $readyRotation.Angle = $t * 2.6
            $awakeningScale.ScaleX = 1.08 - [Math]::Min(.08, $t * .016)
            $awakeningScale.ScaleY = $awakeningScale.ScaleX
            $emblem.Opacity = .72 + .22 * [Math]::Sin($t * 1.8)
            $terminalShift.X = 32 * [Math]::Max(0, 1 - ($t - 4.6) / 1.1)
            $interfaceShift.X = -34 * [Math]::Max(0, 1 - ($t - 10.6) / 1.2)
            $terminalScan.Y1 = 260 + (($t * 95) % 390); $terminalScan.Y2 = $terminalScan.Y1
            $scan.Y1 = 110 + (($t * 62) % 670); $scan.Y2 = $scan.Y1
            $visibleRows = [Math]::Max(0, [Math]::Min($terminalLines.Count, [int][Math]::Floor(($t - 5.1) * 1.7)))
            for ($i=0; $i -lt $terminalLines.Count; $i++) {
                $terminalLines[$i].Visibility = if ($i -lt $visibleRows) { [System.Windows.Visibility]::Visible } else { [System.Windows.Visibility]::Hidden }
            }
            for ($i=0; $i -lt $bars.Count; $i++) {
                $bars[$i].Height = 12 + 34 * [Math]::Abs([Math]::Sin($t * 1.5 + $i * .47))
            }
            for ($i=0; $i -lt $particles.Count; $i++) {
                $particles[$i].Opacity = .09 + .36 * [Math]::Abs([Math]::Sin($t * .62 + $i * .73))
            }
            $readyTitle.Opacity = .84 + .16 * [Math]::Sin($t * 1.7)
            $fraction = [Math]::Min(1, $t / $duration)
            $progress.X2 = 88 + 1264 * $fraction
            $percent.Text = ('{0:000}%' -f [int]($fraction * 100))
            if ($t -gt 22.1) { $scene.Opacity = [Math]::Max(0, ($duration - $t) / ($duration - 22.1)) }
        } catch { $timer.Stop(); $window.Close() }
    }.GetNewClosure())
    $window.Add_KeyDown({ if ($_.Key -eq [System.Windows.Input.Key]::Escape) { $timer.Stop(); $window.Close() } }.GetNewClosure())
    $window.Add_ContentRendered({ $window.Focus() | Out-Null; $timer.Start() }.GetNewClosure())
    [void]$window.ShowDialog()
} catch {
    # Rendering failures still deliver the official application.
} finally {
    if ($timer) { $timer.Stop() }
    if ($window -and $window.IsVisible) { $window.Close() }
    foreach ($sound in $sounds) { foreach ($part in $sound) { try { $part.Dispose() } catch { } } }
    if ($shouldLaunch) { try { Open-Codex } catch { } }
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    if ($mutex) { $mutex.Dispose() }
}
