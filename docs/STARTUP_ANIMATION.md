# Codex Desktop startup animation

## Launch path

The user-level Start shortcut `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Codex.lnk` uses the official Codex icon copied into `%LOCALAPPDATA%\Codex Startup\Codex.ico`. It starts `startup/Launch-Codex.vbs`, which starts `startup/Invoke-CodexStartup.ps1` with no visible console. The PowerShell process owns one native WPF window. At handoff it activates the registered official MSIX application, `OpenAI.Codex_2p2nqsd0c76g0!App`, and exits. Escape closes the window and activates Codex immediately. If Codex is already running, the sequence is skipped and the official window is brought forward. A named mutex suppresses concurrent sequences; a launch or rendering error falls back to official app activation. The official package, authentication, protocols, files, and settings are never modified.

Run the installer from the repository root after moving the repository:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\startup\Install-Shortcuts.ps1
```

The installer creates the user-level Start shortcut and removes only the two desktop shortcuts made by the earlier implementation, after confirming their targets. It does not edit the taskbar pin. Audio and duration are configured in `startup/codex-config.json`; set `audio` to `false` for silence. Duration is limited to 22–25 seconds. The visual stages are presentation only; the diagnostic text does not perform authentication or security checks.

## Visual sequence and rendering

- 0–5 seconds: official OpenAI emblem from the installed package, rotating concentric rings, radial registration lines, soft pulse, and particles.
- 5–11 seconds: green diagnostic stream and two technical status panels.
- 11–18 seconds: layered interface cards, central synchronization core, and animated data bars.
- 18–22 seconds: **SYSTEM READY TO LAUNCH** with a brief final synchronization hold.
- 22–23.2 seconds: activate Codex, fade out the native window, release audio streams, and terminate the PowerShell helper.

The reference video requested for V2.0 was not present in the available workspace when this sequence was built. The result follows the written phase description; frame-by-frame comparison remains pending the video file.

WPF is used instead of WebView2. It avoids a browser process group and user data folder lifetime. The window does not request per-pixel transparency, so WPF can use its hardware rendering path when available. This machine reports WPF rendering tier 2. See Microsoft's [WPF rendering tiers](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/graphics-rendering-tiers) and [WebView2 process model](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/process-model).

## Taskbar limitation and rollback

The existing Codex taskbar item is an MSIX application pin. There is no `Codex.lnk` in the user's taskbar shortcut directory to retarget. A shell request to pin the replacement shortcut produced no pin, and Windows exposes no **Pin to taskbar** shell verb for it. Microsoft's [TaskbarManager pin request](https://learn.microsoft.com/en-us/windows/apps/develop/windows-integration/pin-to-taskbar) is a limited access feature that requires approval and a supported app identity; it is not a general API for silently redirecting an existing MSIX pin. Editing `Taskband` registry data or the official package is outside this implementation.

**The taskbar acceptance criterion remains open.** To try manual repinning: open Start, find the user-level **Codex** shortcut using **Open file location**, right-click it, and choose **Show more options → Pin to taskbar** if Windows offers it. Click the new pin and verify the full launch before unpinning the original. If that option is unavailable, keep the original pin. A generic launcher may display a second icon while the official MSIX app runs because Windows groups them under different identities.

To restore direct launch, unpin a replacement launcher if one was created, then pin the official Codex app from Start. The original pin remains untouched by the installer. The user-level shortcut and copied icon can then be removed. `-NoAnimation` on `startup/Invoke-CodexStartup.ps1` also invokes the official app directly.

## Desktop validation

- The V2 sequence completed in 25.06 seconds from helper process start, including PowerShell and WPF setup; the on-screen animation is configured for 23.2 seconds. Desktop captures showed the emblem, the green diagnostic scene, the interface transition, and the ready scene.
- The native window closed and its helper process exited at completion. After a complete run, the foreground window belonged to the official `ChatGPT.exe` process and there was still one main Codex process. Escape closed the animation after about 4.55 seconds from process start.
- The installed shortcut brought an already-running official Codex window to the foreground with one main `ChatGPT.exe` process. No animation helper remained.
- The actual taskbar replacement pin and fresh launch from a closed Codex app have not been verified.

## Other Personal AI OS views

The supplemental web views keep their independent `startup/animation.mjs`, `startup/animation.css`, `startup/start.mjs`, and `startup/config.json` integration. They do not participate in Codex Desktop launch. No third-party visual or audio asset is embedded in the Codex sequence; the tones are generated locally.
