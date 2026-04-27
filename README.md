# Filamentify

Filamentify is a monorepo for a 3D printing inventory and product management dashboard. It includes a React admin client and an Express + SQLite API with token-based admin protection, controlled file delivery, and persistent runtime data stored outside tracked source folders.

## Workspace

- `apps/client`: React 19 + Vite admin UI
- `apps/server`: Express 5 + better-sqlite3 API
- `docs/`: contributor, schema, and security documentation
- `data/`: local runtime database and uploaded files, ignored by Git

## Security model

- All `/api/*` routes except `/api/ping` require an admin token.
- The client sends `Authorization: Bearer <token>` automatically through a shared fetch shim.
- Uploaded files are written to `data/uploads/` and served through `/api/files/:fileName` instead of a public static directory.
- Allowed browser origins are controlled by `CLIENT_ORIGIN`.

## Quick start

1. Copy `.env.example` to `.env` and set a unique `ADMIN_TOKEN`. Production startup rejects the default token.
2. Install dependencies:

```bash
cd apps/client
npm install

cd ../server
npm install
```

3. Start the server:

```bash
cd apps/server
npm run dev
```

4. Start the client:

```bash
cd apps/client
npm run dev
```

The default URLs are:

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`

## Quality gates

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

CI runs the same commands through `.github/workflows/ci.yml`.

## Repo hygiene

- Runtime data, uploads, database files, and `node_modules` are ignored at the repo root.
- Risky tracked artifacts were removed from git history locally. After reviewing the rewritten history, force-push the branch to update the public remote.

## Additional docs

- [Project Docs](./docs/README.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Security](./docs/SECURITY.md)
