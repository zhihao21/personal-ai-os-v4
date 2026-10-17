# Startup animation

## Codex Desktop

The standalone launcher in `startup/codex-launcher.mjs` opens a local Edge app window, plays the preview, then activates the installed Windows package `OpenAI.Codex_2p2nqsd0c76g0!App` through `shell:AppsFolder`. It never changes the installed app. `startup/Launch-Codex.vbs` starts the portable Node helper without a visible console and falls back to direct Codex activation if the helper is absent. `startup/Install-Shortcuts.ps1` creates **Codex Animated** and **Codex Direct** on the current user's desktop. Direct opens the official app without Node, Edge, or the animation. Both shortcuts have been installed on this machine.

Install again after moving the repository or changing the portable Node path:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\startup\Install-Shortcuts.ps1
```

For a browser-only preview, run `..\.tools\node-v24.20.0-win-x64\node.exe startup\codex-launcher.mjs --preview` from the repository root and open the printed loopback URL. This mode does not launch Codex. `--dry-run` exercises the normal timed sequence and launch request without activating Codex. The launcher calls Codex immediately if Edge cannot start or no completion request arrives within 30 seconds. The **Open Codex now** control and Escape/Skip bypass the remaining animation. If anything in the launcher fails, use **Codex Direct** or the ordinary Windows Start menu entry.

Edit `startup/codex-config.json` for brand text, subtitle, accent color, steps, speed, audio beep and skip. Speed is clamped to 0.35–3. Audio defaults off and browser autoplay policy may suppress it until the user interacts. The preview uses only local CSS and synthesized tones; it contains no third party media.

Rollback: delete the two desktop shortcuts and, if desired, remove the `startup` directory. The original Codex installation and shortcuts are unaffected.

## Personal AI OS V4.0

The supplemental web views `/` and `/dashboard` load the same independent module from `startup/start.mjs`. The configuration is `startup/config.json`: `enabled`, `mode` (`session`, `daily`, `always`), `brand`, `title`, `subtitle`, `accent` (six digit hex), `steps`, `speed`, `audio`, and `allowSkip`. Session mode stores the last play marker in browser session storage; daily mode uses local storage. Escape and the visible button skip when enabled. Reduced motion disables the moving rings and flash. Data requests continue independently while the overlay plays.

Preview: start the normal local server and open `/dashboard` in a new browser session; the animation appears before revealing the dashboard. Set `mode` to `always` to preview on each refresh. Rollback: set `enabled` to `false`; to remove the integration entirely, remove the added stylesheet/script tags from both web pages and the startup asset mappings from `server.mjs`. This does not touch the Obsidian vault, records, or core application logic. The production daily-use interface remains the existing Obsidian vault; this integration applies to the supplemental web interface.

## References and Codex background

The sequence is original code inspired by the pacing of [dsh-startup-screen](https://github.com/6shenhonghong9/dsh-startup-screen). That repository marks its original code MIT, but its README excludes third party audiovisual material from the grant, so no source code, logo, audio, or visual assets were copied. [Sonic Topography Wallpaper](https://github.com/hgbhh258-spec/Sonic-Topography-Wallpaper) is MIT and targets web wallpaper hosts. No code or assets from it are embedded here.

The [official desktop app settings documentation](https://learn.chatgpt.com/docs/reference/settings) documents base theme, accent, background and foreground **colors**, and fonts. The [desktop app overview](https://learn.chatgpt.com/docs/app) does not provide an animated background extension or theme API. The installed Codex package was inspected as an MSIX app. No supported path was found to place a live Sonic Topography scene behind Codex chats, so the app background was left alone. A reversible alternative is to keep the separate Sonic preview in a browser window beside Codex, or use the animation only during the launcher sequence. This preserves chat readability and avoids extra graphics work inside Codex.
