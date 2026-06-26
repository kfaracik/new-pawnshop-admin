# New Pawnshop Admin

Administrative panel for catalog, categories, orders and protected backoffice actions.

## Current state

- TypeScript foundation added with incremental migration support.
- Core app shell, MongoDB helpers and selected API routes are migrated to TS.
- NextAuth admin gate now normalizes email checks and rejects non-admin sign-ins earlier.
- Admin API routes proxying backend services now return safer typed error handling.

## Architecture

- The project is not fully feature-based yet.
- Current structure is still mixed between `pages`, `components`, `lib` and `models`.
- Product form logic has been partially extracted into `lib/products.ts` to reduce component bloat.
- Recommended next step is feature grouping such as `features/products`, `features/categories`, `features/orders`, with shared layout/auth utilities outside feature folders.

## Required environment variables

```env
NEXTAUTH_URL=https://admin.example.com
SECRET=replace-with-strong-secret
GOOGLE_ID=google-oauth-client-id
GOOGLE_SECRET=google-oauth-client-secret
MONGODB_URI=mongodb+srv://...
ADMIN_EMAILS=admin@example.com,owner@example.com
AUCTION_BACKEND_URL=https://api.example.com
AUCTION_ADMIN_TOKEN=replace-with-strong-service-token
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_BUCKET=pawnshop-uploads
R2_ACCESS_KEY_ID=cloudflare-r2-access-key
R2_SECRET_ACCESS_KEY=cloudflare-r2-secret-key
R2_PUBLIC_BASE_URL=https://cdn.example.com
```

Upload storage is S3-compatible. The recommended low-cost default for this
project is Cloudflare R2; the same code can also use AWS S3 by setting the
`S3_*` variable names instead of `R2_*`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Production checklist

- Restrict Google OAuth to production callback URLs only.
- Replace environment allowlist with a managed role model.
- Expand backend-side audit logging review for all privileged flows.
- Continue TS migration of remaining pages/components/forms.
- Review CSP, upload validation and R2/S3 object permissions if uploads are enabled.
- Keep uploaded image binaries in R2/S3 and store only returned public URLs in product records.

Current implementation notes:

- `ADMIN_EMAILS` is required in production and must be provided as a comma-separated allowlist for admin access.
- Products, categories and orders are managed through backend API proxy routes instead of direct admin writes.
- Upload API now rejects non-image files and files over the current size limit, then stores valid images in R2/S3-compatible object storage.
- Categories page has been split into smaller UI modules to reduce page-level bloat and improve maintainability.

## Planned legal and operational work

- Define admin data access policy and least-privilege roles.
- Add documented retention/access rules for customer and order data.
- Add internal procedures for complaint handling, suspicious item escalation and provenance checks.
