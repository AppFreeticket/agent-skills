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
npx skills add AppFreeticket/agent-skills@freeticket-eventos

# List what's in the repo
npx skills add AppFreeticket/agent-skills -l
```

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

---

## Skills Overview

**2 skills.** They compose: `freeticket-eventos` calls `freeticket-cli` to pull
live data before it audits.

| Skill | Scope | Install |
|---|---|---|
| [`freeticket-cli`](./skills/freeticket-cli) | Drive the official `ft` CLI (`@freeticket/cli`): log in (browser device flow), list/inspect **and** create/update/delete events, dates, ticket types, sales, membership plans, venues, staff; publish events; cancel/refund sales; run CFO reconciliation; export anything to CSV. Superadmin via `ft admin …`. `--json`/`--csv` for automation. | `npx skills add AppFreeticket/agent-skills@freeticket-cli` |
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
    └── freeticket-eventos/
        ├── SKILL.md
        └── references/
            ├── language.md     # brand voice, neutral-Spanish copy
            └── audit.md        # pull data with ft + heuristics + community
```

---

## Related

- CLI: [`@freeticket/cli`](https://github.com/AppFreeticket/freeticket-cli) (binary `ft`)
- B2B API v1: OpenAPI 3.1 contract at `GET /api/v1/openapi.json`

## License

[MIT](./LICENSE) © FreeTicket
