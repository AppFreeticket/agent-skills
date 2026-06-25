---
name: freeticket-cli
description: Usa el CLI oficial de FreeTicket (binario `ft`, npm `@appfreeticket/cli`) para operar un workspace desde la terminal — login con API key, listar y consultar eventos, fechas, tipos de ticket, ventas, planes de membresía, venues, staff e informes, y exportar compradores/suscriptores. Úsala cuando el usuario quiera consultar datos reales de su cuenta FreeTicket, correr `ft <comando>`, automatizar reportes con `--json`/`jq`, configurar la API key/workspace, o cuando otra skill necesite traer datos en vivo del backend B2B v1.
---

# FreeTicket CLI (`ft`)

`ft` es el cliente de terminal de FreeTicket. Consume la **API REST B2B v1** y se
genera desde su contrato OpenAPI 3.1, así que cada endpoint existe como comando.
En esta fase **las lecturas funcionan**; las escrituras (crear/editar/borrar)
están declaradas pero responden `501` (llegan en fase 2).

## Cuándo usar esta skill

- El usuario pide datos reales de su cuenta: "¿cuántas ventas llevo?", "lista mis eventos", "exporta los compradores".
- Hay que correr `ft ...` o automatizar un reporte para `jq`/scripts.
- Configurar/rotar la API key o cambiar de workspace.
- Otra skill (p. ej. `freeticket-eventos`) necesita traer datos en vivo para auditar.

## Setup (una vez)

```bash
# instalar (Node ≥ 20)
npm install -g @appfreeticket/cli      # o: npx @appfreeticket/cli whoami

# la API key se emite en el backend (lado servidor), se muestra UNA sola vez:
#   pnpm api:key tu-email@dominio.com   →   ft_live_xxxxx

ft login --key ft_live_xxxxx           # guarda y verifica la key
ft whoami                              # usuario + workspaces accesibles
```

La config vive en `~/.freeticket/config.json` (permisos `0600`). Precedencia:
**flags > env (`FT_API_URL`/`FT_API_KEY`/`FT_WORKSPACE_ID`) > archivo > defaults**.
`FT_API_URL` por defecto es `https://admin.appfreeticket.com` (sin `/api/v1`).

## Comandos

| Comando | Qué hace | Rol mínimo |
|---|---|---|
| `ft login --key <key>` | Guarda y verifica la API key | VIEWER |
| `ft whoami` | Usuario activo + workspaces | VIEWER |
| `ft config` · `ft logout` | Ver config (key enmascarada) · borrar key | — |
| `ft events list` · `get <id>` | Eventos del workspace | VIEWER |
| `ft ticket-types list` · `get <id>` | Tipos de ticket (`--event-date-id`) | VIEWER |
| `ft sales list` · `get <id>` | Ventas (`--status`) | STAFF |
| `ft plans list` · `get <id>` | Planes de membresía | VIEWER |
| `ft venues list` · `get <id>` | Venues | VIEWER |
| `ft staff list` | Staff del workspace | ADMIN |
| `ft reports summary` | KPIs (`--period 7d\|30d\|90d\|1y`) | VIEWER |
| `ft reports export buyers\|subscribers` | Exporta compradores / suscriptores | ADMIN |

Flags comunes en todos: `--json` (salida cruda para `jq`), `--workspace <id>`
(otro workspace), y en listados `--limit <n>` (1–100, default 20) + `--cursor <id>`.

## Reglas de salida (para automatizar)

- **`--json`** imprime JSON crudo en *stdout*. Úsalo siempre que vayas a parsear.
- **Paginación por cursor:** los listados devuelven `page.nextCursor`; la pista
  `--cursor <id>` se imprime en *stderr*, así `--json` queda limpio en *stdout*.
- **Errores:** formato `{ error: { code, message, details } }`; exit code `1`.
  `401`=key inválida, `403`=rol insuficiente, `404`=fuera del workspace, `501`=escritura no implementada.
- **Dinero:** entero en la moneda del recurso (`currency`, normalmente `COP`).
- **Fechas:** ISO 8601 UTC.

## Recetas

```bash
# KPIs del último mes en JSON
ft reports summary --period 30d --json

# ventas confirmadas, contar e iterar páginas
ft sales list --status CONFIRMED --json --limit 100

# exportar compradores de otro workspace
ft reports export buyers --workspace <orgId> --json > buyers.json
```

Tabla de comandos completa, errores y paginación: ver `references/commands.md`.
Si necesitas auditar estos datos y recomendar mejoras, combina con la skill
`freeticket-eventos`.
