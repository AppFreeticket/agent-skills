# Tool inventory — `@freeticket/mcp` v0.14.0

103 tools, one per contract operation (B2B 76 · superadmin 21 · public 6).
Contracts: B2B `1.7.0` · superadmin `1.3.0` · public `0.4.0`. `?` marks an optional argument.
**▣** = renders through the MCP Apps view (table or KPI tiles in the host).
**⚠** = `destructiveHint`: confirm with the human and quote what will be
affected before calling.

Every B2B list also accepts `workspace` (`"all"` or an array of ids) to
aggregate across workspaces; rows come back tagged with `workspaceId` /
`workspaceName`. Lists page with `limit` (1–100, default 20) and `cursor`.

---

## Public B2C — `/api/public` (no credentials, always available)

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `public_events_list` | `q? city? from? to? page? pageSize? sort?` | Published catalogue. `sort`: `date_asc\|price_asc\|price_desc` |
| `public_events_get` | `slug` | Public event detail |
| `public_events_availability` | `slug` | Dates, ticket types, prices, live stock |
| `public_orders_create` | `buyerEmail buyerName buyerPhone? items` | Returns `checkoutUrl` (Mercado Pago). Idempotency key generated for you. General admission only |
| `public_orders_get` | `id` | `pending\|paid\|expired\|cancelled` + tickets once paid |
| `public_tickets_resend` | `code email?` | Resends the QR to the buyer's own address, rate-limited |

The agent never touches payment data: hand the human the `checkoutUrl`.

---

## B2B `/api/v1` — needs an API key or an `ft login` session

### Session

| Tool | Arguments |
|---|---|
| `whoami` | — — user + accessible workspaces, each with the **effective role and enabled sections** in that workspace (`sections: null` = unrestricted, `[]` = expired or revoked). The top-level `role` is deprecated |

### Events and dates

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `events_list` | `q? status? withTotal? limit? cursor? workspace?` | `status` filters in the query, so `limit` counts returned rows. `withTotal` adds `page.total` (opt-in: extra count query) |
| `events_get` | `id` | |
| `events_create` | `name slug description? venueId? dates` | `dates`: at least one `{startsAt, endsAt?, timezone}` |
| `events_update` | `id name? description? venueId? coverImageUrl?` | |
| `events_publish` | `id` | Makes it visible in the public catalogue |
| ⚠ `events_delete` | `id` | |
| ▣ `event_dates_list` | `eventId` | |
| `event_dates_create` | `eventId startsAt timezone? label? endsAt? doorsOpenAt? venueId?` | `timezone` defaults to `America/Bogota` |
| `event_dates_update` | `eventId dateId startsAt? endsAt? doorsOpenAt? timezone? label? venueId?` | |
| ⚠ `event_dates_delete` | `eventId dateId` | |

### Ticket types and tickets

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `ticket_types_list` | `eventDateId? limit? cursor? workspace?` | |
| `ticket_types_get` | `id` | |
| `ticket_types_create` | `eventDateId name description? price currency capacity maxPerOrder isVisible organizerAbsorbsFee` | |
| `ticket_types_update` | `id name? description? price? currency? capacity? maxPerOrder? isVisible? organizerAbsorbsFee?` | Price and stock changes |
| ⚠ `ticket_types_delete` | `id` | |
| `tickets_access` | `code` | Read-only door check — does **not** admit |
| `tickets_checkin` | `code` | Admits at the door, idempotent |
| `tickets_resend` | `code` | Re-issues the QR by email |

### Sales

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `sales_list` | `status? channel? event? eventDate? reference? buyer? from? to? limit? cursor? workspace?` | |
| `sales_get` | `id` | |
| `sales_tickets` | `id` | Individual tickets/attendees of a sale |
| `sales_create` | `buyer items channel comp notes?` | Comps and programmatic orders — **not idempotent, see below** |
| ⚠ `sales_cancel` | `id acknowledge_open_payment?` | The flag is required when the payment is still open at the gateway |
| ⚠ `sales_refund` | `id acknowledge_manual?` | The flag confirms the money goes back by hand, outside the gateway |

### Memberships

| Tool | Arguments |
|---|---|
| ▣ `plans_list` | `limit? cursor? workspace?` |
| `plans_get` | `id` |
| `plans_subscribers` | `id` |
| `plans_create` | `name description? price currency billingCycle benefitPresale benefitFreeTicket benefitDiscount benefitExclusiveContent benefitMerch isActive sortOrder?` |
| `plans_update` | `id` + any of the above |
| ⚠ `plans_delete` | `id` |
| ⚠ `subscriptions_cancel` | `id` |

`billingCycle`: `MONTHLY\|QUARTERLY\|ANNUAL\|LIFETIME`.

### Commercial

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `discounts_list` | `event? active? limit? cursor? workspace?` | |
| `discounts_create` | `code type value eventId? maxUses? startsAt? endsAt?` | |
| `discounts_update` | `id active? value? maxUses? startsAt? endsAt?` | |
| ⚠ `discounts_delete` | `id` | |
| ▣ `webhooks_list` | `limit? cursor? workspace?` | |
| `webhooks_create` | `url events secret?` | HMAC-signed delivery |
| ⚠ `webhooks_delete` | `id` | |
| ▣ `venues_list` | `limit? cursor? workspace?` | |
| `venues_get` | `id` | |
| `venues_create` | `name address city country capacity? latitude? longitude?` | |
| `venues_update` | `id name? address? city? country? capacity? latitude? longitude? portalVisible?` | |
| ⚠ `venues_delete` | `id` | |
| ▣ `staff_list` | `limit? cursor? workspace?` | The only list where `workspace` is resolved **by the contract** (`workspaceIds`, max 25) instead of a client-side fan-out: one call, rows tagged by the backend |
| `staff_create` | `name email` | |
| `staff_update_role` | `id role` | |

### Reports and money

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `reports_summary` | `period?` | `7d\|30d\|90d\|1y` |
| ▣ `reports_by_event` | `from? to? status?` | Revenue / tickets / availability per event |
| ▣ `reports_timeseries` | `interval from? to? event?` | `interval`: `day\|week\|month` |
| ▣ `reports_inventory` | `eventId? eventDateId? from? to? includeDrafts? groupBy?` | Capacity / sold / reserved / available. `groupBy`: `ticketType\|date\|event` |
| ▣ `reports_financials` | `event? past?` | Per-function P&L: gross, platform fee, facial value, gateway fee, 4x1000, net to settle. **These are the authoritative numbers** — do not recompute them from `sales_list` |
| ▣ `reconciliation` | `date_from date_to match_status? provider? page? page_size?` | CFO view: sale ↔ Mercado Pago ↔ Siigo invoice. `match_status`: `OK\|MISSING_INVOICE\|MISSING_CUFE\|AMOUNT_MISMATCH\|MISSING_PAYMENT` |
| ▣ `settlements_list` | `event? status? limit? cursor?` | What FreeTicket pays the organizer. `status`: `SENT\|AWAITING_PAYMENT\|PAID`. Carries `hasDocument` and the file names |
| `settlements_document` | `id` | **Signed URL** for the receipt PDF, 5 minutes TTL. Returns the link, not the file: the API answers 302 and following it would drop a whole PDF into the context |
| `settlements_proof` | `id fileName` | Same, for a payment proof. File names come from `settlements_list` |
| `reports_export_buyers` | `event? eventDate? from? to? status?` | One row per sale |
| `reports_export_attendees` | `event? eventDate? from? to? status?` | One row per ticket |
| `reports_export_subscribers` | — | |
| `reports_export_reconciliation` | `date_from date_to match_status? provider?` | |

### Credentials (read-only by design)

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `api_keys_list` | `limit? cursor?` | Audit which service keys exist and when they were used. Never returns the secret. Minting and revoking are CLI-only (`ft api-keys`) |

### Members area — headless SSO (enterprise integrations)

All of these require an **enterprise service API key** *and* the buyer's session
token from the headless SSO exchange. With a normal workspace key the API
returns 403. They speak for the buyer, not for the workspace: same surface the
members area of the website has.

| Tool | Arguments | Notes |
|---|---|---|
| `customer_me` | `customerSession` | Identity + session expiry |
| ▣ `customer_tickets` | `customerSession limit? cursor?` | Only CONFIRMED sales inside the key's scope |
| `customer_ticket_get` | `id customerSession` | Ticket detail — deep link from the list |
| ▣ `customer_membership` | `customerSession` | Plan, validity, and whether member-only content is unlocked |
| `customer_profile` | `customerSession` | Name and phone |
| ⚠ `customer_ticket_cancel` | `id customerSession` | The buyer cancels their own purchase, only while unpaid |
| `customer_subscribe` | `planId customerSession` | Returns the payment URL — the agent never charges |
| ⚠ `customer_subscription_cancel` | `customerSession` | Cancels the buyer's own membership |
| `customer_profile_update` | `name? phone? customerSession` | `phone` null or empty clears it |
| `customer_logout` | `customerSession` | Ends the headless SSO session |

### Content (videos, community feed, live streams)

Workspace API key only — the listings show published content. They never carry
the playback id: to play something, mint a token.

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `content_videos` | `limit? cursor?` | Published and READY only |
| ▣ `content_posts` | `limit? cursor?` | Community feed |
| ▣ `content_lives` | `limit? cursor?` | Live streams with their state |
| `content_live_get` | `id` | State of one stream |
| `content_playback_token` | `kind id customerSession?` | Signed token: 30 min live, 1 h video. `memberOnly` content also needs a buyer session with an active membership (otherwise 403 `MEMBERSHIP_REQUIRED`) |

---

## Superadmin `/api/admin` — needs `FT_ADMIN_SESSION`

Cross-tenant. Everything here affects other people's workspaces.

| Tool | Arguments | Notes |
|---|---|---|
| `admin_whoami` | — | |
| ▣ `admin_audit_log` | `action? from? to? limit? cursor?` | |
| ▣ `admin_tokens` | — | Platform PATs; minting/revoking is CLI-only (`ft admin tokens`) |
| ▣ `admin_workspaces` | `q? status? limit? cursor?` | |
| `admin_workspaces_get` | `id` | |
| `admin_workspaces_create` | `name slug type country email?` | `type`: `ARTIST\|VENUE\|ORGANIZER` |
| `admin_workspaces_update` | `id name? slug? type? isPublished? webTemplate? customDomain? customDomainVerifiedAt?` | Website template and custom domain of the tenant; `null` on either one unlinks it |
| ⚠ `admin_workspaces_assign_plan` | `id planSlug` | Assisted sale: activates `spark\|star\|icon\|legend` without Stripe self-service. A linked Stripe subscription is cancelled there first; if that fails the API aborts with 409 and touches nothing |
| ⚠ `admin_workspaces_suspend` | `id` | |
| `admin_workspaces_restore` | `id` | |
| ▣ `admin_users` | `q? role? limit? cursor?` | |
| `admin_users_get` | `id` | |
| `admin_users_update` | `id role? banned?` | `role`: `SUPER_ADMIN\|ADMIN\|STAFF\|VIEWER\|MINCULTURA` |
| ⚠ `admin_impersonate` | `targetUserId? workspaceId?` | Returns a token |
| `admin_impersonate_stop` | — | |
| ▣ `admin_platform_plans_list` | — | |
| `admin_platform_plans_get` | `id` | |
| `admin_platform_plans_create` | `name slug priceMonthly priceYearly priceBiannual? isActive maxEvents?` + feature flags | `maxEvents: null` = unlimited |
| `admin_platform_plans_update` | `id` + any of the above, `sortOrder?` | |
| ▣ `admin_feature_flags_list` | `key?` | |
| `admin_feature_flags_set` | `key scope scopeId? enabled` | |

---

## Not exposed, on purpose

| Operation | Why |
|---|---|
| `POST /auth/device/code`, `POST /auth/device/token` | Device-flow mechanics — driven by the server's own authorization server, not by an agent |
| `POST /api-keys`, `DELETE /api-keys/{id}` | Minting and revoking credentials belongs in the CLI, with a human at the keyboard |
| `POST /tokens`, `DELETE /tokens/{id}` | Same, for platform PATs |
| `POST /api/customer-auth/enterprise-exchange` | Mints third-party buyer sessions — server-to-server between free-admin and the integrator |

A guard test in the server (`src/coverage.test.ts`) fails if the contract grows a
new operation and nobody gives it a tool, so this list stays honest.

> **`sales_create` is not idempotent.** `POST /sales` takes no `Idempotency-Key`
> (unlike `public_orders_create` and check-in), so a blind retry after a network
> timeout creates a **second real sale or comp**. Before retrying, confirm with
> `sales_list` filtered by `buyer` or `reference` whether the first one landed.
> Tracked upstream as AppFreeticket/free-admin#677.
