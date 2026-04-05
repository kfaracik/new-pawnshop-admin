This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Production Google Login (NextAuth)

To make Google login work correctly in production, configure all items below:

1. Google Cloud OAuth:
- Add **Authorized redirect URI**:
  - `https://your-domain.com/api/auth/callback/google`

2. Production environment variables:
- `NEXTAUTH_URL=https://your-domain.com`
- `SECRET=<strong-random-secret>`
- `GOOGLE_ID=<google-oauth-client-id>`
- `GOOGLE_SECRET=<google-oauth-client-secret>`
- `MONGODB_URI=<production-mongodb-uri>`

3. Admin access:
- In `pages/api/auth/[...nextauth].js`, ensure `adminEmails` includes exact Google account emails for admins.

4. HTTPS:
- Production domain must be served over HTTPS.

If any of the above is missing, Google sign-in may fail or user session can be rejected as non-admin.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
