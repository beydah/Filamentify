<p align="center">
  <img src="https://img.icons8.com/fluency/96/3d-printer.png" alt="Filamentify Logo" width="96" height="96" />
</p>

<h1 align="center">Filamentify</h1>

<p align="center">
  <strong>A premium 3D printing inventory and product management dashboard.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-Latest-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-5-lightgrey?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/SQLite-3-07405E?style=for-the-badge&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## 📖 Overview

**Filamentify** is a modern monorepo designed for 3D printing enthusiasts and businesses. It provides a robust dashboard to manage filament inventory, 3D models, and product catalogs with ease.

### ✨ Key Features
- 🚀 **Fast Admin UI**: Built with React 19 and Vite for a seamless user experience.
- 🔐 **Secure API**: Express 5 backend with token-based protection and controlled file delivery.
- 📦 **Monorepo Architecture**: Clean separation between client, server, and documentation.
- 💾 **Persistent Data**: SQLite-powered storage with external runtime data management.

---

## 🛠️ Workspace Structure

| Path | Description |
| :--- | :--- |
| `apps/client` | React 19 + Vite admin user interface |
| `apps/server` | Express 5 + better-sqlite3 API backend |
| `docs/` | Contributor, schema, and security documentation |
| `data/` | Local runtime database and uploads (ignored by Git) |

---

## 🔒 Security Model

> [!IMPORTANT]
> Security is a top priority in Filamentify. All critical endpoints are protected by default.

- **Admin Protection**: All `/api/*` routes (except `/api/ping`) require a valid admin token.
- **Auto-Auth**: The client uses a shared fetch shim to automatically include `Authorization: Bearer <token>`.
- **Safe File Serving**: Uploads are stored in `data/uploads/` and served via `/api/files/:fileName`, preventing direct public access.
- **CORS Control**: Browser origins are strictly managed via the `CLIENT_ORIGIN` environment variable.

---

## 🚀 Quick Start

Follow these steps to get your local environment up and running.

### 1. Configuration
Copy the template environment file and set your unique token:
```bash
cp .env.example .env
# Edit .env and set ADMIN_TOKEN
```

### 2. Dependency Installation
Install dependencies for both the client and server:
```bash
# Install Client
cd apps/client && npm install

# Install Server
cd ../server && npm install
```

### 3. Running the App
Open two terminal windows to start the development servers:

**Server:**
```bash
cd apps/server && npm run dev
```

**Client:**
```bash
cd apps/client && npm run dev
```

| Service | URL |
| :--- | :--- |
| **Client** | [http://localhost:5173](http://localhost:5173) |
| **Server** | [http://localhost:3001](http://localhost:3001) |

---

## ✅ Quality Gates

Ensure code quality and stability before committing changes.

### Client
```bash
cd apps/client
npm run lint    # Static analysis
npm run test    # Unit tests
npm run build   # Production build
```

### Server
```bash
cd apps/server
npm run test    # API tests
npm run build   # Transpile code
```

> [!TIP]
> CI/CD is configured via `.github/workflows/ci.yml` and runs these checks automatically on every push.

---

## 🧹 Repo Hygiene

- **Ignored Data**: Runtime data, uploads, and `node_modules` are strictly excluded from version control.
- **History Cleanliness**: Risky artifacts have been purged from Git history. 

---

## 📚 Documentation

Explore more details about the project:

- 📝 [Project Docs](./docs/README.md)
- 🗄️ [Database Schema](./docs/DATABASE_SCHEMA.md)
- 🤝 [Contributing Guidelines](./docs/CONTRIBUTING.md)
- 🛡️ [Security Policy](./docs/SECURITY.md)

---

<p align="center">
  Built with ❤️ for the 3D Printing Community
</p>
