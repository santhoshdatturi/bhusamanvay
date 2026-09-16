<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Nested, domain-specific rules live in `components/AGENTS.md` (for UI and components), `app/AGENTS.md` (for routing and route guidelines), `lib/validations/AGENTS.md` (for Zod validation schemas), `lib/db/AGENTS.md` (for database and migration), `lib/auth/AGENTS.md`, `lib/AGENTS.md` (for backend services/actions), and `lib/storage/AGENTS.md` (for storage and S3). They are automatically loaded when you work in those directories. Do not paste those rules here.

# Ask before you assume

Never guess at intent. If a task leaves anything open — which component, which endpoint, what happens on failure, whether it needs a migration, whether this is user-facing — stop and ask. One question up front is cheaper than half a day of work in the wrong direction.

- Ask when the request could reasonably mean two different things.
- Ask before changing a public API shape, a DB schema, or anything in core configurations.
- Do not invent product decisions, copy, or acceptance criteria.
- Do not widen scope past what was asked. Note the adjacent thing you spotted; don't fix it unprompted.
- If you had to assume something you couldn't resolve, list it explicitly at the top of your summary.

# The loop

Every change runs through this. A task is not done until it is green.

```bash
npm run lint         # eslint
npm run typecheck     # type checking
```

Rules for the loop:
- Run these commands after every meaningful edit, not once at the end.
- Never report success on a red loop. Never disable, skip, or ignore a test/check to get to green.
- Do not start long-running processes (`npm run dev`) to "verify" — they never exit. Use the commands above.

# Type checking

- Both TypeScript and React are strict. Type errors are not warnings.
- **Strictly No `any`**: Do not use `any`, `as any`, or `as unknown as Type`. Rely on Zod schema inference (e.g., `z.infer<typeof mySchema>`) or Drizzle's inferred table types. If a type is genuinely unknown, use `unknown` and narrow it.
- **Never bypass checks**: Do not use `eslint-disable-next-line @typescript-eslint/no-explicit-any` or similar escape hatches to suppress type checking. Fix the actual type.
- **Single Source of Truth**: External types and database enums should be imported from the standard locations (e.g., `lib/db/types.ts` or `lib/db/schema/enums.ts`) rather than loosely redefined.
- No `as` to escape an error, and no non-null `!`. Fix the type or narrow properly.
- All external input is parsed with a Zod schema. Note: In Zod 4, `z.string().url()` is deprecated. Always use the top-level `z.url()` instead.

# Naming & Conventions

Consistency is for the model as much as for us. Pick the existing word, don't coin a new one.

**Code:**
- **Functions/Hooks**: `camelCase` (e.g., `listUsers`, `useUser`). For backend services, use standard CRUD verbs: `create`, `get`, `list`, `update`, `delete`. Not `fetch`, `remove`, `save`, `handle`.
- **React Components**: `PascalCase` (e.g., `UserListView`).
- **Booleans**: Read as assertions: `isPublished`, `hasAccess`, `canEdit`.
- **Routes**: kebab-case, plural nouns for page or API route folders (e.g., `app/dashboard/users/[userId]`).
- **Database (Drizzle/PostgreSQL):**
  - Transactions: Database connects via Neon WebSocket server (`drizzle-orm/neon-serverless` + `Pool`). Always use `await db.transaction(async (tx) => { ... })` instead of standalone individual queries whenever performing multi-statement mutations, dependent queries, foreign key creations, or composite entity writes.
  - Enums: Named with `Enum` suffix in schema (e.g., `userRoleEnum`). The actual Postgres enum name uses `snake_case` (e.g., `user_role`).
  - Tables: Named as plural `camelCase` in schema (e.g., `profiles`), but the actual Postgres table name uses `snake_case` (e.g., `profiles`).
  - Columns: `camelCase` in TypeScript, `snake_case` in Postgres definition strings.
  - Arrays vs JSONB: Prefer Postgres arrays (e.g., `text("tags").array()`) over `jsonb()` when storing simple collections like lists of strings or URLs.
  - Indexes: Do not explicitly declare a `uniqueIndex` with the same name as a `primaryKey` on the same columns; primary keys automatically create a unique index.
- **Zod Validations:**
  - **Keys**: Always use `camelCase` keys across the stack (Zod, Actions, Services, UI). Do not use `snake_case` to match raw database column strings; Drizzle handles the mapping automatically since TS definitions are `camelCase`.
  - **Enums**: Always import enum arrays from `enums.ts` (e.g., `z.enum(userRoleEnum.enumValues)`) rather than redefining string literals. This ensures a single source of truth between the UI, Zod, and Postgres.
  - **Issue Codes**: `z.ZodIssueCode` is deprecated. Use raw string literal codes (e.g., `"custom"`).
- **Files**: File names should match their default exports where possible. Test files sit beside the source (e.g., `users.service.ts` → `users.service.test.ts`).

# Dependencies

- Code is cheap; maintenance isn't. Prefer a well-established package over rolling your own, and prefer the platform over a package.
- Ask before adding a dependency. Never add one as a side effect of another task.

# Skills Usage

- **CRITICAL REQUIREMENT - READ SKILLS FIRST**: BEFORE starting ANY work (coding, planning, or designing), you MUST use the `view_file` tool to explicitly read the `SKILL.md` file for any relevant skills provided in your context or located in `.agents/skills/`. DO NOT rely solely on your general knowledge.
- **Proactive Skill Utilization**: Always evaluate the current task and proactively use relevant agent skills to complete it. For example, if the task involves database operations or auth, you must read the `neon-drizzle`, `neon-auth`, or `neon-postgres` `SKILL.md` file first.

# Core Application Guidelines

- **Timezone Handling**: Never rely on server-side `Intl.DateTimeFormat` or `date-fns` formatting for user-facing times, as it will default to the server's system timezone (usually UTC). Always pass raw ISO date strings to **Client Components** and format them there so they automatically reflect the user's local timezone.
- **UI Human-Readable Labels for Enums & Types**: Never render raw database enum keys, snake_case strings, or uppercase identifiers directly in the UI (e.g., `SPATIAL_MAP`, `PROPERTY_CARD`, `account_holding`). Always map enum values to curated human-friendly labels (e.g., from `DOCUMENT_TYPES` or a label mapping dictionary) using standard title casing.
- **Verifiable Actions & Secrets**:
  - **Never use shared secret codes**: Do not store or display a global "secret code" for verifiable actions; users can inspect the page and exploit this.
  - **Digital/Online Verification**: Intercept action buttons via a Server Action to mark status in the database *before* redirecting.

# Architecture: Where things live

**Strict Server Logic Boundary:**
- New backend work goes in `lib/services/`.
- **Server Actions (`lib/actions/`) never talk to the database directly.** The request path is: Next.js UI → Server Action → Service → Database.
- Actions exist *only* to validate input (via Zod), call the service, and return a `ServiceResult`.

**Service Domain Isolation (Cross-Domain Communication):**
- A service only directly queries or modifies its *own* domain tables.
- If a service needs to interact with another domain, it must call that domain's service rather than querying its tables directly.
- Similarly, Server Actions only call the service matching their domain. Any cross-domain orchestration happens purely at the service layer based on service logic.

| You need                         | Look in                                     |
| -------------------------------- | ------------------------------------------- |
| Components, UI, Layouts          | `components/`                               |
| Pages, Routing, Layouts          | `app/`                                      |
| Validations, Zod Schemas         | `lib/validations/`                          |
| Database, Drizzle, Schemas       | `lib/db/`                                   |
| Auth, Boundaries                 | `lib/auth/`                                 |
| Server Actions                   | `lib/actions/`                              |
| Services, Error handling         | `lib/services/`                             |
| Storage, Files, S3               | `lib/storage/`                              |

# Keeping this file current (Failure Log)

This section is a failure log, not a wishlist. Every line below exists because it went wrong at least once. When you make a mistake, get corrected, or discover something about this codebase that wasn't written down, add one line to the failure log below, in the imperative, describing the correct behaviour.

## Failure log
- Zod schemas, Services, used a mix of `snake_case` and `camelCase`, causing excessive manual mapping and typing issues. Standardize on `camelCase` across the stack to match Drizzle TS properties natively.
- Zod enums and UI fields diverged from the database schema because Zod redefined string literals. Always use `.enumValues` from `enums.ts` (e.g., `z.enum(venueTypeEnum.enumValues)`) for a single source of truth.
- `z.ZodIssueCode` is deprecated. Use raw string literals (e.g., `"custom"`) instead.
- A schema push failed with `42P07: relation already exists` because a `uniqueIndex` was explicitly declared with the exact same name as a `primaryKey` on the same columns. Primary keys automatically create a unique index; do not declare redundant unique indexes.
- `drizzle-kit push` failed with `42804` (cannot cast jsonb to text[]) because Drizzle defaults to preserving data via `ALTER COLUMN ... TYPE` rather than dropping the column. When fundamentally changing column types that cannot be implicitly cast, generate a migration (`npm run db:generate`) and manually write the `USING` clause (or drop/re-add) instead of relying on `push`.
- Using `any`, `as any`, or `eslint-disable` comments created brittle code. Types were corrected to use strict inferences and proper library types.
- Validation failed on `.url()` deprecation. In Zod 4, `z.string().url()` is deprecated; always use the top-level `z.url()` constructor. Always enforce `.url()` in Zod schemas for properties representing URLs, websites, and social links.
- Manual Zod schemas drifted from the database schema. Always use `createInsertSchema` from `drizzle-zod` as the base schema to ensure synchronization, and derive update schemas with `.partial()`. Customize database columns directly in `createInsertSchema` rather than omitting and re-extending them; use `.extend({ ... })` exclusively for non-database fields.
- Manual property mapping in `.values()` and `.set()` caused bugs when fields were added to schemas. Always use the object spread method (`...data`) in Drizzle service queries when passing strictly validated Zod payload objects, without redundantly re-mapping nullable fields.
- Do not run database migration or generation commands (`db:generate`, `db:migrate`, `db:push`) unprompted without explicit user instruction.
- Never render raw database enum keys or uppercase identifiers (e.g., `SPATIAL_MAP`, `PROPERTY_CARD`, `account_holding`) in user-facing UI; always map them to human-readable labels (e.g., via `DOCUMENT_TYPES` or dedicated label lookup maps).
