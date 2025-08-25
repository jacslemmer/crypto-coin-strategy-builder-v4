# V3 Review Checklist (Mandatory)

Use this checklist for every PR review. If any item fails, request changes.

## Functional Programming Compliance
- Code is pure-functional by default; effects are isolated at the boundaries (I/O, network, time, randomness).
- No classes or shared mutable state unless an approved waiver exists in the epic.
- Immutability is preserved; no in-place mutations for domain data.

## TDD Evidence
- Commits demonstrate Red → Green → Refactor cadence or equivalent documented steps.
- Tests were written before or alongside implementation and cover new/changed behavior.
- Coverage for changed files: ≥85% lines, ≥75% branches (or team-agreed thresholds).

## Tests and Contracts
- Unit tests for pure logic; integration tests for adapters and DB/storage as applicable.
- AI JSON outputs validate against `docs/json/analysis.schema.json` (schemaVersion 1.0); invalid cases trigger retry logic.
- Public APIs have explicit types; no `any` or undocumented `@ts-ignore`.
 - Superfluous data: confirm sanitizer drops unknown top-level keys and mirrors them to `meta._extras`; prompt restricts top-level keys to `schemaVersion`, `id`, `pair`, `trends`, `meta`.
 - No placeholders: spot-check multiple outputs to ensure confidences are computed (not copied or constant). Enforce sum-to-one tolerance and variance checks in tests.

## Lint/Type/Format Gates
- TypeScript strict passes.
- ESLint and Prettier pass with no errors.

## Architecture/Docs
- Effects isolated with clear adapters; domain logic remains framework-agnostic and testable.
- `TECHNICAL_STANDARDS.md` and related docs updated if contracts or flows changed.

## Definition of Done
- All gates green; UAT scenario reproducible.
- No secrets in code or logs; secure handling of env vars.

Canonical location of this checklist: `docs/technical/REVIEW_CHECKLIST.md`.
