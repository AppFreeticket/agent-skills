<div align="center">

# FreeTicket Agent Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-07C2BA.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/AppFreeticket/agent-skills)](https://github.com/AppFreeticket/agent-skills/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/AppFreeticket/agent-skills)](https://github.com/AppFreeticket/agent-skills/commits/main)

**Skills that let your AI agent operate and grow [FreeTicket](https://freeticket.co) — the LATAM (Colombia-first) ticketing platform.**

Drive the `ft` CLI, read and mutate real account data, and write/audit events in
FreeTicket's brand voice. Installable with [`npx skills`](https://skills.sh) for
Claude Code, Cursor, and any agent that reads markdown skills.

</div>

---

## Quick Start

```bash
# Install a specific skill (recommended)
npx skills add AppFreeticket/agent-skills@freeticket-cli
npx skills add AppFreeticket/agent-skills@freeticket-mcp
npx skills add AppFreeticket/agent-skills@freeticket-eventos

# List what's in the repo
npx skills add AppFreeticket/agent-skills -l
```

Or install **all three skills plus the MCP server at once** — this repo is also a
plugin under the [Agent Plugins 1.0.0](https://agent-plugins.org) standard
(`plugin.json` + `skills/` + `mcp.json` at the root):

```bash
# Claude Code
/plugin marketplace add AppFreeticket/agent-skills
/plugin install freeticket@freeticket
```

Any Agent-Plugins-compatible client can read the same manifests. The plugin
wires the `freeticket` MCP server over its hosted endpoint and authorizes in the
browser on first use — no keys to paste, nothing to install.

Skills install into `~/.claude/skills/` (global) or the project's `.claude/skills/`.
The agent loads each skill's `name` + `description` and opens the body only when
your prompt matches it ([progressive disclosure](https://agentskills.io/specification)).

---

## What are Skills?

Skills are **markdown files** that give an AI agent focused knowledge and
workflows. Add them to your project; the agent picks the right skill from your
prompt and applies it — here, that means knowing how to drive the `ft` CLI, what
FreeTicket's product rules are, and how to write copy in the right voice. They
turn a general agent into one that can actually operate your FreeTicket workspace.

### Works with any AI tool

These are plain markdown following the [Agent Skills spec](https://agentskills.io/specification) —
not tied to one vendor. Use them in any AI coding tool or assistant:

- **Native skill support** (auto-loaded): Claude Code, Cursor, Windsurf, Cline,
  and any agent that reads a `skills/` directory — install with `npx skills add …`.
- **OpenAI Codex / Cursor / any AGENTS.md-based agent:** point the agent at the
  `SKILL.md` (or reference it from your `AGENTS.md`), e.g.
  `See skills/freeticket-cli/SKILL.md for how to drive the ft CLI.` The agent
  reads it as context and runs the `npx @freeticket/cli@latest` commands from the
  terminal — no plugin needed.
- **Anything else** (ChatGPT, Claude.ai, Gemini, Copilot Chat, v0, Bolt, Lovable…):
  paste the relevant `SKILL.md` into the chat as context. The CLI runs the same
  everywhere via `npx @freeticket/cli@latest <command>` — no install, no lock-in.

The only requirement is a terminal where the agent (or you) can run `npx`.

---

## Skills Overview

**3 skills.** They compose: `freeticket-eventos` pulls live data before it
audits, through `freeticket-cli` in a terminal or `freeticket-mcp` in a chat
client. `freeticket-cli` and `freeticket-mcp` are the same B2B contract from two
directions — the CLI for terminals and scripts, the MCP server for chat clients.

| Skill | Scope | Install |
|---|---|---|
| [`freeticket-cli`](./skills/freeticket-cli) | Drive the official `ft` CLI (`@freeticket/cli`): log in (browser device flow), list/inspect **and** create/update/delete events, dates, ticket types, sales, membership plans, venues, staff; publish events; cancel/refund sales; run CFO reconciliation; export anything to CSV. Superadmin via `ft admin …`. `--json`/`--csv` for automation. | `npx skills add AppFreeticket/agent-skills@freeticket-cli` |
| [`freeticket-mcp`](./skills/freeticket-mcp) | Connect to and operate the official MCP server (`@freeticket/mcp`): local stdio setup, remote connectors on claude.ai via the embedded OAuth 2.1 server, the three credential layers (anonymous B2C → workspace B2B → superadmin), all 87 tools, and the MCP Apps view that renders lists and reports inside the host. | `npx skills add AppFreeticket/agent-skills@freeticket-mcp` |
| [`freeticket-eventos`](./skills/freeticket-eventos) | Event & community advisor: applies FreeTicket's brand voice and real product rules (visibility, member-gated presales, platform fee, time zone, required ticket fields), and **audits events with live data** (via `ft`) to recommend sales and retention improvements. | `npx skills add AppFreeticket/agent-skills@freeticket-eventos` |

---

## Usage

Ask your agent in natural language — it picks the right skill. Examples:

| You say | Skill |
|---|---|
| "How many sales do I have?" / "List my events" / "Export buyers" | `freeticket-cli` |
| "Create an event" / "Publish it" / "Refund sale X" / "Raise a ticket price" | `freeticket-cli` |
| "Run the CFO reconciliation" / "Suspend a tenant" / "Set a feature flag" | `freeticket-cli` (incl. `ft admin …`) |
| "Automate this report" / "Give me `--json` for `jq`" / "Configure my API key" | `freeticket-cli` |
| "Add FreeTicket to Claude Desktop" / "Set up the MCP connector on claude.ai" | `freeticket-mcp` |
| "Why do I only see the public tools?" / "Which MCP tool refunds a sale?" | `freeticket-mcp` |
| "Write the description for this event" / "Improve my event copy" | `freeticket-eventos` |
| "Why isn't this event selling?" / "Audit my event" | `freeticket-eventos` (pulls data via `ft`) |
| "How do I grow and retain my audience?" / "Recommend a presale strategy" | `freeticket-eventos` |

---

## Language note

The skill **instructions** are in English for global reuse, but the
**buyer-facing copy** `freeticket-eventos` produces is in **neutral Spanish**
(tú / impersonal, never voseo) — FreeTicket is a LATAM, Colombia-first platform.
See [`references/language.md`](./skills/freeticket-eventos/references/language.md).

---

## Structure

```
agent-skills/
└── skills/
    ├── freeticket-cli/
    │   ├── SKILL.md
    │   └── references/commands.md
    ├── freeticket-mcp/
    │   ├── SKILL.md
    │   └── references/tools.md      # 87 tools + what is deliberately absent
    └── freeticket-eventos/
        ├── SKILL.md
        └── references/
            ├── language.md     # brand voice, neutral-Spanish copy
            └── audit.md        # pull data with ft + heuristics + community
```

---

## Related

- CLI: [`@freeticket/cli`](https://github.com/AppFreeticket/freeticket-cli) (binary `ft`)
- MCP server: [`@freeticket/mcp`](https://github.com/AppFreeticket/freeticket-mcp)
- B2B API v1: OpenAPI 3.1 contract at `GET /api/v1/openapi.json`

## License

[MIT](./LICENSE) © FreeTicket
