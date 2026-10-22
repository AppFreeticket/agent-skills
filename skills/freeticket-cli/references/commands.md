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
| `ft signup --email <e> --name <n>` | Public, no stored account needed: creates the account and sends a verification email (which also sets the password); then `ft login`. `--workspace-name <n>` also creates the first workspace on the free Spark plan. Same `202` for an existing email. |
| `ft login` | Browser device flow: mints a session, validates it against `/me`, and **adds** it as an account in `~/.freeticket/config.json` (0600) named after its email. Other accounts stay; a stored account of the same user (or a lone legacy `default`) is replaced, so re-logging in after a `401` never duplicates. Pins no workspace. |
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
| `ft workspace create --name <n> --slug <s>` | Create your own workspace; the caller becomes its ADMIN. Goes into the caller's organization (plan quota: spark 1, star 3, icon 7) or a new one on Spark. Staff of another tenant get `409 ALREADY_HAS_ACCESS`. `--account` when several are stored. |

A config written by an older CLI (a single top-level `apiKey`) is read as the
account `default`. `FT_API_KEY` overrides every stored account and is the only
one in effect, so CI never fans out across logins on the machine; it keeps the
file's pinned workspace (`FT_WORKSPACE_ID` wins) and fails on `--account`.
When every account fails to answer, the command exits 1 naming each error.

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
| `ft sales tickets <id>` | — (individual tickets/attendees of a sale; their `id` is what `refund --data '{"items":[…]}'` takes) | STAFF |
| `ft sales attempts <id>` | — (payment attempt history, newest first: declines, approvals, refunds) | STAFF |
| `ft tickets access <code>` | — (access status; does not admit) | STAFF |
| `ft plans list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft plans subscribers <id>` | — (subscribers/members of a plan) | VIEWER |
| `ft discounts list` | `--event` `--active true\|false` `--limit` `--cursor` | ADMIN |
| `ft webhooks list` | `--limit` `--cursor` | ADMIN |
| `ft venues list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft staff get <id>` | — | ADMIN |
| `ft staff list` | `--workspace-ids <ids>` (comma-separated, max 25 — one call, rows tagged by workspace) `--limit` `--cursor` | ADMIN |
| `ft settlements list` | `--event` `--status SENT\|AWAITING_PAYMENT\|PAID` `--limit` `--cursor` | ADMIN |
| `ft settlements get <id>` | — | ADMIN |
| `ft settlements document <id>` | `--proof <fileName>` (payment proof instead of the receipt) | ADMIN |
| `ft content-videos list` · `content-posts list` · `content-lives list\|get <id>` | `--limit` `--cursor` | ADMIN |
| `ft content-lives playback-token` | `--data` (signed playback token: 30 min live / 1 h video). Needs an enterprise service API key; `memberOnly` content also needs a buyer session | service key |
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
Destructive commands (`delete`, `events cancel`, `staff delete`, `api-keys revoke`)
confirm interactively unless `--yes` (and exit 1 when stdin isn't a TTY, so
they're safe in pipelines). The body shape is the request schema of the
matching endpoint in the OpenAPI contract — when unsure, check the spec, don't guess.

| Command | Args / body | Role |
|---|---|---|
| `ft events create` | `--data` (event create schema) | ADMIN |
| `ft events update <id>` | `--data` (partial) | ADMIN |
| `ft events delete <id>` | `--yes` to skip confirm | ADMIN |
| `ft events publish <id>` | — | ADMIN |
| `ft events cancel <id>` | `--yes` to skip confirm. Every date goes CANCELLED and the waiting room turns off; sales and tickets are kept, nothing is refunded | ADMIN |
| `ft event-dates list <eventId>` | — | VIEWER |
| `ft event-dates create <eventId>` | `--data` | ADMIN |
| `ft event-dates update <eventId> <dateId>` | `--data` | ADMIN |
| `ft event-dates delete <eventId> <dateId>` | `--yes` | ADMIN |
| `ft ticket-types create\|update <id>\|delete <id>` | `--data` (create/update) | ADMIN |
| `ft plans create\|update <id>\|delete <id>` | `--data` (create/update) | ADMIN |
| `ft venues create\|update <id>\|delete <id>` | `--data` (create/update) | ADMIN |
| `ft sales create` | `--data` (`{buyer:{name,email,phone?}, items:[{ticketTypeId,quantity}], channel?, comp?, notes?}`) | ADMIN |
| `ft sales cancel <id>` | `--data '{"acknowledge_open_payment":true}'` when the payment is still open at the gateway | ADMIN |
| `ft sales refund <id>` | `--data` optional: `{"items":["…"]}` refunds only those tickets (prorated; MercadoPago or cash only, `409 GATEWAY_REFUND_NOT_SUPPORTED` otherwise), `{"block_seats":true}` keeps refunded numbered seats off sale, `{"acknowledge_manual":true}` when the money goes back by hand. Checked-in tickets answer `409 ITEM_ALREADY_CHECKED_IN`, even on a full refund; `503 GATEWAY_REFUND_PENDING` is safe to repeat | ADMIN |
| `ft tickets checkin <code>` | — (idempotent; re-running never double-admits) | STAFF |
| `ft tickets resend <code>` | — (resends the sale's confirmation email/QR) | ADMIN |
| `ft tickets reassign <code>` | `--data` (`{eventDateId?, ticketTypeId?, seatLabel?}`); with only `eventDateId` the type is matched by name on the new date (`422` if ambiguous: pass `ticketTypeId`). No price difference charged or refunded | ADMIN |
| `ft subscriptions cancel <id>` | — (idempotent; keeps the original cancel date) | ADMIN |
| `ft discounts create` | `--data` (`{code, type PERCENT\|FIXED, value, eventId?, maxUses?, startsAt?, endsAt?}`) | ADMIN |
| `ft discounts update <id>` | `--data` (`{active?, value?, maxUses?, startsAt?, endsAt?}`) | ADMIN |
| `ft discounts delete <id>` | `--yes` to skip confirm | ADMIN |
| `ft webhooks create` | `--data` (`{url, events[], secret?}`) — returns `signingSecret` once | ADMIN |
| `ft webhooks update <id>` | `--data` (`{url?, events?, active?}`) — keeps the `signingSecret` (delete + create would rotate it) | ADMIN |
| `ft webhooks delete <id>` | `--yes` to skip confirm | ADMIN |
| `ft staff create` | `--data` (`{"email","role"}`) | ADMIN |
| `ft staff set-role <id>` | `--data` (`{"role"}`) | ADMIN |
| `ft staff delete <id>` | `--yes` to skip confirm. Revokes access to this workspace only; an ADMIN cannot revoke another admin (`403`) or itself (`409`) | ADMIN |
| `ft content-posts create` | `--data` (`{type TEXT\|IMAGE\|ARTICLE, locked, title?, body?, content?, imageUrl?, eventId?, …}`); ARTICLE needs `title` + Markdown `body` | ADMIN |

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
| `ft admin workspaces plan-show <id>` | — (current plan + subscription; `stripeLinked`) | SUPER_ADMIN |
| `ft admin workspaces delete <id>` | `--yes` to skip confirm. Soft delete: must be suspended first, `409` with a CONFIRMED sale; does not cancel Stripe | SUPER_ADMIN |
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
| `ft admin crm campaigns` · `batches` · `events` · `options` · `quota` · `preview` · `launch` | Master CRM, see [below](#ft-admin-crm--master-crm-contract-admin-170). Writes send real messages | SUPER_ADMIN |

Without an admin session (`ft admin login` or `FT_ADMIN_SESSION`) the command
fails fast with a clear message. A missing/expired session returns `401`; a
non-SUPER_ADMIN session returns `403`. Admin lists also accept `--csv`.

### `ft admin crm` — master CRM (contract admin 1.7.0)

Email and WhatsApp campaigns to buyers **across every workspace**, against
`/api/admin/crm`. **SUPER_ADMIN only**: it takes `FT_ADMIN_TOKEN` (a platform
service token from `ft admin tokens create`, sent as `Authorization: Bearer`,
takes precedence over the session) or `ft admin login --session` /
`FT_ADMIN_SESSION`.

```bash
ft admin crm campaigns list [--channel EMAIL|WHATSAPP] [--status S] [--limit N]
ft admin crm campaigns get <id>
ft admin crm campaigns cancel <id> [--yes]
ft admin crm batches next <id> [--ignore-window] [--yes]
ft admin crm batches stop <id> [--yes]
ft admin crm events search <query> [--purpose scope|promote|except] [--sender <workspaceId>]
ft admin crm events dates <eventId...>
ft admin crm options
ft admin crm quota
ft admin crm preview --filter @filter.json [--sender freeticket|<workspaceId>]
ft admin crm launch --data @campaign.json [--ignore-window] [--yes]
```

| Command | Own flags | Effect |
|---|---|---|
| `campaigns list` · `get <id>` | `--channel` `--status` `--limit` | Read |
| `campaigns cancel <id>` | `--yes` | **Write** — cancels a scheduled/batched campaign |
| `batches next <id>` · `stop <id>` | `--ignore-window` (`next` only) `--yes` | **Write** — sends the next batch now · stops the remaining ones |
| `events search <query>` · `events dates <eventId...>` | `--purpose` `--sender` | Read — ids for a filter (`promote` = published shows only) |
| `options` | — | Read — cities, genre/format codes, membership plans, WhatsApp templates |
| `quota` | — | Read — daily WhatsApp quota and batches already committed |
| `preview` | `--filter @f.json` `--sender` | Read — audience counts per channel, masked sample, who can sign, estimated days at the quota. Sends nothing |
| `launch` | `--data @c.json` `--ignore-window` `--yes` | **Write** — creates and sends/schedules the campaign |

> **Writes send real messages to real people.** `launch`, `campaigns cancel`,
> `batches next` and `batches stop` first show what they are about to touch
> (`launch` runs the audience preview with the same filter and sender) and
> then **ask for confirmation**. Without a TTY they refuse unless you pass
> `--yes`. Always run `preview` and show the human the totals before a
> `launch`. The CLI never retries a write: if a `launch` times out, check
> `campaigns list` first — the backend rejects the same channel + sender +
> subject within 10 minutes with `DUPLICATE_CAMPAIGN` and prints the existing id.

**Send window.** WhatsApp only goes out **9:00-20:00 Bogotá**. Scheduled and
batched times are moved into the window (the response's `scheduledAt` is the
real one); an immediate send outside it fails with `OUTSIDE_SEND_WINDOW`, which
prints when the window opens. `--ignore-window` (or `ignoreSendWindow` in the
body) overrides it only on `batches next` and on a WhatsApp `launch` with
`timing.mode` `now` — use it only when the human explicitly asks.

Other named errors: `QUOTA_EXHAUSTED` (prints when the quota frees up),
`INVALID_STATE` (the campaign no longer allows that action), `422` (lists each
`details[].path`), `413 PAYLOAD_TOO_LARGE` (body over 256 KB).

`filter.json` (audience filter v2):

```json
{
  "version": 2,
  "scope": { "level": "platform" },
  "include": [
    { "type": "purchased", "eventIds": ["evt_123"], "window": { "kind": "last_days", "days": 90 } }
  ],
  "except": [
    { "type": "received_campaign", "days": 7, "channel": "any" }
  ]
}
```

- `scope` (default `platform`): `{ "level": "orgs", "workspaceIds": [...] }` or
  `{ "level": "events", "eventIds": [...] }`.
- `include` combines with AND, `except` with OR (evaluated platform-wide). Up to
  12 conditions per block, 50 ids per list.
- Condition types: `purchased`, `abandoned`, `checked_in` (optional `eventIds`,
  `dateIds` + `dateEventIds`, `window`), `city` (`cities`), `facet`
  (`dimension`: `genre` | `format`, `codes`), `membership` (`state`: `active` |
  `expiring` | `cancelled`, `withinDays`, `planIds`), `spend` (`minCop`,
  `maxCop`), `received_campaign` (`except` only), `people` (`include` only:
  `emails`).
- `window`: `{ "kind": "any" }` (default), `{ "kind": "last_days", "days": 7|30|90 }`
  or `{ "kind": "range", "from": "2026-09-01", "to": "2026-09-30" }` (Bogotá dates).
- Without a state condition (`purchased`, `abandoned`, `checked_in`,
  `membership`, `people`) in `include`, the audience defaults to confirmed
  buyers plus active members.

`campaign.json`:

```json
{
  "channel": "WHATSAPP",
  "sender": { "kind": "freeticket" },
  "templateName": "promo_show",
  "subject": "New date in Medellín",
  "body": "We just opened a second show. Get your tickets before they are gone.",
  "promotedEventId": "evt_123",
  "filter": { "version": 2, "include": [{ "type": "purchased", "eventIds": ["evt_123"] }], "except": [] },
  "timing": { "mode": "batches", "firstAt": "2026-11-03T10:00:00-05:00", "batchSize": 50, "perDay": 3, "intervalMinutes": 120 }
}
```

- `sender`: `{ "kind": "freeticket" }` or `{ "kind": "organization", "workspaceId": "..." }`.
  FreeTicket is mandatory when the scope spans the platform, several
  organizations or events of more than one owner (`preview` tells you).
- WhatsApp needs an approved `templateName` (see `options`); email rejects one.
  A WhatsApp `imageUrl` must come from the media library.
- `timing`: `{ "mode": "now" }`, `{ "mode": "scheduled", "at": "<ISO with offset>" }`
  or `batches` (WhatsApp only; daily cap 150 when FreeTicket signs, 200 for an
  organization).

The MCP server exposes only the CRM **reads** (`admin_crm_*`); launching,
batches and cancelling are CLI-only (or the admin panel).

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
| `401` | Session missing/invalid/expired | Run `ft login` again — it replaces that account, no duplicate (CI: refresh the token). |
| `403` | Insufficient role for the endpoint | Log in as a higher-role user. |
| `404` | Resource outside the active workspace | Check `--workspace` / `--account` / `ft whoami`. |
| `409` | Conflicts with current state | Read `error.code` (e.g. `ITEM_ALREADY_CHECKED_IN`, `REFUND_IN_PROGRESS`, `ALREADY_HAS_ACCESS`). |
| `422` | Validation failed on a write | Read `details[]` (`path: message`) and fix `--data`. |
| `429` | Rate limited (`signup`, `staff create`, …) | Wait and retry; don't loop. |

## Data conventions

- **Money:** integer in the resource currency (`currency`, usually `COP`). Don't
  assume decimals; use the `currency` field to format.
- **Dates:** ISO 8601 in **UTC**. An event's local time depends on its time zone
  (IANA `timezone` on the event date), not the raw UTC.
- **camelCase:** API DTOs are camelCase even though the DB is snake_case.
