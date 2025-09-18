# Clerk Integration Notes

This folder is reserved for Clerk authentication utilities and configuration.

After installing `@clerk/nextjs` and setting environment variables, you can add:

- `src/lib/auth/index.ts` – shared helpers (e.g., role checks, requireAuth wrappers)
- `middleware.ts` (at project root) – route protection (see docs/setup-auth-d1.md)
- Update `src/app/layout.tsx` to wrap with `ClerkProvider`

Do not import Clerk modules until the package is installed to avoid build errors.

