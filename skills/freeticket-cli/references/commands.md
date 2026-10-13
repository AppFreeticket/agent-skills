# `ft` command reference

Detail for every command in the FreeTicket CLI. Most commands hit the **B2B v1**
contract (`FT_API_URL` + `/api/v1`) and are **tenant-scoped**: each request sees
one workspace, and an id from another workspace returns `404` (anti-IDOR). With
nothing pinned the CLI repeats list requests over every stored account and every
workspace each one reaches, and tags the rows with where they came from. The `ft admin …` commands are the exception — a separate, cross-tenant
contract (`/api/admin`) with its own auth (see the Admin section below).

## Auth and config

| Command | Description |
|---|---|
| `ft login` | Browser device flow: mints a session, validates it against `/me`, and **adds** it as an account in `~/.freeticket/config.json` (0600) named after its email. Other accounts stay. Pins no workspace. |
| `ft login --account <name>` | Same, stored under `<name>`; an existing account with that name is replaced. |
| `ft login --key ft_live_…` | CI/headless only: store a backend-issued token instead of the browser flow. |
| `ft login --workspace <id>` | Pin the new account to one workspace. |
| `ft whoami` | One account: its user, role and `workspaces[]`. Several: one row per account (account, email, name, workspaces); `--json` = array with `account` on each. |
| `ft config` | Effective config: `apiUrl`, `activeAccount`, and every stored account with its credential masked (`--json` for scripts). |
| `ft logout` | Removes the pinned account, or the only one. Several and none pinned → fails; use `--account <name>` or `--all`. |
| `ft account list` | Stored accounts (`*` = pinned): name, apiUrl, pinned workspace, masked session. Alias `ft accounts`. |
| `ft account use <name>` | Pin every command to one account. |
| `ft account clear` | Unpin: back to reading every account. |
| `ft account remove <name>` | Remove one stored account (= `ft logout --account <name>`). |
| `ft workspace list` | Workspaces every account in scope reaches (`account` column when several). |
| `ft workspace use <id\|slug>` | Pin one workspace (sent as `X-Workspace-Id`) and the account that reaches it. |
| `ft workspace clear` | Unpin workspaces (and the account): lists read everything again. |
| `ft workspace show` | Print the pinned (or default) workspace of the one account in scope. |

A config written by an older CLI (a single top-level `apiKey`) is read as the
account `default`. `FT_API_KEY` overrides every stored account and is the only
one in effect, so CI never fans out across logins on the machine.

**Fan-out rules.** With nothing pinned, lists and the row-shaped reports read
every account × every reachable workspace (a workspace shared by two accounts is
read once), tag rows `workspaceId`/`workspaceName` (+ `account` when several),
split `--limit` across all of them, and name a failing account/workspace on
stderr while the rest print. `--cursor` needs one workspace. Commands that are
not lists (get/create/update/delete, actions, `reports summary`, exports) need
exactly one account: with several stored and none pinned they fail with the
account names — pass `--account <name>`.

The credential acts as its owning user, **with that user's role**. A CI key is
never stored in plaintext on the backend (only its `sha-256`); prefix `ft_live_`.

## Roles

Hierarchy: `SUPER_ADMIN > ADMIN > STAFF > VIEWER`. Each endpoint requires a
minimum role; insufficient → `403`.

## Reads

| Command | Own flags | Role |
|---|---|---|
| `ft events list` | `--q <text>` (search) `--status DRAFT\|PUBLISHED\|SOLD_OUT\|CANCELLED\|COMPLETED` `--with-total` `--limit` `--cursor` | VIEWER |
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
| `ft staff list` | `--workspace-ids <ids>` (comma-separated, max 25 — one call, rows tagged by workspace) `--limit` `--cursor` | ADMIN |
| `ft settlements list` | `--event` `--status SENT\|AWAITING_PAYMENT\|PAID` `--limit` `--cursor` | ADMIN |
| `ft settlements document <id>` | `--proof <fileName>` (payment proof instead of the receipt) | ADMIN |
| `ft api-keys list` | `--limit` `--cursor` | VIEWER |
| `ft reports summary` | `--period 7d\|30d\|90d\|1y` | VIEWER |
| `ft reports financials` | `--event` `--past`, `--csv` \| `--json` | ADMIN |
| `ft reports by-event` | `--from` `--to` `--status` | VIEWER |
| `ft reports timeseries` | `--interval day\|week\|month` (req), `--from` `--to` `--event` | VIEWER |
| `ft reports inventory` | `--event-id` `--event-date-id` `--from` `--to` `--include-drafts` `--group-by ticketType\|date\|event` | VIEWER |
| `ft reports reconciliation` | `--from` `--to` (req), `--match` `--provider` `--page` `--page-size` | ADMIN |
| `ft reports export buyers` · `attendees` | `--event` `--event-date` `--from` `--to` `--status`, `--csv` \| `--json` | ADMIN |
| `ft reports export subscribers` | `--csv` \| `--json` | ADMIN |
| `ft reports export reconciliation` | `--from` `--to` (req), `--match` `--provider`, `--csv` \| `--json` | ADMIN |

`settlements` = what FreeTicket pays the organizer (authoritative, already
computed): `reference`, `status`, `amount`, `currency`, event/function,
`hasDocument`, `paymentProofs[].fileName`, `requestedAt`/`paidAt`. Download it
with `ft settlements document <id>`: it prints a **signed URL valid for 5
minutes**, not the file (the API answers 302 to private storage).

`reports financials` = one row per function with the full breakdown: `gross`,
`platformFee`, `facial`, `paymentFee`, `gmf` (4x1000), `net`, plus the linked
`settlementStatus`/`settlementId`/`settlementAmount`. Use it instead of
recomputing margins from `sales list` + payment-provider data — same numbers as
the Liquidaciones dashboard. `--past` narrows to functions that already happened
(the settleable ones).

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
| `ft sales cancel <id>` | `--data '{"acknowledge_open_payment":true}'` when the payment is still open at the gateway | ADMIN |
| `ft sales refund <id>` | `--data` optional (e.g. `{"amount": 20000}` for partial, `{"acknowledge_manual":true}` when the money goes back by hand) | ADMIN |
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

## Service credentials (`ft api-keys …`)

Headless credential for CI / cron — no browser, no device flow. The plaintext
(`ft_live_…`) is shown **once**, in the `create` response.

```bash
ft api-keys create "finance-sync" --scope read   # scope: read (default) | write
ft api-keys list
ft api-keys revoke <id> --yes
```

`read` allows GET/HEAD only; `write` enables mutations subject to the user's
role. Use it with `--key ft_live_…` or `FT_API_KEY`.

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
| `ft admin workspaces update <id>` | `--data` (also `webTemplate`, `customDomain`, `customDomainVerifiedAt`) | SUPER_ADMIN |
| `ft admin workspaces plan <id>` | `--data '{"planSlug":"spark\|star\|icon\|legend"}'` `--yes`; assisted sale, no Stripe self-service | SUPER_ADMIN |
| `ft admin workspaces suspend <id>` | `--yes` to skip confirm | SUPER_ADMIN |
| `ft admin workspaces restore <id>` | — | SUPER_ADMIN |
| `ft admin users update <id>` | `--data` | SUPER_ADMIN |
| `ft admin plans list` · `get <id>` · `create` · `update <id>` | `--data` (create/update) | SUPER_ADMIN |
| `ft admin feature-flags list` | — (no pagination) | SUPER_ADMIN |
| `ft admin feature-flags set <key>` | `--data` (`{"scope","scopeId?","enabled"}`) | SUPER_ADMIN |
| `ft admin audit-log list` | `--actor` `--action` `--from` `--to` `--limit` `--cursor` | SUPER_ADMIN |
| `ft admin impersonate` | `--data` (`{"targetUserId","workspaceId?"}`) | SUPER_ADMIN |
| `ft admin impersonate-stop` | — | SUPER_ADMIN |
| `ft admin tokens list` | — (no pagination) | SUPER_ADMIN |
| `ft admin tokens create` | `--data` (`{"name","expiresAt?"}`) — plaintext shown once | SUPER_ADMIN |
| `ft admin tokens revoke <id>` | `--yes` to skip confirm | SUPER_ADMIN |

Without an admin session (`ft admin login` or `FT_ADMIN_SESSION`) the command
fails fast with a clear message. A missing/expired session returns `401`; a
non-SUPER_ADMIN session returns `403`. Admin lists also accept `--csv`.

## Global flags

| Flag | Effect |
|---|---|
| `--json` | Raw JSON to stdout (parseable). On **lists = data array only**; use `--raw` for the paginated envelope. |
| `--raw` | On lists: the full `{ data, page }` envelope (`page.nextCursor`/`hasMore`) for scripted pagination. |
| `--workspace <orgId>` | Only this workspace (mirrors `X-Workspace-Id`). On lists across several accounts it routes to the account that reaches it. |
| `--account <name>` | Only this stored account. Required on non-list commands when several are stored and none is pinned. |
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
| `404` | Resource outside the active workspace | Check `--workspace` / `--account` / `ft whoami`. |
| `422` | Validation failed on a write | Read `details[]` (`path: message`) and fix `--data`. |

## Data conventions

- **Money:** integer in the resource currency (`currency`, usually `COP`). Don't
  assume decimals; use the `currency` field to format.
- **Dates:** ISO 8601 in **UTC**. An event's local time depends on its time zone
  (IANA `timezone` on the event date), not the raw UTC.
- **camelCase:** API DTOs are camelCase even though the DB is snake_case.
