# Fix: Property 'id' does not exist on session user type

## Cause

The app uses a custom NextAuth session where the user object is extended with `userId` (see `src/lib/auth.ts`). The Session interface declares:

```ts
interface Session {
  user: {
    userId: string;  // <-- use this, not id
    email: string;
    name: string;
    role: Role;
    // ...
  };
}
```

NextAuth’s default User type has `id`; our custom Session user type does **not** include `id`, only `userId`. Any code that reads `session?.user?.id` therefore fails TypeScript because `id` is not on the type.

## Fix

Use `session?.user?.userId` instead of `session?.user?.id` everywhere session is from `getServerSession(authOptions)`.

## Files updated

1. `src/app/api/account/email/pending/route.ts` – auth check: `session?.user?.userId`
2. `src/app/api/account/email/request-change/route.ts` – auth check: `session?.user?.userId`
3. `src/app/api/account/email/resend/route.ts` – auth check: `session?.user?.userId`
4. `src/app/api/admin/blog/route.ts` – `authorId: session.user.userId`

## Grep to find any remaining mistakes

```bash
rg "session\.user\.id|session\?\.user\?\.id" src/
```

If you see matches in API routes using `getServerSession(authOptions)`, change them to `userId`.
