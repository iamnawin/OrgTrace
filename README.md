# OrgTrace

**Salesforce metadata dependency & change-impact intelligence.**

OrgTrace finds where a Salesforce component (Apex class, field, Flow, LWC, permission set…) is used across a project, scores the risk of changing it, and produces a human-readable impact report — **fully local, no AI, no org connection required in Phase 1**.

---

## Why

Before you change a field or refactor a class, you need to know what breaks. Salesforce's own dependency tooling is incomplete and org-bound. OrgTrace scans your source locally and answers *"what depends on this?"* in seconds, inside the tools you already use.

## Surfaces

| Surface | Phase | Audience | Status |
|---|---|---|---|
| `apps/ide-extension` | 1A | Developers | In progress |
| `apps/cli` | 1A | Developers / CI | In progress |
| `apps/browser-extension` | 1B | Admins / Architects | Placeholder |

All surfaces share one reusable TypeScript core.

### IDE extension (current)

Run **OrgTrace: Analyze Component** from the command palette in a Salesforce project:

1. Type a partial component name to search.
2. Pick the exact component from the type-grouped list (or analyze the raw name if there's no match).
3. Review the dependency/risk report in the panel, then export it as Markdown.

## Architecture

This is a **pnpm + Turborepo monorepo** built on a shared-core-library pattern.

```
packages/
  core/            @orgtrace/core           Types, RiskEngine, MetadataRegistry (zero IDE/Node deps)
  scanner/         @orgtrace/scanner        Local SFDX filesystem scan (Node-only)
  salesforce-api/  @orgtrace/salesforce-api Phase 2 placeholder (Tooling/Metadata API)
apps/
  ide-extension/   VS Code first, IDE-agnostic design
  cli/             Headless scanning for terminals & CI
  browser-extension/ Phase 1B placeholder
```

### Hard architectural rules

- `@orgtrace/core` and `@orgtrace/scanner` **never** import IDE APIs. Only `apps/ide-extension` depends on VS Code.
- `apps/browser-extension` **never** depends on `@orgtrace/scanner`.
- Risk is **not** calculated in the scanner. The scanner returns raw references/dependencies; `@orgtrace/core`'s `RiskEngine` scores them afterward.
- The webview **never** runs scanner logic — it sends typed intents to the host and renders results.

### Phase 1 constraints

- **No Salesforce API connection.**
- **No AI.**
- **No source code leaves the machine** unless the user explicitly enables a future cloud/AI mode.
- Salesforce auth (Phase 2) will rely on Salesforce CLI / OAuth best practices — **never stored passwords**.

## How it works

1. **Search & pick** — type a partial name; `discoverComponents` finds matching metadata (ignoring spaces, underscores, and casing) and the IDE presents a QuickPick grouped by metadata type, ordered for impact analysis (Flow → Apex Class → Field → Object → LWC → Permission Set → Validation Rule). Fields are qualified by their owning object (e.g. `Case.Account_Alert_Message__c`). No match falls back to analyzing the raw API name.
2. **Scan** — `@orgtrace/scanner` walks the SFDX project, routing each file through a `FileParser` registry (regex for Apex/LWC, XML parsing for Flow/Object/Field/PermissionSet). Qualified field targets still match both qualified and bare references in source.
3. **Normalize** — every parser emits the same `DependencyReference` contract from `@orgtrace/core`.
4. **Score** — `RiskEngine` applies confidence-weighted, rule-based scoring (0–100) and returns transparent `reasons[]` + `recommendations[]`.
5. **Report** — surfaces render the `DependencyResult` and can export Markdown.

## Develop

```bash
pnpm install
pnpm build      # turbo build across all packages
pnpm dev        # watch mode
pnpm test
pnpm lint
```

## License

TBD.
