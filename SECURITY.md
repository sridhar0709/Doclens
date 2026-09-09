# Security Policy

DocLens handles sensitive citizen information such as income, social category, disability status, documents, and eligibility results. Security reports are treated with priority and should be disclosed responsibly.

## Supported Versions

DocLens is in active pre-1.0 development. Security fixes are applied to the latest `main` branch and the latest tagged beta release.

| Version | Supported |
|---|---|
| `v0.4.x` | Yes |
| Earlier versions | Best effort |

## Reporting a Vulnerability

Please do not open a public GitHub issue for vulnerabilities.

Use GitHub private vulnerability reporting if it is enabled for this repository. If private reporting is not available, contact a maintainer privately and include enough information for us to reproduce and assess the issue.

Include:

- A clear description of the vulnerability.
- The affected component, endpoint, page, migration, or workflow.
- Reproduction steps or proof-of-concept details.
- The potential impact and any known exploit conditions.
- Your recommended mitigation, if you have one.

Please avoid accessing, modifying, deleting, or exfiltrating real user data while testing. Use local development data, mock data, or a controlled test account.

## Response Expectations

We aim to:

- Acknowledge valid reports within 72 hours.
- Triage severity and affected scope within 7 days.
- Prioritize fixes for issues involving authentication, authorization, citizen PII, document storage, API secrets, or data integrity.
- Credit reporters when appropriate and requested.

Timelines may vary because this is an early-stage open source project, but sensitive data and access-control issues are handled first.

## Security Scope

In scope:

- Supabase authentication, JWT validation, and Row-Level Security behavior.
- FastAPI protected routes, internal webhook routes, and admin checks.
- Document upload, signed URLs, OCR flows, and storage access boundaries.
- Exposure of secrets, tokens, service role keys, or sensitive environment values.
- Injection, XSS, CSRF, SSRF, CORS, rate-limit bypass, or unsafe file handling.
- Eligibility-result integrity where tampering could affect user-facing recommendations.

Out of scope:

- Reports based only on missing security headers without a practical exploit path.
- Denial-of-service reports that rely on unrealistic traffic volume.
- Social engineering, phishing, or attacks requiring compromised maintainer accounts.
- Vulnerabilities in third-party services unless they directly affect this integration.
- Scanner-only reports without reproduction steps or impact explanation.

## Public Security Issues

For non-sensitive hardening work, use the Security Hardening issue template. Examples include improving dependency audit coverage, tightening documentation, or proposing safer defaults that do not reveal an active vulnerability.

## Dependency Security

The repository uses pinned backend dependencies and GitHub Actions dependency audit checks. Dependency updates should preserve reproducible installs, include a short risk note, and pass the project CI workflow.

## Data Handling Principles

Security work must follow these principles:

- Never commit secrets, tokens, `.env` files, database dumps, or private keys.
- Do not log full citizen profiles, documents, JWTs, or service role credentials.
- Prefer least-privilege access for database policies, service clients, and storage paths.
- Keep eligibility decisions deterministic and auditable.
- Fail closed for authorization and webhook validation.

