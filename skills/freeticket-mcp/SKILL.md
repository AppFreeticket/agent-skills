---
name: freeticket-mcp
description: Connect to and operate the official FreeTicket MCP server (`@freeticket/mcp`) — the same B2B domain the `ft` CLI exposes, but as MCP tools for any MCP client. Covers the three credential layers (anonymous B2C `public_*`, workspace B2B, superadmin `admin_*`), local stdio setup, remote HTTP connectors on claude.ai via the embedded OAuth 2.1 server, the full tool inventory (87 tools), and the MCP Apps view that renders lists and reports as tables and KPI tiles inside the host. Use it when the user wants to add FreeTicket to Claude Desktop / claude.ai / Cursor, is already calling `freeticket` MCP tools and needs to know which one to pick, is debugging why tools are missing or a connector won't authorize, or is deciding between the MCP server and the `ft` CLI for a task.
---

# FreeTicket MCP server (`@freeticket/mcp`)

The official MCP server for FreeTicket. It exposes the **same OpenAPI contract**
the `ft` CLI consumes — one tool per contract operation, generated from the spec,
never hand-written. If the API can do it, there is a tool; if there is no tool,
the API cannot do it yet.

**87 tools** across three contracts: B2B `/api/v1` (61), superadmin `/api/admin`
(20), public B2C `/api/public` (6). Full inventory with signatures:
[`references/tools.md`](references/tools.md).

## MCP server or `ft` CLI?

Both hit the same backend. Pick by where the work happens:

| Use the **MCP server** | Use the **`ft` CLI** ([`freeticket-cli`](../freeticket-cli/SKILL.md)) |
|---|---|
| The user is in a chat client (claude.ai, Claude Desktop, Cursor) | The user is in a terminal, or you are writing a script |
| You want lists and reports rendered as tables/KPIs in the host | You need CSV, `--json` piped to `jq`, or cron |
| A buyer-side agent with no credentials at all (`public_*`) | Minting or revoking credentials (deliberately not in MCP) |

They share one session: `ft login` writes `~/.freeticket/config.json`, and the
local MCP server reads it. Log in once, both work.

## Setup

### Local (Claude Code, Claude Desktop, Cursor)

```jsonc
{
  "mcpServers": {
    "freeticket": {
      "command": "npx",
      "args": ["-y", "@freeticket/mcp"]
      // No env needed: it reuses the `ft login` session.
      // Headless/CI only: "env": { "FT_API_KEY": "ft_live_…", "FT_WORKSPACE_ID": "ws_…" }
    }
  }
}
```

Config precedence: **env > `~/.freeticket/config.json` > defaults**.

| Variable | Effect |
|---|---|
| `FT_API_URL` | API base **without** `/api/v1` (default `https://admin.appfreeticket.com`) |
| `FT_API_KEY` | B2B credential — unlocks the workspace tools |
| `FT_WORKSPACE_ID` | Active workspace (`X-Workspace-Id`) |
| `FT_ADMIN_SESSION` | SUPER_ADMIN session cookie — unlocks `admin_*` |

### Remote (claude.ai custom connector)

claude.ai cannot send API keys or custom headers, so the server ships its own
**OAuth 2.1 authorization server**. Settings → Connectors → Add custom connector
→ URL `https://<deploy>/mcp`, leave Client ID/Secret **empty** (dynamic client
registration, RFC 7591). The consent page offers **"Continuar con FreeTicket"**:
the user signs into free-admin with their normal account and approves — same
device flow as `ft login`, nothing to paste. Advanced options still accept a raw
API key (CI) or a superadmin cookie.

`POST /mcp/public` needs no auth at all and serves only `public_*` — that is the
endpoint for a buyer's agent.

## The three credential layers

Tools are registered per session by what the credential carries. **A missing tool
is not a bug — it is a missing credential.**

| Layer | Requires | Tools |
|---|---|---|
| Public B2C | nothing | `public_*` (6) — always registered |
| B2B workspace | API key / `ft login` session | events, sales, tickets, plans, venues, staff, reports, settlements (61) |
| Superadmin | `FT_ADMIN_SESSION` | `admin_*` (20) — cross-tenant |

If the user asks for something and the tool isn't there, check the layer before
anything else: no `events_list` means no API key; no `admin_users` means no
superadmin session.

## Working rules

**Reads are free, writes are not.** Destructive tools (`*_delete`,
`sales_refund`, `sales_cancel`, `admin_workspaces_suspend`, `admin_impersonate`)
carry `destructiveHint` and say so in their description. Confirm with the human
before calling one, and quote what will be affected — id, name, amount.

**Never invent an endpoint.** These tools are generated from the contract. If a
capability is missing, it is missing upstream in `free-admin`, and the fix is to
request it there — not to compose a workaround out of other tools that mutates
data in a way the API didn't intend.

**Credentials are read-only.** `api_keys_list` and `admin_tokens` show what
exists so it can be audited; minting and revoking are CLI-only, on purpose. Do
not ask the user for an `ft_live_…` key — send them to `ft login` or the
connector consent page.

**Payments stay with the human.** `public_orders_create` returns a Mercado Pago
`checkoutUrl`. Hand the user the link. Never ask for card data, and never claim
an order is paid until `public_orders_get` says so.

**Multi-workspace reads.** Every B2B list tool takes an optional `workspace`
argument: `"all"` aggregates every workspace the session can reach, or pass an
array of ids. Each row comes back tagged with `workspaceId`/`workspaceName`.
Omit it for the active workspace alone. Writes have no global mode — a mutation
is always explicitly scoped to one workspace.

**Money is in COP** and lists are cursor-paginated (`limit` 1–100, default 20,
plus `cursor`). Dates are ISO 8601; events carry their own IANA timezone.

## The view (MCP Apps)

Lists and reports do not arrive as a wall of JSON. The server implements the
official **`io.modelcontextprotocol/ui`** extension (MCP Apps, spec
`2026-01-26`): 25 tools declare `_meta.ui.resourceUri` pointing at
`ui://freeticket/view.html`, and a supporting host renders them — **array →
table**, **object → KPI tiles** — with FreeTicket's mark and accent, adopting the
host's own palette and locale for everything else.

What this means for you:

- The result you receive is unchanged: JSON in `content`, plus
  `structuredContent` for the view. Reason over the JSON as always.
- **Do not re-render the table in your reply.** The user already sees it. Say
  what it means — the outlier, the trend, the number they asked for.
- Hosts without the extension (terminals, older clients) simply get the text.
  Nothing degrades, so never branch your behaviour on whether a view exists.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Only `public_*` tools listed | No B2B credential in the session | `ft login`, or set `FT_API_KEY` |
| No `admin_*` tools | No superadmin session | Set `FT_ADMIN_SESSION` (cookie `better-auth.session_token`) |
| 401 on every B2B tool | Expired session or wrong `FT_API_URL` | Re-run `ft login`; check the base URL has no `/api/v1` |
| 403 on one resource | Role too low, or resource in another workspace | Check `whoami`; pass the right `workspace` |
| Connector won't authorize on claude.ai | Client ID/Secret filled in | Leave both empty — registration is dynamic |
| Tokens die after every deploy | `MCP_TOKEN_SECRET` unset on the host | Set it (`openssl rand -hex 32`); without it the secret is ephemeral |
| Tool exists in the docs, not in the client | Client cached an old tool list | Reconnect the server |

## Related

- CLI: [`freeticket-cli`](../freeticket-cli/SKILL.md) — same contract, terminal-side
- Copy & event advice: [`freeticket-eventos`](../freeticket-eventos/SKILL.md)
- Server source: [`AppFreeticket/freeticket-mcp`](https://github.com/AppFreeticket/freeticket-mcp)
