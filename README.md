<div align="center">

# FreeTicket Agent Skills

**Skills that let your agent operate and grow FreeTicket.**

Installable with [`npx skills`](https://skills.sh) for Claude Code and compatible
agents.

[![license](https://img.shields.io/badge/license-MIT-07C2BA.svg)](./LICENSE)

</div>

---

## Skills

| Skill | What it does |
|---|---|
| [`freeticket-cli`](./skills/freeticket-cli) | Drive the official `ft` CLI (`@freeticket/cli`): log in with an API key, list/inspect events, sales, tickets, memberships, venues, staff and reports, and export buyers — with `--json` for automation. |
| [`freeticket-eventos`](./skills/freeticket-eventos) | Event & community advisor: applies FreeTicket's brand voice and real product rules, and **audits events with live data** (via `ft`) to recommend sales and retention improvements. |

The two compose: `freeticket-eventos` uses `freeticket-cli` to pull real data
before auditing.

> **Language note:** the skill instructions are in English for global reuse, but
> the buyer-facing copy `freeticket-eventos` produces is in **neutral Spanish** —
> FreeTicket is a LATAM (Colombia-first) ticketing platform.

## Install

```bash
# one skill
npx skills add AppFreeticket/agent-skills@freeticket-cli
npx skills add AppFreeticket/agent-skills@freeticket-eventos

# list what's in the repo
npx skills add AppFreeticket/agent-skills -l
```

Skills install into `~/.claude/skills/` (global) or the project's `.claude/skills/`.
The agent loads `name` + `description` and opens the body when the task matches
(progressive disclosure).

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

## Related

- CLI: [`@freeticket/cli`](https://github.com/AppFreeticket/freeticket-cli) (binary `ft`)
- B2B API v1: OpenAPI 3.1 contract at `GET /api/v1/openapi.json`

## License

[MIT](./LICENSE) © FreeTicket
