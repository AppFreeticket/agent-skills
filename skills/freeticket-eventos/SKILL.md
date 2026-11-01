---
name: freeticket-eventos
description: FreeTicket advisor for creating, writing and auditing events, and for growing an organizer/artist's community. It applies FreeTicket's brand voice (buyer-facing copy is written in neutral Spanish — tú/impersonal, never voseo, since the audience is LATAM), the real product rules (visibility, member-gated presales, platform fee, time zone, ticket copy) and, using live data pulled with the `ft` CLI, audits event performance and recommends concrete improvements to copy, price, presales and community retention. Use it when the user wants to create or improve an event, write its copy, find out why an event isn't selling, or ask for recommendations to grow and retain their audience.
---

# FreeTicket — events and community

This skill turns the agent into a FreeTicket advisor: it knows **how to write** an
event in the brand voice, **what rules** make it visible and sellable, and **how
to audit it** with real data (via the `ft` CLI) to recommend sales and community
improvements.

> **Output language:** FreeTicket is a LATAM (Colombia-first) ticketing platform.
> These instructions are in English for global reuse, but **all buyer-facing copy
> the agent produces must be in neutral Spanish** (see `references/language.md`).
> That is a hard product rule, not a preference.

## When to use this skill

- Create a new event or improve an existing one (title, description, prices, dates).
- Write or fix public-facing copy following FreeTicket's voice.
- Audit why an event isn't selling, or how overall performance is going.
- Recommend actions to grow and retain the community (memberships, presales, content).

To pull real data use the `freeticket-cli` skill (binary `ft`). This skill assumes
the agent can run `ft ... --json`.

## Product rules (non-negotiable)

Before recommending anything, respect how FreeTicket actually works:

1. **Brand voice:** all buyer-facing copy is **Spanish** (tú / impersonal).
   **Never voseo** ("creá/iniciá" ❌ → "crea/inicia" ✅). No tech jargon. Two
   registers — marketing (jester/explorer attitude) vs product (clear, warm) —
   full voice system and templates in `references/language.md`.
2. **B2C portal visibility:** an event is only public if the **event is `PUBLISHED`**
   and it has **at least one `PUBLISHED`, future date**. Publishing the event must
   propagate the status to its dates.
3. **Ticket copy:** `description` is the only copy field the B2B contract has for
   a ticket type, and it is **optional** in the schema - but a ticket with an empty
   description sells worse, so treat it as required by editorial policy, not by the
   API. Put what the ticket includes *and* what the attendee should know (arrive
   early, bring ID, age limit) in that one field: there is no separate
   `recommendations` field in the contract, and sending one fails with a 422
   because `TicketTypeCreate` is `additionalProperties: false`.
4. **Member-gated presales:** presales are **members-only**. The portal shows a
   countdown + membership CTA. A workspace with no membership plans **cannot**
   enable presales — create a plan first. A presale is a **window per plan and
   ticket type** (`ft presale-windows create <ticketTypeId> --plan … --starts-at
   … --ends-at …`, MCP `presale_windows_create`): only active plans of the
   workspace that owns the event (422 `PLAN_NOT_ELIGIBLE`), one window per plan
   (409 `DUPLICATE_PLAN` → update the existing one), end after start.
5. **Platform fee:** FreeTicket charges a **10%** service fee on every sale (always,
   FreeTicket revenue). "Absorbing" the fee only changes who pays it, not whether it
   exists. Reason about prices in net terms.
6. **Time zone:** each date has its IANA `timezone`. The public sees local wall-clock
   time, not raw UTC. Don't promise a time without fixing the zone.
7. **PULEP (Colombia):** performing-arts events with **capacity over 400** need
   a PULEP code (`pulepCode` in `events update --data`). Ask for it before
   publishing a show of that size.
8. **Per-buyer cap:** `maxPerCustomer` on a date limits how many tickets one
   buyer can hold for it (`null` = no cap). Suggest it for high-demand drops.

## Recommended flow

**To create / improve an event (no data):**
1. Ask the minimum: event type, audience, date + zone, venue, price range.
2. Write title + description per `references/language.md` (in Spanish) - the
   what-to-know copy goes at the end of the ticket description, not in a field of
   its own.
3. Define ticket types with coherent net pricing (remember the 10%).
4. Set the lineup (see below) if the event has artists.
5. Publish checklist: event + date `PUBLISHED` and future, fields complete.
6. To publish later instead of now, schedule the DRAFT with **exactly one** of:
   `ft events schedule set <eventId> --publish-at <iso>` (goes public at that
   instant) or `--sale-starts-at <iso>` (public **now**, sales open at that
   instant — the "coming soon" countdown). MCP: `events_schedule`. Undo a
   pending `publishAt` with `ft events schedule clear` / `events_unschedule`.
   409 `EVENT_NOT_DRAFT`: re-read the event (it was published meanwhile).

**Ticket fixes after the sale (ADMIN key with `write` scope; every one asks for
confirmation, `--yes` in scripts):**
- Transfer a ticket to someone else: `ft sales transfer <saleId> <itemId>
  --email <e>` (MCP `sales_transfer`). The recipient needs a verified buyer
  account; on 422 `RECIPIENT_NOT_REGISTERED` ask the user for the right email
  (or to have the person sign up). Once per ticket, voids the old QR, not
  retryable: 409 `ALREADY_TRANSFERRED` means it already went through.
- Wrong door scan: `ft tickets checkin-undo <code>` (MCP
  `tickets_checkin_undo`). On 409 `CHECKIN_CHANGED`, re-read the ticket and
  retry once.
- Courtesy sent to the wrong person: `ft sales recipient set <saleId> --name …
  --email …` (MCP `sales_recipient_update`); a new email voids the QRs already
  sent. For numbered events, `ft event-dates courtesy-seats <dateId>` lists the
  blocked seats available for courtesies.

**To set the lineup (who performs):**
1. Resolve every artist name to an id: `ft artists search "<name>" --json`
   (MCP: `artists_search`). It searches all registered artists on FreeTicket,
   not just the user's workspaces. Confirm ambiguous matches with the user.
2. Send the **full lineup in display order** in one call:
   `ft events artists set <eventId> --artist <id1> <id2> …` (MCP:
   `events_artists_set` with `artistIds`). It replaces, it doesn't append:
   anyone left out is unlinked, so read the current `artists` of the event
   first and confirm with the user before removing anyone. To drop just one
   artist use `ft events artists remove` / `events_artists_remove`.
3. Artists with no FreeTicket account: add their emails with `--invite`
   (MCP: `inviteEmails`). They get an invitation and are linked when they sign
   up. If the response carries `ARTIST_IDS_IGNORED`, tell the user which ids
   were skipped instead of retrying.
4. Follow up invitations with `ft events invitations list <eventId>`
   (MCP: `events_artist_invitations_list`); `resend` sends a new email each
   time (don't loop it), `cancel` revokes a link sent by mistake.

**To audit an event or the account (with data):**
1. Pull data with `ft` (see `references/audit.md`):
   `ft reports summary --json`, `ft events list --json`, `ft sales list --json`.
2. Compute signals: conversion, sales pace vs. date, ticket mix, confirmed vs.
   abandoned, presale/membership weight.
3. Diagnose with the heuristics in `references/audit.md`.
4. Deliver **3–5 prioritized, actionable recommendations** (not generic), each
   tied to an observed number.

## Growing the community

FreeTicket isn't only one-off sales: the goal is a **recurring community**. Real
product levers to recommend when they fit:

- **Fan memberships** (billed with Stripe): presale access, perks.
- **Exclusive presales** for members before the general on-sale.
- **Content & Live** (VOD/streaming with DRM) member-gated for retention.
- **Repurchase:** segment buyers (export `buyers`) and invite them to the next show.

How to measure and act on each lever: `references/audit.md`.

## What NOT to do

- Don't invent metrics: if you didn't run `ft`, say so and ask to pull them.
- Don't use voseo or tech jargon in buyer-facing copy.
- Don't promise visibility if the event/date don't meet the rules above.
- Don't ignore the 10% when suggesting "round" prices.
