# Changelog

All notable changes to the `freeticket` plugin are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versioning: semver.

The skills in this plugin are instructions an agent executes, so a content
change can alter behavior as much as a code change would. That is what this
file is for.

## [Unreleased]

## [0.3.0] - 2026-10-20

### Changed
- **`freeticket-cli` now documents `ft` ≥ 0.11.1 against contract B2B 1.20.0 /
  admin 1.5.1** (was 0.10.0 against 1.7.0 / 1.3.0). New commands:
  `ft events cancel`, `ft sales attempts`, `ft tickets reassign`,
  `ft staff get|delete`, `ft webhooks update`, `ft settlements get`,
  `ft content-posts create` (plus the existing `content-*` reads, which the skill
  never listed), `ft workspace create`, `ft signup`, and
  `ft admin workspaces plan-show|delete`. Lists every command that asks for
  confirmation (`--yes` skips it), when the update notice stays quiet
  (`--json`/`--raw`/`--csv`, CI, no TTY, `FT_NO_UPDATE_CHECK=1`), and the
  `409`/`429` errors.
- **`freeticket-mcp` now documents `@freeticket/mcp` 0.15.0** (freeticket-mcp#27):
  117 tools (B2B 88, superadmin 23, public 6) against contracts 1.20.0 / 1.5.1 /
  0.9.1. New tools: `events_cancel`, `sales_attempts`, `tickets_reassign`,
  `staff_get`, `staff_delete`, `webhooks_update`, `settlements_get`,
  `content_posts_create`, `workspaces_create`, `customer_order_pending`,
  `customer_order_get`, `customer_order_release`, `admin_workspaces_plan_get`,
  `admin_workspaces_delete` (⚠ on `events_cancel`, `staff_delete`,
  `customer_order_release`, `admin_workspaces_delete`). `ticket_types_create`
  `currency` is `COP` only. "Not exposed" now lists sign-up, buyer auth and the
  headless checkout, and the MCP-vs-CLI table says `ft signup` has no tool.

### Fixed
- **Partial refunds were documented as `{"amount": …}`,** which the contract
  never accepted (`SaleRefundRequest` is `additionalProperties: false`, so it was
  a guaranteed 422). Contract 1.20 refunds per ticket: `{"items":[<sale item
  id>]}`, with `block_seats` to keep refunded numbered seats off sale.
- **`recommendations` was documented as a mandatory ticket field and does not
  exist.** The B2B contract has no such field on `TicketTypeCreate`, and
  `additionalProperties: false` means sending one fails with a 422. The
  what-the-attendee-should-know copy belongs at the end of the ticket
  `description`, which is the only copy field the schema has. Also corrected:
  `description` is optional in the schema (we still treat it as required by
  editorial policy, which is a different claim).
- **`ft api-keys create` example used `--name`,** which does not exist - the
  command takes the name as a positional argument.
- **Aligned the plugin description** between `plugin.json` and
  `.claude-plugin/plugin.json`, which had drifted apart.

### Added
- **`freeticket-cli`: several accounts, and "everything" as the default
  scope.** Documents `ft login --account`, `ft account list|use|clear|remove`,
  `--account <name>`, and that with nothing pinned every list and row-shaped
  report reads all accounts and all their workspaces (rows tagged `account` /
  `workspaceName`). Mutations need exactly one account when several are stored;
  `FT_API_KEY` stays a single CI account. Also reflects that login no longer
  pins the first workspace.
- **`scripts/validate-plugin.mjs`** - validates the repo against the
  [Agent Plugins specification](https://agent-plugins.org/specification) 1.0.0:
  the closed manifest schema, the `mcp.json` shape and transport types, skill
  discovery, and consistency between the spec manifests and Claude Code's own.
  Runs in CI on every push and pull request.
- **A warning that `sales create` / `sales_create` is not idempotent** in both
  the CLI and MCP skills. `POST /sales` takes no `Idempotency-Key`, so a blind
  retry after a timeout creates a second real sale. Tracked upstream as
  AppFreeticket/free-admin#677.

## [0.2.0]

Plugin distribution (Agent Plugins 1.0.0 + Claude Code marketplace), three
skills: `freeticket-cli`, `freeticket-mcp`, `freeticket-eventos`.

## [0.1.1]

First public release.
