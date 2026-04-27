# 🛡️ Security Policy

We take the security of Filamentify seriously. This document outlines our supported versions, reporting processes, and current security baseline.

---

## ✅ Supported Versions

We currently only support security fixes for the latest version on the `main` branch.

| Version | Supported |
| :--- | :--- |
| Latest | ✅ |
| < Latest | ❌ |

---

## 🚩 Reporting a Vulnerability

> [!CAUTION]
> Please do not open public issues for unpatched vulnerabilities.

If you discover a security risk, please follow these steps:
1. Open a **private security advisory** on GitHub or contact the maintainer directly.
2. Provide a detailed report including:
   - **Summary**: A brief description of the vulnerability.
   - **Reproduction**: Exact steps to trigger the issue.
   - **Scope**: Affected routes, files, or components.
   - **Impact**: The potential risk (e.g., data leak, unauthorized access).

---

## 🔒 Hardening Baseline

Filamentify implements several layers of security by default:

- **🔐 Token Protection**: All protected API routes require an `ADMIN_TOKEN`. Production environments reject the default fallback token.
- **🌐 Origin Allowlist**: Requests are restricted to the domain specified in `CLIENT_ORIGIN`.
- **📂 Secure File Handling**: Uploads are served via controlled routes (`/api/files/:fileName`) rather than public static directories.
- **🛡️ Upload Validation**: Files are checked for size limits, valid extensions, MIME types, and file signatures.
- **🗄️ Database Integrity**: Foreign keys are strictly enforced, and critical writes are wrapped in atomic transactions.

---

## 🧹 Secret Recovery

If sensitive data (tokens, keys, runtime artifacts) is accidentally committed:

1. **Rotate**: Immediately revoke or change the compromised secret.
2. **Exclude**: Remove the file from the working directory and ensure it is listed in `.gitignore`.
3. **Purge**: Rewrite Git history to completely remove the artifact.
4. **Resync**: Force-push the cleaned branch and notify all contributors to resync their local clones.

---

[⬅️ Back to README](../README.md)
