# 🤝 Contributing to Filamentify

Thank you for your interest in contributing! This document provides guidelines and steps to help you get started with development.

---

## 🚀 Local Development Setup

Follow these steps to set up your environment:

1. **Environment**: Copy `.env.example` to `.env` and configure your local settings.
2. **Dependencies**: Install dependencies for both applications:
   - `cd apps/client && npm install`
   - `cd apps/server && npm install`
3. **Execution**: Run the applications in separate terminal windows:
   - Client: `npm run dev` (inside `apps/client`)
   - Server: `npm run dev` (inside `apps/server`)

---

## 💎 Project Expectations

To maintain code quality and consistency, please adhere to the following rules:

- **🧹 Data Hygiene**: Never commit content from the `data/` directory, including uploads or SQLite files.
- **🌍 Internationalization**: Always provide translation strings for both **English (`en`)** and **Turkish (`tr`)**.
- **🧩 Modularity**: Prefer shared, typed utilities over duplicating logic within pages.
- **🔌 API Consistency**: Ensure error responses (validation, 404, 409) follow the established JSON format.
- **🗃️ Schema Updates**: If you modify the database, update both `apps/server/src/db.ts` and [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).

---

## ✅ Pre-flight Checklist

Before opening a Pull Request, ensure all quality checks pass locally.

### 💻 Client Side
```bash
cd apps/client
npm run lint    # Check for code style issues
npm run test    # Run unit tests
npm run build   # Verify production build
```

### ⚙️ Server Side
```bash
cd apps/server
npm run test    # Run API tests
npm run build   # Verify compilation
```

---

## 🌿 Branching & Commits

- **Atomic Commits**: Use small, focused commits with clear, descriptive messages (e.g., `feat: add filament stock tracking`).
- **History Management**: If sensitive data was accidentally committed, use `git filter-repo` or similar tools before pushing. Document any history rewrites clearly.

---

[⬅️ Back to README](../README.md)
