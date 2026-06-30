---
name: freeticket-cli
description: Drive the official FreeTicket CLI (binary `ft`, npm `@appfreeticket/cli`) to operate a workspace from the terminal — log in with an API key, list and inspect events, dates, ticket types, sales, membership plans, venues, staff and reports, run the CFO financial reconciliation (Mercado Pago vs sale vs Siigo invoice), and export buyers/subscribers. Use it when the user wants real data from their FreeTicket account, to run `ft <command>`, to automate reports with `--json`/`jq`, to configure the API key/workspace, or when another skill needs live data from the B2B v1 backend.
---

# FreeTicket CLI (`ft`)

`ft` is FreeTicket's terminal client. It consumes the **B2B REST API v1** and is
generated from its OpenAPI 3.1 contract, so every endpoint exists as a command.
In this phase **reads work**; writes (create/update/delete) are declared but
return `501` (shipping in phase 2).

## When to use this skill

- The user wants real data: "how many sales do I have?", "list my events", "export buyers".
- You need to run `ft ...` or automate a report for `jq`/scripts.
- Configure/rotate the API key or switch workspace.
- Another skill (e.g. `freeticket-eventos`) needs live data to audit.

## Setup (once)

```bash
# install (Node >= 20)
npm install -g @appfreeticket/cli      # or: npx @appfreeticket/cli whoami

# the API key is issued on the backend (server side), shown ONCE:
#   pnpm api:key your-email@domain.com   ->   ft_live_xxxxx

ft login --key ft_live_xxxxx           # stores and verifies the key
ft whoami                              # user + accessible workspaces
```

Config lives in `~/.freeticket/config.json` (mode `0600`). Precedence:
**flags > env (`FT_API_URL`/`FT_API_KEY`/`FT_WORKSPACE_ID`) > file > defaults**.
`FT_API_URL` defaults to `https://admin.appfreeticket.com` (without `/api/v1`).

## Commands

| Command | What it does | Min role |
|---|---|---|
| `ft login --key <key>` | Store and verify the API key | VIEWER |
| `ft whoami` | Active user + workspaces | VIEWER |
| `ft config` · `ft logout` | Show config (masked key) · clear key | — |
| `ft events list` · `get <id>` | Workspace events | VIEWER |
| `ft ticket-types list` · `get <id>` | Ticket types (`--event-date-id`) | VIEWER |
| `ft sales list` · `get <id>` | Sales (`--status`) | STAFF |
| `ft plans list` · `get <id>` | Membership plans | VIEWER |
| `ft venues list` · `get <id>` | Venues | VIEWER |
| `ft staff list` | Workspace staff | ADMIN |
| `ft reports summary` | KPIs (`--period 7d\|30d\|90d\|1y`) | VIEWER |
| `ft reports reconciliation` | CFO: cruce Mercado Pago ↔ venta ↔ factura Siigo (`--from` `--to`, `--match`, `--provider`) | ADMIN |
| `ft reports export buyers\|subscribers\|reconciliation` | Export buyers / subscribers / reconciliación (CSV) | ADMIN |

Common flags on all: `--json` (raw output for `jq`), `--workspace <id>`
(another workspace), and on lists `--limit <n>` (1–100, default 20) + `--cursor <id>`.

### Superadmin (`ft admin …`) — cross-tenant, separate contract

Superadmin commands hit a **different contract** (`/api/admin`) with **different
auth**: a SUPER_ADMIN better-auth session, *not* an API key. Export the session
token first (MVP — a service token is coming, see free-admin#157):

```bash
export FT_ADMIN_SESSION=<better-auth.session_token cookie of a SUPER_ADMIN>
```

Read-only commands (first pass):

| Command | Purpose |
|---|---|
| `ft admin me` | Current superadmin identity |
| `ft admin workspaces list\|get <id>` | Tenants (`--status`, `--q`) |
| `ft admin users list\|get <id>` | Global users (`--q`, `--role`, `--workspace`) |
| `ft admin plans list\|get <id>` | Platform plans |
| `ft admin feature-flags list` | Feature flags |
| `ft admin audit-log list` | Audit log (`--actor`, `--action`, `--from`, `--to`) |

Writes (suspend/restore, patch, impersonate, flag put) are not exposed yet.

## Output rules (for automation)

- **`--json`** prints raw JSON to *stdout*. Always use it when parsing.
- **Cursor pagination:** lists return `page.nextCursor`; the `--cursor <id>` hint
  is printed to *stderr*, so `--json` stays clean on *stdout*.
- **Errors:** shape `{ error: { code, message, details } }`; exit code `1`.
  `401`=invalid key, `403`=insufficient role, `404`=outside workspace, `501`=write not implemented.
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

# CFO: descuadres del mes (pagos sin factura, montos que no cuadran, etc.)
ft reports reconciliation --from 2026-06-01 --to 2026-06-30 --json \
  | jq '[.[] | select(.match_status != "OK")]'

# bajar la conciliación completa a CSV para contabilidad
ft reports export reconciliation --from 2026-06-01 --to 2026-06-30 > conciliacion.csv
```

`match_status`: `OK` · `MISSING_INVOICE` (pago sin factura) · `MISSING_CUFE`
(factura sin timbre DIAN) · `AMOUNT_MISMATCH` (monto MP ≠ venta) · `MISSING_PAYMENT`.

Full command table, errors and pagination: see `references/commands.md`.
To audit this data and recommend improvements, combine with the
`freeticket-eventos` skill.
