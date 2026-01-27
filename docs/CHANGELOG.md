# Changelog - WiseBet Lab

## [V1.0.1] - 2026-01-22
### Audit & Hardening (Release Candidate)

#### Fixed
- **Storage Resilience**: Added `safeParse` wrapper with `try-catch` for all `localStorage` reads. The app no longer crashes if the stored JSON is corrupted.
- **Dependency Cleanup**: Removed unused `@google/genai` import and related code to minimize bundle size and security surface.
- **Empty State UX**: Optimized `renderApp` to handle empty databases gracefully, providing clear instructions for the user.
- **Hoisting Fixes**: Reorganized helper functions (`fUSD`, `newChart`, etc.) to ensure reliable execution across different environments.
- **Login Bug**: Fixed potential scope issues in the authentication handler.

#### Changed
- **Unified Style**: Removed redundant inline CSS from `index.html` and consolidated everything into `index.css`.
- **Repo Organization**: Standardized file structure and added comprehensive documentation for production handoff.

#### Security
- **Secret Removal**: Verified no hardcoded API keys are present in the final build.
- **Auth Management**: Centralized the access code as `DEFAULT_AUTH` for dev-friendly configuration.
