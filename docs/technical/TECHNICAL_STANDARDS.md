# V3 Technical Standards & Architecture

Source of truth for engineering conventions and contracts. This document is mirrored on the project board; the canonical copy lives in the repo under `docs/technical/TECHNICAL_STANDARDS.md`.

## Stack and Environments
- Frontend: React + TypeScript (Vite). Deploy to Cloudflare Pages for UAT.
- Backend (UAT): Cloudflare Workers + TypeScript. Image processing can run in Workers or queued jobs.
- Backend (Prod Live): Node.js + TypeScript in Docker. Identical API contracts to UAT; minimal divergence.
- Storage:
  - Images: Cloudflare R2 (blobs)
  - Metadata/JSON/rankings: Cloudflare D1 (UAT), PostgreSQL (Prod Live, free tier during early prod)
- ORM/Migrations: Drizzle ORM with dual drivers (D1 + Postgres). Single schema source, environment-specific drivers.

## Functional Programming Mandate (CRITICAL)
Pure functional development is mandatory.
- Write pure functions by default. Side effects (I/O, time, randomness, network) must be isolated in boundary modules.
- Prefer composition over inheritance. Do not use classes unless a waiver is granted.
- Use immutable data. Avoid in-place mutation; return new values.
- Treat components and handlers as pure where feasible; lift effects to the edge.
- If deviation is necessary, request approval in the epic with rationale and alternatives considered.

Waiver considerations (rare): performance hotspots with profiling proof, third‑party SDK constraints, or platform APIs that are inherently stateful. Approved waivers must include compensating tests.

## TDD Workflow and Quality Gates
Process: Red → Green → Refactor.
- Unit tests first. Then implement minimal code. Refactor with tests green.
- Test types:
  - Frontend: unit (pure functions, components via React Testing Library), integration (critical flows)
  - Backend: unit (services, adapters), contract tests (schema/prompt validation), integration (DB + storage via test containers or D1 local)
  - E2E (later): Playwright for key user flows
- Coverage target: line 85%, branch 75% minimum for changed files.
- CI gates: typecheck, lint, tests, schema validation for all committed JSON samples.

## TypeScript Standards
- `"strict": true` everywhere. No `any` or `unknown` without narrowing. No `// @ts-ignore` unless documented with issue link.
- Public APIs and exported functions must have explicit types. Internal locals may rely on inference.
- Model domain data with precise types; prefer discriminated unions over string literals scattered across code.
- Use small, single‑purpose functions. Guard clauses instead of deep nesting.

## React Standards
- Function components only. No class components.
- Hooks: prefer custom hooks to encapsulate side effects; UI components remain pure.
- State: keep local; lift state only when necessary. Avoid global state until justified; if needed, start with Context + reducers.
- Styling: keep simple; avoid adding libraries unless clearly justified.
- Accessibility: semantic HTML; keyboard navigation for interactive elements.

## Workers/Node Standards
- Workers: edge-first handlers; isolate fetch/request parsing; pure business logic functions.
- Node (Docker): same API shape as Workers; implement adapters for filesystem/network differences.
- Errors: never swallow. Use typed error shapes; map to HTTP with clear messages (no secrets).
- Logging: structured logs with correlation/job IDs; no PII.

## Configuration and Secrets
- Local: `.env` (never commit). Provide `.env.sample` with required keys.
- Cloudflare: use `wrangler secret` for secrets and `wrangler.toml` for bindings (D1, R2).
- Docker: pass env via compose; use distinct profiles for UAT/Prod.

## Data and Storage
- Initial schema (normalized, minimal):
  - `versions(id, source, created_at, coin_count)`
  - `images(id, version_id, type['full'|'anon'], pair, captured_at, path, thumb_path)`
  - `mappings(anon_image_id, full_image_id, pair, window_days, UNIQUE)`
  - `ai_results(id, anon_image_id, provider, schema_version, json, created_at)`
  - `rankings(id, version_id, provider, pair, trend, confidence, ct_confidence, trend_rank, ct_rank, rank_sum)`
- Drizzle migrations define this once; generate drivers for D1 and Postgres.
- UAT uses D1; prod migrates to Postgres with same schema and Drizzle migration history.

## AI Response Contract
- Contract is defined in `docs/json/analysis.schema.json` (schemaVersion 1.0). Treat as a hard contract.
- Validate AI outputs with Ajv (Workers/Node). Reject non‑conformant responses and trigger retry with refined prompt.
- Store raw provider JSON and the validated normalized form.

### Additional Semantics and Runtime Checks (v1.0)
- Exactly one entry for each of the three trends: Up, Down, Sideways.
- Probability hygiene: Up/Down/Sideways `confidence` values should sum to 1 with tolerance ±0.03. If not, we normalize and log a provider penalty.
- Countertrend rule: `countertrend: No` implies `ct_confidence ≤ 0.25`. For `Low|Medium|High`, expected ranges are `[0,0.25]`, `(0.25,0.6]`, `(0.6,1]` respectively.
- Consistency rejections: duplicate/missing trend labels; confidences outside [0,1]; non‑USDT `pair`; schema invalid.
- Required meta fields: `provider`, `model`, `versionId`, `fullImageId`, `anonImageId`, `timeframe: "1D"`, `window: "1y"`, `capturedAt` (ISO).
 - No placeholders: `confidence` and `ct_confidence` must be computed from the provided image content per pair. Do not reuse example numbers, defaults, or fixed constants across pairs/providers. Repeated identical vectors across many pairs will be flagged and rejected.

### Optional Meta (Recommended, non‑breaking)
Place under `meta`:
- `observations`: `{ hh_hl, lh_ll, ranging, breakout, extended }` (booleans)
- `volatility_regime`: `Low|Normal|High` and `volatility_confidence` in [0,1]
- `momentum_quantiles`: `{ q14d: 0..1, q90d: 0..1 }`
- `rationale`: short string ≤ 240 chars, no markdown
- `calibration_hint`: `{ sum_to_one: boolean }`

### Decision Mapping (Default Rubric)
- Primary bias = trend with highest `confidence`.
- Risk = `ct_confidence` for the primary bias, adjusted up if `observations.extended` or `volatility_regime = High`.
- Buy/Add: Up ≥ 0.70 AND risk ≤ 0.30 AND not extended.
- Keep/Hold: Sideways is max OR Up in [0.50,0.70) OR risk > 0.30.
- Sell/Reduce: Down ≥ 0.60 OR (Down − Up) ≥ 0.15.

### Calibration & QA
- Track Brier score and reliability curves per provider/model. Display calibrated confidences in UI when available.
- Providers with persistently poor calibration are down‑weighted in rankings.

### Enriched Example
See `docs/json/examples/enriched.analysis.json` for a valid v1.0 payload with recommended `meta` fields.

### Superfluous Data Policy (sanitizer)
- Allowed top-level keys: `schemaVersion`, `id`, `pair`, `trends`, `meta`.
- Sanitizer runs before validation:
  - Unknown top-level keys are dropped and mirrored into `meta._extras` for audit.
  - Unknown keys inside `meta` are allowed and preserved.
  - Validation then runs on the sanitized object. Presence of unknown top-level keys logs a provider penalty but does not hard-fail.

## Prompting Envelope (to be reused)
Developers must embed the following guardrails when prompting vision models:

"""
You are a meticulous analyst. Analyze the provided image and return ONLY valid JSON matching the schema at `analysis.schema.json` (schemaVersion 1.0). Do not include markdown, comments, or text. Use numbers in [0,1]. The `trends` array must contain exactly one entry for each of: Up, Down, Sideways.

Return ONLY these top-level keys: `schemaVersion`, `id`, `pair`, `trends`, `meta`. Put any auxiliary details inside `meta`. Do not add other top-level keys.

If you cannot comply, return the best partial JSON that validates against required fields. Do not add explanations.
"""

## Linting, Formatting, and Commit Discipline
- ESLint with `@typescript-eslint` and Prettier. No lint errors on commit.
- Conventional commits (feat, fix, chore, docs, test, refactor, ci, build).
- PRs must show: tests added/updated, schema validated, and evidence of pure functional design (e.g., effects isolated).

## Definition of Done (applies to every story)
- All gates pass: typecheck, lint, tests, schema validation.
- Code is pure-functional by default; any waivers documented and approved.
- README/docs updated where relevant. UAT scenario reproduced locally.

## Ownership and Updates
- This document is maintained by PM/Tech Lead. Changes require a brief rationale and must be mirrored to the board.


