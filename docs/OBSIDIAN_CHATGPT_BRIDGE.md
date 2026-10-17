# ChatGPT to Obsidian write bridge

Status: **local bridge implemented and tested; ChatGPT connection pending** (2026-10-17). No ChatGPT-originated write has been observed. The production vault was not changed during bridge tests.

## Architecture

Obsidian Markdown remains canonical. `lib/obsidian-write-bridge.mjs` calls the existing daily journal and Emotional Aftereffect writers and a small life-event writer. It accepts only fixed journal, event and finding fields. Destination paths are constructed from validated dates or UUIDs inside the existing prototype's `Records` folders. It rejects unknown fields, invalid dates, unsafe symlinks, and arbitrary paths. Journal writes use the existing date lock and exactly one primary note per date; a submission UUID and payload hash make retries idempotent. Event filenames are deterministic from the UUID. New files are staged and hard-linked into place; updates use temporary files and rename. Every write is read back before success. Partial journal updates keep omitted fields and existing body text.

`tools/obsidian-write-bridge.mjs` is an optional local HTTP API. It binds only to `127.0.0.1`, requires a bearer token from a private regular file, rejects browser Origins and nonlocal Host headers, limits JSON bodies to 64 KiB, and returns `{ok,data}` or `{ok:false,error:{code,message}}`. Never publish this endpoint to the internet. The token and vault contents stay outside Git.

`tools/obsidian-bridge-mcp-stdio.mjs` is the preferred ChatGPT connection target. It exposes five narrow MCP tools over stdio with no local network listener: daily journal upsert/get/verify/list and life event creation. Emotional Aftereffect finding creation remains available only through the separately authenticated local HTTP bridge, not this ChatGPT tunnel. The OpenAI Secure MCP Tunnel authenticates the remote workspace and transports calls to this private process over outbound HTTPS. The MCP server itself trusts its stdio caller; run it **only** under the authenticated tunnel or a similarly trusted local client. Write-tool approval in ChatGPT remains enabled.

No extra Obsidian plugin or second personal database is needed. Existing Obsidian Sync handles device sync if enabled. The bridge does not generate risk findings or change the historical EA-NEG-001 record. It has no operation to change risk classifications or delayed observations; explicit findings retain separate facts, hypotheses, unknowns and follow-up. Desktop/Android cross-device invocation depends on the same ChatGPT plugin being available to that session and on the Windows machine/tunnel running.

## Local API

Set `OBSIDIAN_VAULT` to the existing vault and `OBSIDIAN_BRIDGE_TOKEN_FILE` to a private text file containing at least 32 random characters. Optionally set `OBSIDIAN_BRIDGE_PORT` (default `4311`). Start with Node 22+:

```powershell
$env:OBSIDIAN_VAULT = '<absolute path to existing Obsidian vault>'
$env:OBSIDIAN_BRIDGE_TOKEN_FILE = '<absolute path to private token file>'
node tools/obsidian-write-bridge.mjs
```

The local endpoints are `POST /v1/journals`, `POST /v1/journals/verify`, `GET /v1/journals/YYYY-MM-DD`, `GET /v1/journals?limit=10`, `POST /v1/events`, and `POST /v1/aftereffect/findings`. Pass `Authorization: Bearer <token>` and JSON for POST. `submission_id` should be a new UUID for each intended journal or event submission and reused on retry. Date is a valid `YYYY-MM-DD` Asia/Taipei calendar date; the client must choose the date in that zone. A journal payload can include `mood`, `state`, `emotional_tags`, `significant_events`, `thoughts`, `important_memories`, `future_plans`, and `followup`. An event needs `date`, `title`, `description`, and optionally an existing `source_journal_date`. A finding needs `date`, an existing `source_journal_date` and/or `source_event_id`, and at least one of `facts`, `hypotheses`, or `unknowns`; `followup` is optional.

## Connect ChatGPT privately

1. Sign in to [OpenAI Platform tunnel settings](https://platform.openai.com/settings/organization/tunnels) and create a tunnel associated with the target ChatGPT workspace. A Platform API key and Tunnels Read/Manage/Use permissions are needed. These are user-account settings; no key belongs in this repository.
2. Install the current [OpenAI tunnel-client](https://github.com/openai/tunnel-client/releases) on the Windows host. Configure a local stdio profile using the absolute Node executable and absolute path to `tools/obsidian-bridge-mcp-stdio.mjs` as `--mcp-command`; supply the tunnel ID and a Tunnels Read + Use runtime API key through the client's supported private setup. The current Windows setup uses a launcher outside Git under `%APPDATA%/tunnel-client` to set `OBSIDIAN_VAULT` and start Node; the profile references a separate private key file, not an inline secret. Run `tunnel-client doctor --profile personal-ai-os-obsidian --explain`, then `tunnel-client run --profile personal-ai-os-obsidian`. Keep it running while using ChatGPT. The tunnel-client binary's supported unattended authentication is a runtime API key; Platform browser sign-in alone does not authenticate the daemon.
3. In [ChatGPT Plugins](https://chatgpt.com/plugins), choose **Add custom MCP server → Tunnel**, select that tunnel, review authentication and write access, then create the plugin. Test from an authenticated ChatGPT desktop session with a synthetic journal date, read it back with the plugin, and inspect the exact Markdown file. Repeat from Android if the plugin is available there. Do not send personal answers until the synthetic end-to-end test succeeds.

The owner created a tunnel and the signed-in Platform page shows it. The local profile and launcher are configured. On 2026-10-17, an approved 30-day runtime key with only Tunnels Read + Use was placed in the private file outside Git; its value is never stored here. The daemon was started without the unrelated inherited `OPENAI_API_KEY`. `doctor` passed, `/healthz` and `/readyz` returned 200, tunnel metadata was fetched, and a successful control-plane poll was observed. The tunnel currently has no ChatGPT workspace association; the custom MCP form reported rate limiting and no plugin was created. ChatGPT-originated write/readback remains unverified. Do not treat local HTTP/MCP tests or tunnel readiness as a ChatGPT-originated write.

OpenAI's [Secure MCP Tunnel guide](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels) confirms stdio transport, outbound-only network access and workspace association. The [ChatGPT connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt) documents custom plugin setup and testing. Android availability for this custom plugin remains unverified.

## Verification and limits

`node --test test/obsidian-write-bridge.test.mjs test/obsidian-journal-entry.test.mjs` passes synthetic journal create/read/retry/update, event retry, finding source link, path rejection, HTTP bearer and Origin checks, and MCP initialize/tool calls. Tests use a temporary vault and never copy real records. The bridge has no background service installation; the tunnel and local process must be running. Obsidian Sync propagation and mobile invocation still need live verification. Concurrent writes through bridge calls are serialized in process and writer lock files protect same-file writes across processes; an existing external edit during update is detected before rename, though there is a small external-edit race between that check and rename.
