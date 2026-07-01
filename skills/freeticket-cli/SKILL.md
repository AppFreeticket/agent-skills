---
name: freeticket-cli
description: Drive the official FreeTicket CLI (binary `ft`, npm `@freeticket/cli`) to operate a workspace from the terminal — log in through the browser (device flow), list/inspect AND create/update/delete events, dates, ticket types, sales, membership plans, venues, staff, discount codes and webhooks; publish events; create/cancel/refund sales; check tickets in at the door and resend QRs; list a sale's tickets, a plan's subscribers, cancel subscriptions; run reports (summary, by-event, timeseries, inventory, CFO reconciliation); and export buyers/attendees/subscribers to CSV. Superadmin (`ft admin …`) manages tenants, users, platform plans, feature flags and impersonation. Use it when the user wants to read OR mutate their FreeTicket account from the terminal, run `ft <command>`, automate with `--json`/`jq` or `--csv`, configure the API key/workspace, send feedback/suggestions (filed as GitHub issues on the right repo), or when another skill needs live data or actions on the B2B v1 backend.
---

# FreeTicket CLI (`ft`)

`ft` is FreeTicket's terminal client. It consumes the **B2B REST API v1** and is
generated from its OpenAPI 3.1 contract, so every endpoint exists as a command.
**Reads and writes both work**: every resource has `list`/`get` plus
`create`/`update`/`delete` and resource actions (`events publish`,
`sales cancel`/`refund`, `staff set-role`), and every list takes `--csv`. The CLI
mirrors what the web app does — anything you can do on the page, you can do here.

## When to use this skill

- The user wants real data: "how many sales do I have?", "list my events", "export buyers".
- The user wants to **change** something: "create an event", "publish it", "refund sale X", "raise a ticket-type price", "suspend a tenant".
- You need to run `ft ...` or automate a report/mutation for `jq`/scripts.
- Configure/rotate the API key or switch workspace.
- Another skill (e.g. `freeticket-eventos`) needs live data to audit or an action to perform.

## Setup (once)

```bash
# No install needed (Node >= 20). Always pin @latest so you never hit a stale
# npx cache or an old global build:
npx @freeticket/cli@latest login       # browser device flow: prints a code,
                                       # opens the browser, you approve, done.
                                       # CI/automation: … login --key ft_live_xxxxx
npx @freeticket/cli@latest whoami      # user + accessible workspaces

# Optional global install for a short `ft` alias:
npm install -g @freeticket/cli@latest && ft whoami
```

> Throughout this skill, **`ft <command>` is shorthand for
> `npx @freeticket/cli@latest <command>`** — use the `npx …@latest` form unless
> the CLI is installed globally. Pinning `@latest` matters: a user on an older
> version (e.g. before the device-flow login) breaks otherwise.

`ft login` uses the OAuth 2.0 Device Authorization Grant: it shows a short code
and a URL, opens your browser, and once you approve it stores the session in
`~/.freeticket/config.json`. Anyone with a FreeTicket account can log in — no
backend-issued API key required. The `--key ft_live_…` flag stays for headless
CI where a browser isn't available.

### Authentication policy (agents: follow exactly)

When a command fails with `No API key configured` (or `Invalid… API key`), the
**only** correct action is to start the device flow — the end user logs in
themselves through their own browser. There is **no backend-issued key per user**.

1. Run `npx @freeticket/cli@latest login` (no `--key`). It prints a short code +
   URL and opens the user's browser.
2. **Show the user the code and URL** from that output and ask them to approve
   in the browser. The command keeps polling and finishes on its own once they do.
3. After `✓ Session saved`, retry the original command. The session persists in
   `~/.freeticket/config.json` (per machine, all projects) — log in once, reuse
   everywhere.

**Never** ask the user for an `ft_live_…` key, never invent one, and never tell
them to pass `--key`. The `--key` / `FT_API_KEY` path is **only** for headless CI
with no browser, and only when the user has already supplied a key themselves.
If `ft login` can't open a browser in your environment, print the code + URL and
tell the user to run `ft login` in their own terminal, then continue.

Config lives in `~/.freeticket/config.json` (mode `0600`). Precedence:
**flags > env (`FT_API_URL`/`FT_API_KEY`/`FT_WORKSPACE_ID`) > file > defaults**.
`FT_API_URL` defaults to `https://admin.appfreeticket.com` (without `/api/v1`).

## Commands

| Command | What it does | Min role |
|---|---|---|
| `ft login` | Browser login (device flow); `--key <key>` for CI | VIEWER |
| `ft whoami` | Active user + workspaces | VIEWER |
| `ft config` · `ft logout` | Show config (masked key) · clear key | — |
| `ft events list\|get\|create\|update\|delete\|publish` | Events + lifecycle | VIEWER read / ADMIN write |
| `ft event-dates list\|create <eventId>` · `update\|delete <eventId> <dateId>` | Dates (sessions) of an event | ADMIN write |
| `ft ticket-types list\|get\|create\|update\|delete` | Ticket types (`--event-date-id`) | ADMIN write |
| `ft sales list\|get` | Sales; filters `--status` `--channel` `--event` `--event-date` `--reference` `--buyer` `--from` `--to` | STAFF |
| `ft sales create` | Create a sale/order — comps & programmatic (`--data <json>`) | ADMIN |
| `ft sales cancel\|refund <id>` | Cancel / refund (`refund --data` for partial) | ADMIN |
| `ft sales tickets <id>` | List the individual tickets/attendees of a sale | STAFF |
| `ft tickets access\|checkin\|resend <code>` | Door: read access status · admit (idempotent) · resend QR email | STAFF read / ADMIN resend |
| `ft plans list\|get\|create\|update\|delete` | Membership plans | ADMIN write |
| `ft plans subscribers <id>` | List a plan's subscribers/members | VIEWER |
| `ft subscriptions cancel <id>` | Cancel a subscription | ADMIN |
| `ft discounts list\|create\|update\|delete` | Discount codes / coupons (`--event` `--active`) | ADMIN |
| `ft webhooks list\|create\|delete` | Webhook endpoints, HMAC-signed delivery | ADMIN |
| `ft venues list\|get\|create\|update\|delete` | Venues | ADMIN write |
| `ft staff list\|create\|set-role` | Workspace staff (`set-role --data '{"role":"…"}'`) | ADMIN |
| `ft reports summary` | KPIs (`--period 7d\|30d\|90d\|1y`) | VIEWER |
| `ft reports by-event\|timeseries\|inventory` | Revenue/tickets by event · over time (`--interval`) · capacity/availability | VIEWER |
| `ft reports reconciliation` | CFO: cross-check Mercado Pago ↔ sale ↔ Siigo invoice (`--from` `--to`, `--match`, `--provider`) | ADMIN |
| `ft reports export buyers\|attendees\|subscribers\|reconciliation` | Export to CSV (buyers/attendees take `--event` `--event-date` `--from` `--to` `--status`) | ADMIN |

Common flags on all: `--json` (raw output for `jq`), `--workspace <id>`
(another workspace). Lists also take `--limit <n>` (1–100, default 20),
`--cursor <id>`, and **`--csv`** (any list → CSV on stdout). Writes take
**`--data <json>`** (inline JSON or `@file.json`); `delete` asks for confirmation
unless `--yes`.

### Superadmin (`ft admin …`) — cross-tenant, separate contract

Superadmin commands hit a **different contract** (`/api/admin`) with **different
auth**: a SUPER_ADMIN better-auth session, *not* an API key. Export the session
token first (MVP — a service token is coming, see free-admin#157):

```bash
export FT_ADMIN_SESSION=<better-auth.session_token cookie of a SUPER_ADMIN>
```

| Command | Purpose |
|---|---|
| `ft admin me` | Current superadmin identity |
| `ft admin workspaces list\|get\|create\|update\|suspend\|restore` | Tenants (`--status`, `--q`); `suspend` confirms unless `--yes` |
| `ft admin users list\|get\|update <id>` | Global users (`--q`, `--role`, `--workspace`) |
| `ft admin plans list\|get\|create\|update` | Platform plans |
| `ft admin feature-flags list` · `set <key> --data '{"scope":"…","enabled":true}'` | Feature flags |
| `ft admin audit-log list` | Audit log (`--actor`, `--action`, `--from`, `--to`) |
| `ft admin impersonate --data '{"targetUserId":"…"}'` · `impersonate-stop` | Impersonation |

Admin lists also take `--csv`. Writes take `--data <json>`.

## Output rules (for automation)

- **`--json`** prints raw JSON to *stdout*. Always use it when parsing.
- **Cursor pagination:** lists return `page.nextCursor`; the `--cursor <id>` hint
  is printed to *stderr*, so `--json` stays clean on *stdout*.
- **Errors:** shape `{ error: { code, message, details } }`; exit code `1`.
  `401`=invalid key, `403`=insufficient role, `404`=outside workspace,
  `422`=validation (the `details[]` say which field).
- **Writes:** pass the body with `--data` (inline JSON or `@file.json`). On
  validation errors the CLI prints each offending `path: message`.
- **Money:** integer in the resource currency (`currency`, usually `COP`).
- **Dates:** ISO 8601 UTC.

## Recipes

```bash
# last-month KPIs as JSON
ft reports summary --period 30d --json

# confirmed sales, count and iterate pages
ft sales list --status CONFIRMED --json --limit 100

# export buyers from another workspace
ft reports export buyers --workspace <orgId> --json > buyers.json

# CFO: this month's mismatches (payments without invoice, amounts that don't add up, etc.)
ft reports reconciliation --from 2026-06-01 --to 2026-06-30 --json \
  | jq '[.[] | select(.match_status != "OK")]'

# full reconciliation to CSV for accounting
ft reports export reconciliation --from 2026-06-01 --to 2026-06-30 > reconciliation.csv

# any list to CSV (spreadsheets, accounting, backups)
ft sales list --status CONFIRMED --csv > sales.csv
ft events list --csv > events.csv

# create an event from a file and publish it
ft events create --data @event.json --json | jq -r '.id' | xargs ft events publish

# edit a ticket-type price (partial PATCH)
ft ticket-types update tt_123 --data '{"price": 50000}'

# partial refund of a sale
ft sales refund sale_123 --data '{"amount": 20000}'

# invite staff and assign a role
ft staff create --data '{"email":"ana@org.com","role":"STAFF"}'
ft staff set-role usr_123 --data '{"role":"ADMIN"}'

# door access control: check status, then admit (idempotent)
ft tickets access TC-ABC123 --json
ft tickets checkin TC-ABC123        # retrying never double-admits
ft tickets resend TC-ABC123         # resends the confirmation email with the QR

# create a comp (courtesy) sale and list its tickets
ft sales create --data '{"buyer":{"name":"Ana","email":"ana@org.com"},"items":[{"ticketTypeId":"tt_1","quantity":2}],"comp":true}' --json
ft sales tickets sale_123 --json

# 20% discount code, then list the active ones
ft discounts create --data '{"code":"VERANO","type":"PERCENT","value":20}'
ft discounts list --active true --json

# register a signed webhook (save the signingSecret it returns — shown only once)
ft webhooks create --data '{"url":"https://my-app.com/hooks/ft","events":["sale.confirmed"]}' --json

# a plan's subscribers, and cancel a subscription
ft plans subscribers plan_123 --json
ft subscriptions cancel sub_123

# revenue by event and a monthly time series
ft reports by-event --from 2026-06-01 --to 2026-06-30 --json
ft reports timeseries --interval month --from 2026-01-01 --json
ft reports inventory --group-by ticketType --json

# export attendees (one row per ticket) of an event to CSV
ft reports export attendees --event evt_123 > attendees.csv

# superadmin: suspend a tenant (asks for confirmation; --yes for scripts)
ft admin workspaces suspend ws_123 --yes
```

## Delegating to agents

This skill is the *hands*; the umbrella's agents are the *head*. When a request is
bigger than one command, route it — don't improvise the whole chain inline:

- **Multi-step business goals** ("lanzá el evento de junio con sus fechas y tipos
  de ticket", "auditá y corregí precios") → hand the plan to **`ai-architect`**.
  It decides the order and which `ft` writes to run, then drives them.
- **A command is missing / returns `404` for an endpoint that should exist** →
  the contract is behind. Stop and hand off to **`contract-sync`**: it re-syncs
  the OpenAPI spec from `free-admin` and regenerates the client. **Never** hand-edit
  the generated SDK or invent a flag for an endpoint that isn't in the contract.
- **Read-then-judge tasks** ("¿qué eventos conviene despublicar?", "revisá la
  conciliación") → pull the data with `ft … --json`/`--csv`, then pass it to
  **`freeticket-eventos`** (audit/recommend). This skill fetches; that one reasons.
- **Publishing/release hygiene of the CLI itself** → **`oss-maintainer`**.

Rule of thumb: this skill runs *one well-scoped `ft` action* at a time. Sequencing,
judgment, and contract changes belong to the agents above — delegate so each piece
does what it's best at.

`match_status`: `OK` · `MISSING_INVOICE` (payment without invoice) · `MISSING_CUFE`
(invoice without DIAN stamp) · `AMOUNT_MISMATCH` (MP amount ≠ sale) · `MISSING_PAYMENT`.

## Feedback & suggestions

When the user wants something the CLI doesn't do, finds a command clunky, or has
an improvement idea — **capture it, don't let it drop**. There is no feedback API
(and we don't invent one); the channel is a **GitHub issue** on the right repo,
filed with `gh`.

Classify first, then file where it belongs:

| The feedback is about… | Repo | Label |
|---|---|---|
| A command that exists but is awkward/buggy, or a CLI UX idea | `AppFreeticket/freeticket-cli` | `feedback` |
| A capability that needs a **new endpoint** (not in the contract yet) | `AppFreeticket/free-admin` | `contract`, `feedback` |
| Skill wording, a missing recipe, wrong/unclear docs | `AppFreeticket/agent-skills` | `feedback` |

```bash
gh issue create --repo AppFreeticket/freeticket-cli \
  --title "<short summary>" --label feedback \
  --body "**Context:** what the user was doing
**Wish / friction:** <the user's own words — don't paraphrase the signal away>
**Why it matters:** <impact>

Reported via the freeticket-cli skill."
```

Then **give the user the issue URL** so they can track it.

- **Vague or strategic feedback** ("esto debería ser más rápido", "me gustaría
  poder…") → don't file raw. Hand it to **`ai-architect`** first; it owns the
  roadmap and turns it into a concrete, well-placed backlog item (and knows
  whether it's a CLI, contract, or skill change).
- **`gh` missing or not authed** → draft the title + body anyway and give the
  user the ready-to-paste text plus the repo's new-issue URL.

Always preserve the user's wording in the issue — that's the signal worth keeping.

Full command table, errors and pagination: see `references/commands.md`.
To audit this data and recommend improvements, combine with the
`freeticket-eventos` skill.
