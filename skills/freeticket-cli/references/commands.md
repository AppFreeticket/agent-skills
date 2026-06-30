# `ft` command reference

Detail for every command in the FreeTicket CLI. Most commands hit the **B2B v1**
contract (`FT_API_URL` + `/api/v1`) and are **tenant-scoped**: you only see
resources of the active workspace; an id from another workspace returns `404`
(anti-IDOR). The `ft admin …` commands are the exception — a separate, cross-tenant
contract (`/api/admin`) with its own auth (see the Admin section below).

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
| `ft sales list` | `--status PENDING\|CONFIRMED\|CANCELLED\|REFUNDED\|ABANDONED` `--limit` `--cursor` | STAFF |
| `ft sales get <id>` | — | STAFF |
| `ft plans list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft venues list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft staff list` | `--limit` `--cursor` | ADMIN |
| `ft reports summary` | `--period 7d\|30d\|90d\|1y` | VIEWER |
| `ft reports reconciliation` | `--from` `--to` (req), `--match` `--provider` `--page` `--page-size` | ADMIN |
| `ft reports export buyers` | `--json` (recommended) | ADMIN |
| `ft reports export subscribers` | `--json` (recommended) | ADMIN |
| `ft reports export reconciliation` | `--from` `--to` (req), `--match` `--provider` → CSV | ADMIN |

`reconciliation` `--match` / `match_status` enum: `OK` · `MISSING_INVOICE` (pago
sin factura) · `MISSING_CUFE` (factura sin timbre DIAN) · `AMOUNT_MISMATCH`
(monto MP ≠ venta) · `MISSING_PAYMENT`.

## Admin (`ft admin …`) — separate contract `/api/admin`

A **second contract**, not `/api/v1`. It is **cross-tenant** (not workspace-scoped)
and uses a different auth: a **SUPER_ADMIN better-auth session**, not an API key.
Set it before any `ft admin` command (MVP — a revocable service token replaces
this, see free-admin#157):

```bash
export FT_ADMIN_SESSION=<better-auth.session_token cookie of a SUPER_ADMIN>
```

| Command | Own flags | Role |
|---|---|---|
| `ft admin me` | — | SUPER_ADMIN |
| `ft admin workspaces list` | `--status` `--q` `--limit` `--cursor` | SUPER_ADMIN |
| `ft admin workspaces get <id>` | — | SUPER_ADMIN |
| `ft admin users list` | `--q` `--role` `--workspace` `--limit` `--cursor` | SUPER_ADMIN |
| `ft admin users get <id>` | — | SUPER_ADMIN |
| `ft admin plans list` · `get <id>` | `--limit` `--cursor` | SUPER_ADMIN |
| `ft admin feature-flags list` | — (no pagination) | SUPER_ADMIN |
| `ft admin audit-log list` | `--actor` `--action` `--from` `--to` `--limit` `--cursor` | SUPER_ADMIN |

Read-only first pass. Writes (workspaces suspend/restore/patch, platform-plans
create/patch, feature-flags put, impersonate) are not exposed yet. Without
`FT_ADMIN_SESSION` the command fails fast with a clear message. A missing/expired
session returns `401`; a non-SUPER_ADMIN session returns `403`.

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
