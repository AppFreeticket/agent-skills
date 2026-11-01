# Tool inventory — `@freeticket/mcp` v0.15.0

134 tools, one per contract operation (B2B 105 · superadmin 23 · public 6).
Contracts: B2B `1.25.0` · superadmin `1.5.1` · public `0.9.1`. The lineup tools,
the dashboard-parity tools (schedule, presale windows, transfer, check-in undo,
courtesy recipient/seats) and `waitlist_list` (B2B 1.21–1.25) ship in the next
`@freeticket/mcp` release, once free-admin#1155, #1156 and #1157 are deployed. `?` marks an optional argument.
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
| `workspaces_create` | `name slug` — new workspace, the caller becomes its ADMIN. Plan quota applies; `409 ALREADY_HAS_ACCESS` if they are staff elsewhere. Ignores the pinned workspace |

### Events and dates

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `events_list` | `q? status? withTotal? limit? cursor? workspace?` | `status` filters in the query, so `limit` counts returned rows. `withTotal` adds `page.total` (opt-in: extra count query) |
| `events_get` | `id` | |
| `events_create` | `name slug description? venueId? dates` | `dates`: at least one `{startsAt, endsAt?, timezone}` |
| `events_update` | `id name? description? venueId? coverImageUrl? slug? squareImageUrl? storyImageUrl? pulepCode? listedOnPortal? genre? subgenre? genreOther? audience?` | `pulepCode` is required for performing arts with capacity over 400 (Colombia). `genreOther` only with `genre: "otro"` |
| `events_schedule` | `id publishAt? saleStartsAt?` | DRAFT only, **exactly one**: `publishAt` publishes it later (checked every ~5 min); `saleStartsAt` publishes **now** and opens sales later on every upcoming ticket type. 409 `EVENT_NOT_DRAFT` → re-read the event |
| `events_unschedule` | `id` | Clears a pending `publishAt`. Does not undo `saleStartsAt` (edit the ticket types) |
| `events_publish` | `id` | Makes it visible in the public catalogue |
| ⚠ `events_cancel` | `id` | Cancels the event and all its dates; keeps sales and tickets, refunds nothing (that is `sales_refund`). Idempotent |
| ⚠ `events_delete` | `id` | |
| ▣ `event_dates_list` | `eventId` | |
| `event_dates_create` | `eventId startsAt timezone? label? endsAt? doorsOpenAt? venueId? maxPerCustomer?` | `timezone` defaults to `America/Bogota`. `maxPerCustomer`: tickets one buyer can hold for that date (`null` = no cap) |
| `event_dates_update` | `eventId dateId startsAt? endsAt? doorsOpenAt? timezone? label? venueId? maxPerCustomer?` | |
| `event_dates_courtesy_seats` | `eventDateId` | Read-only. Blocked seats of a numbered date that can be issued as courtesies, by ticket type. 503 `SEATSIO_UNAVAILABLE` is retryable |
| ⚠ `event_dates_delete` | `eventId dateId` | |

#### Lineup and artist invitations

| Tool | Arguments | Notes |
|---|---|---|
| `artists_search` | `q limit? cursor?` | Read-only. Registered artists across FreeTicket (id, name, slug, logoUrl). `q` 2–100 chars. Use it to resolve names to ids before `events_artists_set` |
| ⚠ `events_artists_set` | `eventId artistIds inviteEmails?` | **Replaces** the whole lineup in order (send the full list; `[]` clears it). Idempotent. `inviteEmails` invites artists without an account (additive). Bad ids → `warnings[]` `ARTIST_IDS_IGNORED`. Max 50 ids / 20 emails, 20 changes/h. Confirm if it removes anyone |
| ⚠ `events_artists_remove` | `eventId organizationId` | Unlinks one artist, keeps the rest. Owner or the artist itself. Idempotent |
| ▣ `events_artist_invitations_list` | `eventId` | Read-only. PENDING/EXPIRED invitations, newest first |
| `events_artist_invitations_resend` | `eventId invitationId` | Renews 14 days, same link. **Sends an email on every call** (not idempotent; 3/h). 409 `INVITATION_ACCEPTED` if already joined |
| ⚠ `events_artist_invitations_cancel` | `eventId invitationId` | Deletes the invitation. Idempotent. 409 `INVITATION_ACCEPTED` → use `events_artists_remove` |

### Ticket types and tickets

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `ticket_types_list` | `eventDateId? limit? cursor? workspace?` | |
| `ticket_types_get` | `id` | |
| `ticket_types_create` | `eventDateId name description? price currency? capacity maxPerOrder isVisible organizerAbsorbsFee` | `currency` only `COP` (default) |
| `ticket_types_update` | `id name? description? price? currency? capacity? maxPerOrder? isVisible? organizerAbsorbsFee?` | Price and stock changes |
| ⚠ `ticket_types_delete` | `id` | |
| `tickets_access` | `code` | Read-only door check — does **not** admit |
| `tickets_checkin` | `code` | Admits at the door, idempotent |
| ⚠ `tickets_checkin_undo` | `code` | Undoes a wrong scan so the ticket is valid again. ADMIN. Idempotent (`undone: false` if it was not checked in). 409 `CHECKIN_CHANGED` → re-read with `tickets_access` and retry |
| `tickets_resend` | `code` | Re-issues the QR by email |
| `tickets_reassign` | `code eventDateId? ticketTypeId? seatLabel?` | Moves a sold ticket to another date and/or type (postponements), at least one of the two ids. No refund, no resale |
| ▣ `presale_windows_list` | `ticketTypeId` | Read-only. Membership presale windows of a ticket type |
| `presale_windows_create` | `ticketTypeId planId presaleStartsAt presaleEndsAt presaleCapacity? isActive?` | Only plans of the workspace that owns the event (422 `PLAN_NOT_ELIGIBLE`); one window per plan (409 `DUPLICATE_PLAN` → update it instead) |
| `presale_windows_update` | `id planId? presaleStartsAt? presaleEndsAt? presaleCapacity? isActive?` | Absent fields untouched. 422 `PRESALE_WINDOW_INVERTED` if end ≤ start |
| ⚠ `presale_windows_delete` | `id` | Members lose that presale access immediately |

### Sales

| Tool | Arguments | Notes |
|---|---|---|
| ▣ `sales_list` | `status? channel? event? eventDate? reference? buyer? from? to? limit? cursor? workspace?` | |
| `sales_get` | `id` | |
| `sales_tickets` | `id` | Individual tickets/attendees of a sale |
| `sales_attempts` | `id` | Payment attempt history, newest first (approved, declined, refunded): why a sale did not go through |
| `sales_create` | `buyer items channel comp notes?` | Comps and programmatic orders — **not idempotent, see below** |
| ⚠ `sales_cancel` | `id acknowledge_open_payment?` | The flag is required when the payment is still open at the gateway |
| ⚠ `sales_refund` | `id acknowledge_manual?` | The flag confirms the money goes back by hand, outside the gateway |
| ⚠ `sales_transfer` | `saleId itemId email` | Moves one ticket to a **registered** buyer and voids the old QR. Once per ticket, until the show starts. **Not idempotent**: 409 `ALREADY_TRANSFERRED` on a retry means it went through. 422 `RECIPIENT_NOT_REGISTERED` / `SELF_TRANSFER` → ask for another email. 409 `CONFLICT` → re-read and retry |
| ⚠ `sales_recipient_update` | `saleId name email` | Dashboard courtesies only (other sales → 404). Resends the tickets; a new email voids the QRs already sent (`ticketCodesRotated: true`) |

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
| ▣ `waitlist_list` | `city? limit? cursor?` | Read-only, ADMIN (personal data). The enterprise landing's per-city waitlist |
| ▣ `webhooks_list` | `limit? cursor? workspace?` | |
| `webhooks_create` | `url events secret?` | HMAC-signed delivery |
| `webhooks_update` | `id url? events? active?` | Keeps the signing secret (delete + create would rotate it). `events`: `sale.confirmed\|sale.refunded` |
| ⚠ `webhooks_delete` | `id` | |
| ▣ `venues_list` | `limit? cursor? workspace?` | |
| `venues_get` | `id` | |
| `venues_create` | `name address city country capacity? latitude? longitude?` | |
| `venues_update` | `id name? address? city? country? capacity? latitude? longitude? portalVisible?` | |
| ⚠ `venues_delete` | `id` | |
| ▣ `staff_list` | `limit? cursor? workspace?` | The only list where `workspace` is resolved **by the contract** (`workspaceIds`, max 25) instead of a client-side fan-out: one call, rows tagged by the backend |
| `staff_get` | `id` | |
| `staff_create` | `name email` | |
| `staff_update_role` | `id role` | |
| ⚠ `staff_delete` | `id` | Revokes access to this workspace only and ends their sessions; the account and its history stay |

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
| `settlements_get` | `id` | One settlement |
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
| ⚠ `customer_subscription_cancel` | `workspaceId? customerSession` | Cancels the buyer's own membership (`workspaceId` picks which one, only without an enterprise key) |
| `customer_order_pending` | `eventDateId? customerSession` | The buyer's PENDING order with a live hold (seats, total, expiry), or `order: null` — resume instead of starting over |
| `customer_order_get` | `id customerSession` | `approved\|pending\|rejected`; `tickets` only once approved |
| ⚠ `customer_order_release` | `id customerSession` | Abandons the PENDING order and returns stock and seats. `409 payment_in_flight` if a payment already started |
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
| `content_posts_create` | `type content? imageUrl? title? subtitle? slug? body? locked eventId? publishedAt?` | `type` `TEXT\|IMAGE\|ARTICLE`; ARTICLE needs `title` + Markdown `body`, TEXT/IMAGE need `content` or `imageUrl`. `locked: true` = members only |
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
| `admin_workspaces_plan_get` | `id` | Current plan (`planSlug`/`planName`, null if none) and `stripeLinked` — check before `assign_plan` |
| ⚠ `admin_workspaces_delete` | `id` | Soft delete (`deletedAt`; sales and buyers stay). Must be suspended first; `409` with a CONFIRMED sale. Does not cancel Stripe |
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
| `POST /auth/signup`, `POST /customer/auth/request`, `POST /customer/auth/verify` | Account and buyer-session bootstrap: the MCP gets its credentials from its own consent page. Sign-up is `ft signup` in the CLI |
| `POST /customer/purchase-sessions…`, `POST /customer/orders`, `POST /customer/orders/{id}/payment…` | Headless checkout of an enterprise landing page: every step needs a browser (seat map hold, payment widget, allowlisted `returnUrl`). An agent buys through `public_orders_create`; the `customer_order_*` reads and release do exist |

A guard test in the server (`src/coverage.test.ts`) fails if the contract grows a
new operation and nobody gives it a tool, so this list stays honest.

> **`sales_create` is not idempotent.** `POST /sales` takes no `Idempotency-Key`
> (unlike `public_orders_create` and check-in), so a blind retry after a network
> timeout creates a **second real sale or comp**. Before retrying, confirm with
> `sales_list` filtered by `buyer` or `reference` whether the first one landed.
> Tracked upstream as AppFreeticket/free-admin#677.
