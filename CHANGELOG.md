# Changelog

All notable changes to the `freeticket` plugin are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versioning: semver.

The skills in this plugin are instructions an agent executes, so a content
change can alter behavior as much as a code change would. That is what this
file is for.

## [Unreleased]

### Fixed
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
