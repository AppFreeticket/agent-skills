#!/usr/bin/env node
/**
 * Validates this repo against the Agent Plugins specification (1.0.0)
 * <https://agent-plugins.org/specification> and against Claude Code's own
 * plugin format, and checks that the two stay consistent with each other.
 *
 * Why this exists: the plugin conformed to the spec by hand, and nothing kept
 * it that way. There is no build step here, so a typo in a transport `type` or
 * a stray field in plugin.json would ship silently and only fail at install
 * time, in someone else's terminal. Run it in CI and before tagging.
 *
 * Usage: node scripts/validate-plugin.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const errors = [];
const warnings = [];

const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

// ── Agent Plugins 1.0.0: plugin.json ───────────────────────────────────────
// The manifest schema is CLOSED - these are the only permitted top-level keys.
const PLUGIN_KEYS = new Set([
  "$schema", "name", "version", "description", "author",
  "homepage", "repository", "license", "keywords", "extensions",
]);
const SPEC = "1.0.0";

const plugin = read("plugin.json");
if (plugin.$schema !== `https://agent-plugins.org/schemas/${SPEC}/plugin.schema.json`)
  fail(`plugin.json: $schema must be the ${SPEC} plugin schema, got ${plugin.$schema}`);
for (const k of Object.keys(plugin))
  if (!PLUGIN_KEYS.has(k)) fail(`plugin.json: "${k}" is not a permitted top-level field`);
if (!plugin.name) fail("plugin.json: name is required");
// 1-64 chars, lowercase alphanumeric + hyphen + period, alphanumeric at both
// ends, no consecutive hyphens or periods.
else if (
  !/^[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/.test(plugin.name) ||
  /--|\.\./.test(plugin.name)
)
  fail(`plugin.json: name "${plugin.name}" does not match the spec's format`);

// ── Agent Plugins 1.0.0: mcp.json ──────────────────────────────────────────
// Only $schema and mcpServers. An unknown field, an unknown `type`, or a field
// belonging to another transport variant makes the server entry invalid.
const TRANSPORTS = {
  stdio: { required: ["type", "command"], optional: ["args", "env", "cwd"] },
  "streamable-http": { required: ["type", "url"], optional: ["headers"] },
  sse: { required: ["type", "url"], optional: ["headers"] },
};

const mcp = read("mcp.json");
const mcpKeys = Object.keys(mcp).sort().join(",");
if (mcpKeys !== "$schema,mcpServers")
  fail(`mcp.json: top-level must be exactly $schema + mcpServers, got ${mcpKeys}`);
if (mcp.$schema !== `https://agent-plugins.org/schemas/${SPEC}/mcp.schema.json`)
  fail(`mcp.json: $schema must be the ${SPEC} mcp schema, got ${mcp.$schema}`);
// "When mcp.json is present, the version in its $schema value MUST match the
// version declared by plugin.json."
const ver = (u) => String(u).split("/schemas/")[1]?.split("/")[0];
if (ver(mcp.$schema) !== ver(plugin.$schema))
  fail(`mcp.json/plugin.json: schema versions differ (${ver(mcp.$schema)} vs ${ver(plugin.$schema)})`);

for (const [name, server] of Object.entries(mcp.mcpServers ?? {})) {
  const shape = TRANSPORTS[server.type];
  if (!shape) {
    fail(`mcp.json: server "${name}" has unknown type "${server.type}" (stdio | streamable-http | sse)`);
    continue;
  }
  if (server.type === "sse") warn(`mcp.json: server "${name}" uses the deprecated sse transport`);
  const allowed = new Set([...shape.required, ...shape.optional]);
  for (const k of Object.keys(server))
    if (!allowed.has(k)) fail(`mcp.json: server "${name}" has "${k}", which does not belong to ${server.type}`);
  for (const k of shape.required)
    if (server[k] === undefined) fail(`mcp.json: server "${name}" is missing required "${k}"`);
  if (shape.required.includes("url") && !/^https?:\/\//.test(server.url ?? ""))
    fail(`mcp.json: server "${name}" url must be an absolute http(s) URL`);
}

// ── Skills discovery ───────────────────────────────────────────────────────
// "Each immediate child directory containing a path named exactly SKILL.md
// that resolves to a regular file is treated as one skill."
let skills = [];
try {
  skills = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
} catch {
  fail("skills/: directory is missing");
}
if (skills.length === 0) warn("skills/: no skill directories found");
for (const s of skills) {
  const md = join(ROOT, "skills", s, "SKILL.md");
  try {
    if (!statSync(md).isFile()) throw new Error();
  } catch {
    fail(`skills/${s}: no SKILL.md, so this directory is not discovered as a skill`);
  }
}

// ── Cross-manifest consistency ─────────────────────────────────────────────
// Claude Code has its own plugin format under .claude-plugin/, which declares
// the same MCP server with its own spelling: `type: "http"` there is correct
// and is NOT the Agent Plugins `streamable-http`. Both are intentional. What
// must not drift is the identity: same name, same version, same URL.
let cc;
try {
  cc = read(".claude-plugin/plugin.json");
} catch {
  warn(".claude-plugin/plugin.json: not found, skipping cross-manifest checks");
}
if (cc) {
  if (cc.name !== plugin.name) fail(`name differs: plugin.json "${plugin.name}" vs .claude-plugin "${cc.name}"`);
  if (cc.version !== plugin.version) fail(`version differs: plugin.json "${plugin.version}" vs .claude-plugin "${cc.version}"`);
  if (cc.description !== plugin.description)
    warn("description differs between plugin.json and .claude-plugin/plugin.json - one of them will be the one people read");
  for (const [name, server] of Object.entries(cc.mcpServers ?? {})) {
    const mine = mcp.mcpServers?.[name];
    if (!mine) { fail(`server "${name}" is in .claude-plugin/plugin.json but not in mcp.json`); continue; }
    if (server.url !== mine.url) fail(`server "${name}" points at different URLs in the two manifests`);
    // Claude Code spells streamable HTTP as "http"; the spec calls it
    // "streamable-http". Same transport, two vocabularies - keep them paired.
    const paired = server.type === "http" && mine.type === "streamable-http";
    if (!paired && server.type !== mine.type)
      warn(`server "${name}": type "${server.type}" (Claude Code) / "${mine.type}" (spec) - check this pairing is deliberate`);
  }
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(
  errors.length
    ? `\n✗ ${errors.length} error(s) against Agent Plugins ${SPEC}`
    : `\n✓ conforms to Agent Plugins ${SPEC} — ${skills.length} skill(s), ${Object.keys(mcp.mcpServers ?? {}).length} MCP server(s)`,
);
process.exit(errors.length ? 1 : 0);
