<div align="center">

# FreeTicket Agent Skills

**Skills para que tu agente opere y haga crecer FreeTicket.**

Skills instalables con [`npx skills`](https://skills.sh) para Claude Code y
agentes compatibles.

[![license](https://img.shields.io/badge/license-MIT-07C2BA.svg)](./LICENSE)

</div>

---

## Skills

| Skill | Qué hace |
|---|---|
| [`freeticket-cli`](./skills/freeticket-cli) | Maneja el CLI oficial `ft` (`@appfreeticket/cli`): login con API key, listar/consultar eventos, ventas, tickets, membresías, venues, staff e informes, y exportar compradores — con `--json` para automatizar. |
| [`freeticket-eventos`](./skills/freeticket-eventos) | Asesor de eventos y comunidad: aplica el lenguaje de marca (español neutro) y las reglas reales del producto, y **audita eventos con datos en vivo** (vía `ft`) para recomendar mejoras de venta y retención. |

Las dos se componen: `freeticket-eventos` usa `freeticket-cli` para traer datos
reales antes de auditar.

## Instalación

```bash
# una skill
npx skills add AppFreeticket/agent-skills@freeticket-cli
npx skills add AppFreeticket/agent-skills@freeticket-eventos

# o explorar
npx skills find freeticket
```

Las skills se instalan en `~/.claude/skills/` (global) o en `.claude/skills/`
del proyecto. El agente carga `name` + `description` y abre el cuerpo cuando la
tarea coincide (progressive disclosure).

## Estructura

```
agent-skills/
└── skills/
    ├── freeticket-cli/
    │   ├── SKILL.md
    │   └── references/commands.md
    └── freeticket-eventos/
        ├── SKILL.md
        └── references/
            ├── lenguaje.md      # voz de marca, copy neutro
            └── auditoria.md     # traer datos con ft + heurísticas + comunidad
```

## Relacionado

- CLI: [`@appfreeticket/cli`](https://github.com/AppFreeticket/freeticket-cli) (binario `ft`)
- API B2B v1: contrato OpenAPI 3.1 en `GET /api/v1/openapi.json`

## Licencia

[MIT](./LICENSE) © FreeTicket
