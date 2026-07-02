# `ft` command reference

Detail for every command in the FreeTicket CLI. Most commands hit the **B2B v1**
contract (`FT_API_URL` + `/api/v1`) and are **tenant-scoped**: you only see
resources of the active workspace; an id from another workspace returns `404`
(anti-IDOR). The `ft admin …` commands are the exception — a separate, cross-tenant
contract (`/api/admin`) with its own auth (see the Admin section below).

## Auth and config

| Command | Description |
|---|---|
| `ft login` | Browser device flow: mints a session, stores it in `~/.freeticket/config.json` (0600), validates against `/me`. |
| `ft login --key ft_live_…` | CI/headless only: store a backend-issued token instead of the browser flow. |
| `ft whoami` | Prints the session's owning user, their role and accessible `workspaces[]`. |
| `ft config` | Shows the effective config with the credential masked (`--json` for scripts). |
| `ft logout` | Logs out — removes the stored session from the config file. |
| `ft workspace list` | Workspaces the session can access. |
| `ft workspace use <id>` | Persist the active workspace (sent as `X-Workspace-Id`). |
| `ft workspace show` | Print the active workspace. |

The credential acts as its owning user, **with that user's role**. A CI key is
never stored in plaintext on the backend (only its `sha-256`); prefix `ft_live_`.

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
| `ft sales list` | `--status` `--channel` `--event` `--event-date` `--reference` `--buyer` `--from` `--to` `--limit` `--cursor` | STAFF |
| `ft sales get <id>` | — | STAFF |
| `ft sales tickets <id>` | — (individual tickets/attendees of a sale) | STAFF |
| `ft tickets access <code>` | — (access status; does not admit) | STAFF |
| `ft plans list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft plans subscribers <id>` | — (subscribers/members of a plan) | VIEWER |
| `ft discounts list` | `--event` `--active true\|false` `--limit` `--cursor` | ADMIN |
| `ft webhooks list` | `--limit` `--cursor` | ADMIN |
| `ft venues list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft staff list` | `--limit` `--cursor` | ADMIN |
| `ft reports summary` | `--period 7d\|30d\|90d\|1y` | VIEWER |
| `ft reports by-event` | `--from` `--to` `--status` | VIEWER |
| `ft reports timeseries` | `--interval day\|week\|month` (req), `--from` `--to` `--event` | VIEWER |
| `ft reports inventory` | `--event-id` `--event-date-id` `--from` `--to` `--include-drafts` `--group-by ticketType\|date\|event` | VIEWER |
| `ft reports reconciliation` | `--from` `--to` (req), `--match` `--provider` `--page` `--page-size` | ADMIN |
| `ft reports export buyers` · `attendees` | `--event` `--event-date` `--from` `--to` `--status`, `--csv` \| `--json` | ADMIN |
| `ft reports export subscribers` | `--csv` \| `--json` | ADMIN |
| `ft reports export reconciliation` | `--from` `--to` (req), `--match` `--provider`, `--csv` \| `--json` | ADMIN |

`reconciliation` `--match` / `match_status` enum: `OK` · `MISSING_INVOICE`
(payment without invoice) · `MISSING_CUFE` (invoice without DIAN stamp) ·
`AMOUNT_MISMATCH` (MP amount ≠ sale) · `MISSING_PAYMENT`.

Any list also accepts `--csv` (CSV on stdout, columns = the table columns).

## Writes

Mutations take a JSON body via `--data` (inline `'{"k":1}'` or `@file.json`).
`delete` confirms interactively unless `--yes` (and auto-aborts when stdin isn't
a TTY, so it's safe in pipelines). The body shape is the request schema of the
matching endpoint in the OpenAPI contract — when unsure, check the spec, don't guess.

| Command | Args / body | Role |
|---|---|---|
| `ft events create` | `--data` (event create schema) | ADMIN |
| `ft events update <id>` | `--data` (partial) | ADMIN |
| `ft events delete <id>` | `--yes` to skip confirm | ADMIN |
| `ft events publish <id>` | — | ADMIN |
| `ft event-dates list <eventId>` | — | VIEWER |
| `ft event-dates create <eventId>` | `--data` | ADMIN |
| `ft event-dates update <eventId> <dateId>` | `--data` | ADMIN |
| `ft event-dates delete <eventId> <dateId>` | `--yes` | ADMIN |
| `ft ticket-types create\|update <id>\|delete <id>` | `--data` (create/update) | ADMIN |
| `ft plans create\|update <id>\|delete <id>` | `--data` (create/update) | ADMIN |
| `ft venues create\|update <id>\|delete <id>` | `--data` (create/update) | ADMIN |
| `ft sales create` | `--data` (`{buyer:{name,email,phone?}, items:[{ticketTypeId,quantity}], channel?, comp?, notes?}`) | ADMIN |
| `ft sales cancel <id>` | — | ADMIN |
| `ft sales refund <id>` | `--data` optional (e.g. `{"amount": 20000}` for partial) | ADMIN |
| `ft tickets checkin <code>` | — (idempotent; re-running never double-admits) | STAFF |
| `ft tickets resend <code>` | — (resends the sale's confirmation email/QR) | ADMIN |
| `ft subscriptions cancel <id>` | — (idempotent; keeps the original cancel date) | ADMIN |
| `ft discounts create` | `--data` (`{code, type PERCENT\|FIXED, value, eventId?, maxUses?, startsAt?, endsAt?}`) | ADMIN |
| `ft discounts update <id>` | `--data` (`{active?, value?, maxUses?, startsAt?, endsAt?}`) | ADMIN |
| `ft discounts delete <id>` | `--yes` to skip confirm | ADMIN |
| `ft webhooks create` | `--data` (`{url, events[], secret?}`) — returns `signingSecret` once | ADMIN |
| `ft webhooks delete <id>` | `--yes` to skip confirm | ADMIN |
| `ft staff create` | `--data` (`{"email","role"}`) | ADMIN |
| `ft staff set-role <id>` | `--data` (`{"role"}`) | ADMIN |

## Admin (`ft admin …`) — separate contract `/api/admin`

A **second contract**, not `/api/v1`. It is **cross-tenant** (not workspace-scoped)
and uses a different auth: a **SUPER_ADMIN better-auth session**, not an API key.
Save it once with `ft admin login` (MVP — a revocable service token replaces
this, see free-admin#157):

```bash
# copy the `better-auth.session_token` cookie from an authenticated admin browser session
ft admin login --session <better-auth.session_token>   # validates vs /api/admin/me, stores 0600
```

`FT_ADMIN_SESSION` still works for CI/headless.

| Command | Own flags | Role |
|---|---|---|
| `ft admin login` · `logout` · `config` | `login --session <token>` (validated); `config` shows it masked | SUPER_ADMIN |
| `ft admin me` | — | SUPER_ADMIN |
| `ft admin workspaces list` | `--status` `--q` `--limit` `--cursor` | SUPER_ADMIN |
| `ft admin workspaces get <id>` | — | SUPER_ADMIN |
| `ft admin users list` | `--q` `--role` `--workspace` `--limit` `--cursor` | SUPER_ADMIN |
| `ft admin users get <id>` | — | SUPER_ADMIN |
| `ft admin workspaces create` | `--data` | SUPER_ADMIN |
| `ft admin workspaces update <id>` | `--data` | SUPER_ADMIN |
| `ft admin workspaces suspend <id>` | `--yes` to skip confirm | SUPER_ADMIN |
| `ft admin workspaces restore <id>` | — | SUPER_ADMIN |
| `ft admin users update <id>` | `--data` | SUPER_ADMIN |
| `ft admin plans list` · `get <id>` · `create` · `update <id>` | `--data` (create/update) | SUPER_ADMIN |
| `ft admin feature-flags list` | — (no pagination) | SUPER_ADMIN |
| `ft admin feature-flags set <key>` | `--data` (`{"scope","scopeId?","enabled"}`) | SUPER_ADMIN |
| `ft admin audit-log list` | `--actor` `--action` `--from` `--to` `--limit` `--cursor` | SUPER_ADMIN |
| `ft admin impersonate` | `--data` (`{"targetUserId","workspaceId?"}`) | SUPER_ADMIN |
| `ft admin impersonate-stop` | — | SUPER_ADMIN |

Without an admin session (`ft admin login` or `FT_ADMIN_SESSION`) the command
fails fast with a clear message. A missing/expired session returns `401`; a
non-SUPER_ADMIN session returns `403`. Admin lists also accept `--csv`.

## Global flags

| Flag | Effect |
|---|---|
| `--json` | Raw JSON to stdout (parseable). On **lists = data array only**; use `--raw` for the paginated envelope. |
| `--raw` | On lists: the full `{ data, page }` envelope (`page.nextCursor`/`hasMore`) for scripted pagination. |
| `--workspace <orgId>` | Run the command against another accessible workspace (mirrors `X-Workspace-Id`). |
| `--limit <n>` | Page size on lists, 1–100 (default 20). |
| `--cursor <id>` | Next page; the value comes from the `page.nextCursor` hint. `--all` auto-paginates. |

## Pagination

Lists return `{ data: [...], page: { nextCursor } }`. `--json` prints just the
`data` array; use **`--raw`** to read `page.nextCursor` from stdout (or `--all`
to fetch every page automatically):

```bash
first=$(ft sales list --raw --limit 100)
cursor=$(echo "$first" | jq -r '.page.nextCursor // empty')
[ -n "$cursor" ] && ft sales list --raw --limit 100 --cursor "$cursor"
```

## Errors

Uniform shape and exit code `1`:

```json
{ "error": { "code": "FORBIDDEN", "message": "...", "details": {} } }
```

| HTTP | Meaning | Action |
|---|---|---|
| `401` | Session missing/invalid/expired | Run `ft login` again (CI: refresh the token). |
| `403` | Insufficient role for the endpoint | Log in as a higher-role user. |
| `404` | Resource outside the active workspace | Check `--workspace` / `ft whoami`. |
| `422` | Validation failed on a write | Read `details[]` (`path: message`) and fix `--data`. |

## Data conventions

- **Money:** integer in the resource currency (`currency`, usually `COP`). Don't
  assume decimals; use the `currency` field to format.
- **Dates:** ISO 8601 in **UTC**. An event's local time depends on its time zone
  (IANA `timezone` on the event date), not the raw UTC.
- **camelCase:** API DTOs are camelCase even though the DB is snake_case.
