# Epic Preamble (Insert at the top of every Epic)

**MANDATORY: Pure Functional Development**

- Write pure functions by default. Isolate side effects at the boundaries.
- No classes or shared mutable state. Prefer composition and immutability.
- If you believe a deviation is necessary, request approval in this epic before coding. Include rationale, alternatives, and test impacts.

**Quality Gates (must pass before merging any story in this epic)**

- TypeScript strict mode with zero `any` and zero `@ts-ignore` (unless approved waiver).
- Lint and format clean.
- Tests added first (TDD). Red → Green → Refactor documented in commits.
- AI JSON outputs validate against `docs/json/analysis.schema.json` (schemaVersion 1.0).
- Effects isolated behind adapters; core logic is pure and unit-tested.

**Definition of Done (per story)**

- All gates pass; UAT scenario verifiable.
- Docs updated if contracts or behaviors change.
- Reviewer checklist completed.

Paste this preamble into the epic description and keep it visible throughout implementation.

