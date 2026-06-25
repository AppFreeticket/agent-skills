# Referencia de comandos `ft`

Detalle de cada comando del CLI de FreeTicket. La base de la API es
`FT_API_URL` + `/api/v1`. Todo es **tenant-scoped**: solo ves recursos del
workspace activo; un id de otro workspace devuelve `404` (anti-IDOR).

## Autenticación y config

| Comando | Descripción |
|---|---|
| `ft login --key ft_live_…` | Guarda la key en `~/.freeticket/config.json` (0600) y la valida contra `/me`. |
| `ft whoami` | Imprime el usuario dueño de la key, su rol y `workspaces[]` accesibles. |
| `ft config` | Muestra config efectiva con la key enmascarada. |
| `ft logout` | Borra la key del archivo de config. |

La key actúa como su usuario dueño, **con su mismo rol**. Nunca se guarda en
claro en el backend (solo su `sha-256`); el prefijo visible es `ft_live_`.

## Roles

Jerarquía: `SUPER_ADMIN > ADMIN > STAFF > VIEWER`. Cada endpoint exige un rol
mínimo; insuficiente → `403`.

## Lecturas

| Comando | Flags propios | Rol |
|---|---|---|
| `ft events list` | `--limit` `--cursor` | VIEWER |
| `ft events get <id>` | — | VIEWER |
| `ft ticket-types list` | `--event-date-id <id>` `--limit` `--cursor` | VIEWER |
| `ft ticket-types get <id>` | — | VIEWER |
| `ft sales list` | `--status PENDING\|CONFIRMED\|CANCELLED\|REFUNDED\|ABANDONED` `--limit` `--cursor` | STAFF |
| `ft sales get <id>` | — | STAFF |
| `ft plans list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft venues list` · `get <id>` | `--limit` `--cursor` | VIEWER |
| `ft staff list` | `--limit` `--cursor` | ADMIN |
| `ft reports summary` | `--period 7d\|30d\|90d\|1y` | VIEWER |
| `ft reports export buyers` | `--json` (recomendado) | ADMIN |
| `ft reports export subscribers` | `--json` (recomendado) | ADMIN |

## Flags globales

| Flag | Efecto |
|---|---|
| `--json` | Salida JSON cruda en stdout (parseable). Sin él, salida legible. |
| `--workspace <orgId>` | Ejecuta el comando contra otro workspace accesible (espeja `X-Workspace-Id`). |
| `--limit <n>` | Tamaño de página en listados, 1–100 (default 20). |
| `--cursor <id>` | Página siguiente; el valor sale en la pista `page.nextCursor`. |

## Paginación

Los listados devuelven `{ data: [...], page: { nextCursor } }`. Si `nextCursor`
no es nulo hay más resultados:

```bash
first=$(ft sales list --json --limit 100)
cursor=$(echo "$first" | jq -r '.page.nextCursor // empty')
[ -n "$cursor" ] && ft sales list --json --limit 100 --cursor "$cursor"
```

## Errores

Formato uniforme y exit code `1`:

```json
{ "error": { "code": "FORBIDDEN", "message": "...", "details": {} } }
```

| HTTP | Significado | Acción |
|---|---|---|
| `401` | Key ausente/inválida/revocada | Re-emitir la key y `ft login` de nuevo. |
| `403` | Rol insuficiente para el endpoint | Pedir una key de un usuario con rol superior. |
| `404` | Recurso fuera del workspace activo | Verificar `--workspace` / `ft whoami`. |
| `501` | Escritura no implementada (fase 2) | Las mutaciones aún no están disponibles. |

## Convenciones de datos

- **Dinero:** entero en la moneda del recurso (`currency`, normalmente `COP`).
  No asumas decimales; usa el campo `currency` para formatear.
- **Fechas:** ISO 8601 en **UTC**. La hora local de un evento depende de su zona
  horaria (`timezone` IANA en la fecha del evento), no del UTC crudo.
- **camelCase:** los DTOs de la API son camelCase aunque la DB sea snake_case.
