# Contributing To Filamentify

## Local setup

1. Copy `.env.example` to `.env`.
2. Install `apps/client` dependencies.
3. Install `apps/server` dependencies.
4. Run the client and server in separate terminals.

## Expectations

- Keep runtime data out of Git. Do not commit `data/`, uploads, or local SQLite files.
- Add UI strings for both `en` and `tr`.
- Prefer small, typed utilities over page-local duplication.
- Keep API responses consistent: validation errors, missing resources, and conflicts should be distinguishable.
- When schema changes are made, update `apps/server/src/db.ts` and `docs/DATABASE_SCHEMA.md` together.

## Before opening a PR

Client:

```bash
cd apps/client
npm run lint
npm run test
npm run build
```

Server:

```bash
cd apps/server
npm run test
npm run build
```

## Branching and commits

- Use focused commits with descriptive messages.
- If you rewrite history to remove sensitive or generated artifacts, document it clearly in the PR body and coordinate any force-push.
