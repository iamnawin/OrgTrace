# Repository Guidelines

## Project Structure & Module Organization

OrgTrace is a pnpm + Turborepo TypeScript monorepo. Shared libraries live in `packages/`: `core` contains common contracts, `RiskEngine`, and `MetadataRegistry`; `scanner` contains local SFDX filesystem scanning and parsers; `salesforce-api` is the Phase 2 API integration placeholder. App surfaces live in `apps/`, with `apps/ide-extension` providing the VS Code companion extension. Product notes and source documents are in `Docs/`.

Keep architectural boundaries intact: `@orgtrace/core` and `@orgtrace/scanner` must not import IDE APIs, scanner code should emit raw dependency references, and risk scoring belongs in `@orgtrace/core`.

## Build, Test, and Development Commands

Use Node `>=18` and pnpm `>=9`.

- `pnpm install` installs workspace dependencies.
- `pnpm build` runs `turbo run build` and produces package `dist/` outputs.
- `pnpm dev` starts Turbo watch tasks where packages define them.
- `pnpm test` runs package test scripts through Turbo.
- `pnpm lint` runs TypeScript checking via `tsc --noEmit`.
- `pnpm clean` removes build outputs and root `node_modules`.

For one package, use pnpm filters, for example `pnpm --filter @orgtrace/scanner test`.

## Coding Style & Naming Conventions

Write strict TypeScript targeting ES2020. The base config enables `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`, and casing checks; do not weaken these for convenience. Follow existing style: two-space indentation, semicolons, single quotes, named exports for shared contracts, and PascalCase for classes/types such as `RiskEngine` or `ComponentRef`. Parser files use descriptive camelCase names such as `apexParser.ts`.

## Testing Guidelines

Library packages are configured for Vitest (`vitest run`). Place tests near the code they cover as `*.test.ts` or in a package-local test directory, and prioritize parser fixtures, risk scoring behavior, and package boundary regressions. Run `pnpm test` before merging; run `pnpm lint` when changing types or public contracts.

## Commit & Pull Request Guidelines

The current history uses concise conventional-style prefixes, for example `chore: initialize repository with README and gitignore`. For agent-authored commits, follow the repository Lore protocol: start with the intent, then add useful trailers such as `Constraint:`, `Rejected:`, `Confidence:`, `Scope-risk:`, `Tested:`, and `Not-tested:`.

Pull requests should describe the user-facing change, touched packages, verification commands, and known gaps. Include screenshots or short recordings for IDE/webview UI changes, and link related issues or design notes when available.

## Security & Configuration Tips

Phase 1 must remain local-only: no Salesforce API connection, no AI calls, and no source upload. Future auth work should rely on Salesforce CLI or OAuth flows and must not store passwords.
