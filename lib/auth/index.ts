import { cache } from "react";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema/auth";
import { userRoleEnum } from "@/lib/db/schema/enums";
import { createLogger } from "@/lib/logger";
import { ServiceErrorCode, fail, ok, type ServiceResult } from "@/lib/services/errors";

const log = createLogger("auth");

const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  process.env.NEON_AUTH_COOKIE_SECRET;

export const auth = betterAuth({
  secret: authSecret,
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schemaName: "auth",
    schema,
    usePlural: true,
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "reviewer",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type AuthUser = AuthSession["user"] & {
  role: UserRole;
};

/**
 * Safe getSession helper memoized per HTTP request via React cache().
 * Gracefully returns null instead of throwing unhandled APIError during Turbopack HMR / Fast Refresh.
 */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  try {
    const h = await headers();
    const session = await auth.api.getSession({
      headers: h,
    });
    return session as AuthSession | null;
  } catch (error) {
    log.warn({ error }, "Turbopack / HMR caught session retrieval error — returning null");
    return null;
  }
});

/**
 * Require an authenticated user. Memoized per HTTP request via React cache().
 * Returns the Better Auth user object on success.
 */
export const requireAuth = cache(async (): Promise<ServiceResult<AuthUser>> => {
  try {
    const session = await getSession();

    if (!session?.user) {
      log.warn("Auth check failed — no authenticated user");
      return fail(ServiceErrorCode.UNAUTHORIZED);
    }

    const rawRole = session.user.role;
    const isUserRole = (val: string): val is UserRole =>
      (userRoleEnum.enumValues as readonly string[]).includes(val);

    const role: UserRole = isUserRole(rawRole) ? rawRole : "reviewer";

    return ok({
      ...session.user,
      role,
    });
  } catch (error) {
    return fail(
      ServiceErrorCode.INTERNAL,
      "Failed to retrieve auth session",
      error
    );
  }
});
