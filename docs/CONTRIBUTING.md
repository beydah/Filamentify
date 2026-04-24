# Contributing to Filamentify

First off, thank you for considering contributing to Filamentify! It's community members like you that make 3D printing management easier for everyone.

## 🛠️ Development Environment

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: For version control

### Setup
1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/beydah/Filamentify.git
   ```
3. **Install dependencies** in both apps:
   ```bash
   cd apps/server && npm install
   cd ../client && npm install
   ```

## 🏗️ Technical Stack & Standards

We use a modern stack. Please ensure your contributions align with these technologies:

- **Frontend**: React 19, Vite, Tailwind CSS 4.0, Shadcn/UI.
- **Backend**: Node.js, Express, better-sqlite3.
- **Languages**: TypeScript (Strict mode enabled).
- **Icons**: Lucide React.
- **State Management**: React Hooks (Zustand for global state if applicable).

### Coding Standards
- **Component Pattern**: Use functional components with hooks.
- **Styling**: Use Tailwind 4.0 utility classes. Avoid inline styles or custom CSS unless necessary.
- **Localization**: All UI strings must be added to `apps/client/src/i18n/locales/` for both `en` and `tr`.
- **Database**: Schema changes must be reflected in `apps/server/src/db.ts` and `docs/DATABASE_SCHEMA.md`.

## 🔄 Contribution Workflow

1. **Create a branch**: `git checkout -b feat/your-feature-name` or `fix/bug-description`.
2. **Implement changes**: Follow the style guide and ensure code is clean.
3. **Local Testing**: Verify that both client and server run without errors.
4. **Commit**: Use descriptive commit messages (e.g., `feat: add product management module`).
5. **Push & PR**: Push to your fork and open a Pull Request to the `main` branch.

## 🐞 Reporting Issues

- Use the [Issue Template](./ISSUE_TEMPLATE.md) for bug reports.
- Be specific about the OS and browser if the issue is UI-related.
- Include logs from the server console if applicable.

## 💬 Community

Questions? Feel free to open a **GitHub Discussion** or reach out to the maintainers. We're happy to help!

