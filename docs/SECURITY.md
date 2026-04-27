# Security Policy

## Supported versions

Only the latest revision on `main` is supported for security fixes.

## Reporting a vulnerability

Open a private security advisory or contact the maintainer through a private GitHub channel. Do not open public issues for unpatched vulnerabilities.

Include:

- A short summary
- Exact reproduction steps
- Affected routes or files
- Expected impact

## Current hardening baseline

- Admin token required for protected API routes, and production startup rejects the default fallback token
- Origin allowlist via `CLIENT_ORIGIN`
- Controlled file serving through `/api/files/:fileName`
- Size-limited uploads with extension, MIME, and signature checks
- SQLite foreign keys enabled
- Product writes wrapped in transactions

## Maintainer guidance

If secrets or runtime artifacts are committed by mistake:

1. Rotate or revoke the secret first.
2. Remove the file from the working tree and ignore it.
3. Rewrite git history to purge the sensitive artifact.
4. Force-push the cleaned branch and notify consumers to resync.
