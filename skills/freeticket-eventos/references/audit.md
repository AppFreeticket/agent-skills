# Auditing events with real data

How to pull live data with the `ft` CLI and turn it into actionable
recommendations. Requires the `freeticket-cli` skill installed and `ft login` done.

## 1. Pull the data

```bash
ft whoami --json                                   # confirm workspace and role
ft reports summary --period 30d --json             # period KPIs
ft reports summary --period 1y   --json            # yearly trend
ft events list --json --limit 100                  # event catalog
ft ticket-types list --json --limit 100            # prices and stock per type
ft sales list --status CONFIRMED --json --limit 100
ft sales list --status ABANDONED --json --limit 100
ft plans list --json                               # any memberships? (presales)
ft reports export buyers --json > buyers.json      # repurchase base (ADMIN role)
```

If a command returns `403`, the role is too low; if `404`, check `--workspace`. If
the user doesn't have `ft` yet, offer to install it (see `freeticket-cli` skill)
before stating any number. **Never invent metrics.**

## 2. Signals to compute

| Signal | How | What it reveals |
|---|---|---|
| **Conversion** | confirmed / (confirmed + abandoned) | Checkout/price friction. |
| **Abandon rate** | abandoned / total started | Payments that don't close. |
| **Sales pace** | confirmed per day vs. days to the date | Selling out or cold? |
| **Ticket mix** | sales per `ticketType` | Which tier sells, which doesn't. |
| **Sell-through** | sold / stock per type | Sold-out vs. stalled types. |
| **Presale weight** | sales in presale window / total | Strength of the community. |
| **Average ticket** | net revenue / number of sales | Room for upsell. |

Remember: money is integer + `currency`; FreeTicket keeps a **10%** service fee —
reason in **net** terms.

## 3. Diagnostic heuristics

- **High abandon (> ~40%):** perceived price too high, few payment methods, or
  unclear copy. Review `description`/`recommendations` and the price range.
- **Flat pace far from the date:** missing early push → enable a **member presale**
  or a limited "early bird" type.
- **One ticket type carries everything:** missing price ladder (general /
  preferred / VIP) to capture willingness to pay.
- **Low sell-through on the expensive type:** lower the VIP stock or add value
  (a perk, not just price).
- **No membership plans (`plans list` empty):** no community lever and no presales
  possible → recommend it as priority 1 if the goal is recurrence.
- **Visibility:** if an event isn't on the portal, verify that **event + date** are
  `PUBLISHED` and the date is **future** (the #1 cause of "not selling").

## 4. Deliverable

Always close with **3–5 prioritized recommendations**, each:
- tied to an observed number ("52% abandon over the last 30 days"),
- with a concrete product action (not "improve marketing"),
- and, when copy is involved, the suggested text in neutral Spanish (`language.md`).

Example:
> 1. **Conversion 48%** — checkout loses half. The description doesn't say what the
>    ticket includes. Suggested: «Incluye acceso general de pie + guardarropa».
> 2. **No presale** and you have 0 membership plans. Create a basic plan and open a
>    48h members-only presale before the general on-sale.
> 3. **VIP at 5% sell-through** — overpriced or undifferentiated. Add a meet & greet
>    or cut stock from 100 to 30.

## 5. Community levers (when the goal is recurrence)

| Lever | Signal that justifies it | Action |
|---|---|---|
| **Memberships (Stripe)** | low repurchase, no plans | Create a plan and communicate the perks. |
| **Exclusive presales** | community exists but isn't activated | Members-only window before the general on-sale. |
| **Content / Live (DRM)** | engagement drops between events | Member-gated VOD/streaming. |
| **Targeted repurchase** | large `buyers` base, unsegmented | Invite last show's buyers to the next one. |
