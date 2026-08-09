# Tool inventory — `@freeticket/mcp` v0.13.0

87 tools, one per contract operation. `?` marks an optional argument.
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
| `whoami` | — — user + accessible workspaces |

### Events and dates

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `events_list` | `limit? cursor? workspace?` | |
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
| `sales_create` | `buyer items channel comp notes?` | Comps and programmatic orders |
| ⚠ `sales_cancel` | `id` | |
| ⚠ `sales_refund` | `id` | |

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
| ▣ `staff_list` | `limit? cursor? workspace?` | |
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
| ▣ `settlements_list` | `event? status? limit? cursor?` | What FreeTicket pays the organizer. `status`: `SENT\|AWAITING_PAYMENT\|PAID`. The receipt PDF is downloaded from the panel — the API carries `hasDocument` and filenames, not a URL |
| `reports_export_buyers` | `event? eventDate? from? to? status?` | One row per sale |
| `reports_export_attendees` | `event? eventDate? from? to? status?` | One row per ticket |
| `reports_export_subscribers` | — | |
| `reports_export_reconciliation` | `date_from date_to match_status? provider?` | |

### Credentials (read-only by design)

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `api_keys_list` | `limit? cursor?` | Audit which service keys exist and when they were used. Never returns the secret. Minting and revoking are CLI-only (`ft api-keys`) |

### Headless SSO (enterprise integrations)

Both require an **enterprise service API key** *and* the buyer's session token
from the headless SSO exchange. With a normal workspace key the API returns 403.

| Tool | Arguments |
|---|---|
| `customer_me` | `customerSession` |
| ▣ `customer_tickets` | `customerSession limit? cursor?` |

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
| `admin_workspaces_update` | `id name? slug? type? isPublished?` | |
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
