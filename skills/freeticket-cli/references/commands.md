# `ft` command reference

Detail for every command in the FreeTicket CLI. The API base is `FT_API_URL` +
`/api/v1`. Everything is **tenant-scoped**: you only see resources of the active
workspace; an id from another workspace returns `404` (anti-IDOR).

## Auth and config

| Command | Description |
|---|---|
| `ft login --key ft_live_…` | Stores the key in `~/.freeticket/config.json` (0600) and validates it against `/me`. |
| `ft whoami` | Prints the key's owning user, their role and accessible `workspaces[]`. |
| `ft config` | Shows the effective config with the key masked. |
| `ft logout` | Removes the key from the config file. |

The key acts as its owning user, **with that user's role**. It is never stored in
plaintext on the backend (only its `sha-256`); the visible prefix is `ft_live_`.

## Roles

Hierarchy: `SUPER_ADMIN > ADMIN > STAFF > VIEWER`. Each endpoint requires a
minimum role; insufficient → `403`.

## Reads

| Command | Own flags | Role |
|---|---|---|
| `ft events list` | `--limit` `--cursor` | VIEWER |
| `ft events get <id>` | — | VIEWER |
| `ft ticket-types list` | `--event-date-id <id>` `--limit` `--cursor` | VIEWER |
| `ft ticket-types get <id>` | — | VIEWER |
| `ft sales list` | `--status PENDING\|CONFIRMED\|CANCELLED\|REFUNDED\|ABANDONED` `--channel WEB\|MOBILE\|POS\|ADMIN` `--event <id>` `--event-date <id>` `--reference <ref>` `--buyer <q>` `--from <iso>` `--to <iso>` `--limit` `--cursor` | STAFF |
| `ft sales get <id>` | — | STAFF |
| `ft plans list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft venues list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft staff list` | `--limit` `--cursor` | ADMIN |
| `ft reports summary` | `--period 7d\|30d\|90d\|1y` | VIEWER |
| `ft reports inventory` | `--event <id>` `--event-date <id>` `--from <iso>` `--to <iso>` `--include-drafts` `--group-by ticketType\|date\|event` | VIEWER |
| `ft reports export buyers` | one row per sale · `--status` `--event <id>` `--event-date <id>` `--from <iso>` `--to <iso>` `--json` | ADMIN |
| `ft reports export attendees` | one row per ticket · same filters as `buyers` | ADMIN |
| `ft reports export subscribers` | `--json` (recommended) | ADMIN |

## Global flags

| Flag | Effect |
|---|---|
| `--json` | Raw JSON output to stdout (parseable). Without it, human-readable output. |
| `--workspace <orgId>` | Run the command against another accessible workspace (mirrors `X-Workspace-Id`). |
| `--limit <n>` | Page size on lists, 1–100 (default 20). |
| `--cursor <id>` | Next page; the value comes from the `page.nextCursor` hint. |

## Pagination

Lists return `{ data: [...], page: { nextCursor } }`. If `nextCursor` is not null
there are more results:

```bash
first=$(ft sales list --json --limit 100)
cursor=$(echo "$first" | jq -r '.page.nextCursor // empty')
[ -n "$cursor" ] && ft sales list --json --limit 100 --cursor "$cursor"
```

## Errors

Uniform shape and exit code `1`:

```json
{ "error": { "code": "FORBIDDEN", "message": "...", "details": {} } }
```

| HTTP | Meaning | Action |
|---|---|---|
| `401` | Key missing/invalid/revoked | Re-issue the key and `ft login` again. |
| `403` | Insufficient role for the endpoint | Use a key from a higher-role user. |
| `404` | Resource outside the active workspace | Check `--workspace` / `ft whoami`. |
| `501` | Write not implemented (phase 2) | Mutations are not available yet. |

## Data conventions

- **Money:** integer in the resource currency (`currency`, usually `COP`). Don't
  assume decimals; use the `currency` field to format.
- **Dates:** ISO 8601 in **UTC**. An event's local time depends on its time zone
  (IANA `timezone` on the event date), not the raw UTC.
- **camelCase:** API DTOs are camelCase even though the DB is snake_case.
