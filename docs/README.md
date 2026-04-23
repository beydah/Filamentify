# Filamentify Documentation

Welcome to the official documentation for **Filamentify**, a modern filament management system designed for 3D printing enthusiasts and businesses.

## Project Structure

Filamentify is a monorepo containing:

- **apps/client**: A React 19 + Vite frontend using Shadcn/UI and Tailwind CSS 4.0.
- **apps/server**: A Node.js + Express backend using Better-SQLite3 for data persistence.

## Features

- **Inventory Tracking**: Manage your filament stock with precision.
- **Category Management**: Group filaments by type (PLA, ABS, PETG, etc.).
- **Modern UI**: Clean, responsive, and aesthetic design with dark mode support.
- **Localization**: Full support for Turkish and English.

## Installation

To get started, clone the repository and install dependencies in each app directory:

```bash
# For Client
cd apps/client
npm install
npm run dev

# For Server
cd apps/server
npm install
npm run dev
```

## Related Documents

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [License](../LICENSE)
