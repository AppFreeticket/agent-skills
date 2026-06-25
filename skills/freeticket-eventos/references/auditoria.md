# Auditoría de eventos con datos reales

Cómo traer datos en vivo con el CLI `ft` y convertirlos en recomendaciones
accionables. Requiere la skill `freeticket-cli` instalada y `ft login` hecho.

## 1. Traer los datos

```bash
ft whoami --json                                   # confirmar workspace y rol
ft reports summary --period 30d --json             # KPIs del periodo
ft reports summary --period 1y   --json            # tendencia anual
ft events list --json --limit 100                  # catálogo de eventos
ft ticket-types list --json --limit 100            # precios y stock por tipo
ft sales list --status CONFIRMED --json --limit 100
ft sales list --status ABANDONED --json --limit 100
ft plans list --json                               # ¿hay membresías? (preventas)
ft reports export buyers --json > buyers.json      # base para recompra (rol ADMIN)
```

Si un comando da `403`, falta rol; si da `404`, revisa `--workspace`. Si el
usuario aún no tiene `ft`, ofrece instalarlo (ver skill `freeticket-cli`) antes
de afirmar cualquier número. **Nunca inventes métricas.**

## 2. Señales a calcular

| Señal | Cómo | Qué mira |
|---|---|---|
| **Conversión** | confirmadas / (confirmadas + abandonadas) | Fricción en checkout/precio. |
| **Tasa de abandono** | abandonadas / total iniciadas | Pagos que no cierran. |
| **Ritmo de venta** | confirmadas por día vs. días a la fecha | ¿Llega vendido o frío? |
| **Mix de tickets** | ventas por `ticketType` | Qué nivel tira y cuál sobra. |
| **Sell-through** | vendidos / stock por tipo | Tipos agotados vs. estancados. |
| **Peso de preventa** | ventas en ventana de preventa / total | Fuerza de la comunidad. |
| **Ticket promedio** | ingreso neto / nº de ventas | Espacio para upsell. |

Recuerda: el dinero viene en entero + `currency`; FreeTicket retiene **10%** de
servicio — razona en **neto**.

## 3. Heurísticas de diagnóstico

- **Abandono alto (> ~40%):** precio percibido alto, pocos medios de pago, o
  copy poco claro. Revisa `description`/`recommendations` y el rango de precio.
- **Ritmo plano lejos de la fecha:** falta empuje inicial → activa **preventa
  para miembros** o un tipo "early bird" limitado.
- **Un solo tipo de ticket concentra todo:** falta escalera de precios (general /
  preferencial / VIP) para capturar disposición a pagar.
- **Sell-through bajo en el tipo caro:** baja el stock del VIP o súbele valor
  (beneficio, no solo precio).
- **Sin planes de membresía (`plans list` vacío):** no hay palanca de comunidad
  ni preventas posibles → recomendarlo como prioridad 1 si el objetivo es recurrencia.
- **Visibilidad:** si un evento no aparece en el portal, verifica que **evento +
  fecha** estén `PUBLISHED` y la fecha sea **futura** (causa #1 de "no vende").

## 4. Entregable

Cierra siempre con **3–5 recomendaciones priorizadas**, cada una:
- atada a un número observado ("abandono 52% en los últimos 30 días"),
- con una acción concreta del producto (no "mejora el marketing"),
- y, si toca copy, con el texto sugerido en español neutro (`lenguaje.md`).

Ejemplo:
> 1. **Conversión 48%** — el checkout pierde la mitad. La descripción no dice qué
>    incluye la entrada. Sugerido: «Incluye acceso general de pie + guardarropa».
> 2. **Sin preventa** y tienes 0 planes de membresía. Crea un plan básico y abre
>    una preventa de 48 h solo para miembros antes de la venta general.
> 3. **VIP con 5% de sell-through** — está sobrevalorado o sin diferenciar. Súmale
>    meet & greet o reduce el stock de 100 a 30.

## 5. Palancas de comunidad (cuando el objetivo es recurrencia)

| Palanca | Señal que la justifica | Acción |
|---|---|---|
| **Membresías (Stripe)** | recompra baja, sin planes | Crear plan y comunicar beneficios. |
| **Preventas exclusivas** | comunidad existe pero no se activa | Ventana solo-miembros antes de la general. |
| **Contenido / Live (DRM)** | engagement entre eventos cae | VOD/streaming exclusivo para miembros. |
| **Recompra dirigida** | base de `buyers` grande, sin segmentar | Invitar compradores del último show al próximo. |
