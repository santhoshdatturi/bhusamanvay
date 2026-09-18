import * as dotenv from "dotenv";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { users } from "../lib/db/schema/auth";

// Load environment variables (.env.local prioritized)
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

neonConfig.webSocketConstructor = ws;

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  let positionalIndex = 0;
  const positionalKeys = ["name", "email", "password", "role"];

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, ...rest] = arg.slice(2).split("=");
      result[key] = rest.join("=");
    } else {
      if (positionalIndex < positionalKeys.length) {
        result[positionalKeys[positionalIndex]] = arg;
        positionalIndex++;
      }
    }
  }

  return result;
}

async function main() {
  console.log("==================================================");
  console.log("       BhuSamanvay: User Creation Script          ");
  console.log("==================================================\n");

  const parsed = parseArgs();
  let name = parsed.name;
  let email = parsed.email;
  let password = parsed.password;
  let role = (parsed.role?.toLowerCase() as "admin" | "reviewer") || "admin";

  // Prompt interactively if missing arguments
  if (!name || !email || !password) {
    const rl = readline.createInterface({ input, output });

    try {
      if (!name) {
        name = await rl.question("Enter User Full Name: ");
      }
      if (!email) {
        email = await rl.question("Enter User Email: ");
      }
      if (!password) {
        password = await rl.question("Enter User Password (min 8 chars): ");
      }
      if (!parsed.role) {
        const roleInput = await rl.question("Enter Role (admin/reviewer) [default: admin]: ");
        if (roleInput.trim().toLowerCase() === "reviewer") {
          role = "reviewer";
        } else {
          role = "admin";
        }
      }
    } finally {
      rl.close();
    }
  }

  // Sanitize and validate inputs
  name = name?.trim();
  email = email?.trim()?.toLowerCase();
  password = password?.trim();

  if (!name) {
    console.error("Error: Full Name cannot be empty.");
    process.exit(1);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Error: A valid email address is required.");
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error("Error: Password must be at least 8 characters long.");
    process.exit(1);
  }
  if (role !== "admin" && role !== "reviewer") {
    role = "admin";
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: Missing DATABASE_URL in environment (.env.local).");
    process.exit(1);
  }

  console.log(`\nCreating user:`);
  console.log(`  Name:     ${name}`);
  console.log(`  Email:    ${email}`);
  console.log(`  Role:     ${role}`);
  console.log("\n[1/2] Creating Auth User in Better Auth...");

  let authUserId: string | undefined;

  try {
    const { auth } = await import("../lib/auth");
    const signUpRes = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (signUpRes?.user?.id) {
      authUserId = signUpRes.user.id;
      console.log(`✓ Better Auth user created with ID: ${authUserId}`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (
      errorMsg.toLowerCase().includes("already exists") ||
      errorMsg.toLowerCase().includes("duplicate")
    ) {
      console.log("User already registered in Better Auth. Attempting credential verification...");
      try {
        const { auth } = await import("../lib/auth");
        const signInRes = await auth.api.signInEmail({
          body: { email, password },
        });
        if (signInRes?.user?.id) {
          authUserId = signInRes.user.id;
          console.log(`✓ Verified existing user ID: ${authUserId}`);
        } else {
          console.error("Authentication failed: invalid credentials.");
          process.exit(1);
        }
      } catch (signInErr) {
        console.error("Sign-in verification failed:", signInErr);
        process.exit(1);
      }
    } else {
      console.error(`Auth creation failed: ${errorMsg}`);
      process.exit(1);
    }
  }

  if (!authUserId) {
    console.error("Failed to determine auth user ID.");
    process.exit(1);
  }


  // 2. Update user role in database
  console.log("\n[2/2] Updating User Role in Database...");
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const db = drizzle(pool, { schema });

  try {
    const [updated] = await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, authUserId))
      .returning();

    if (updated) {
      console.log(`✓ User role updated successfully: ${updated.role}`);
    }

    console.log("\n==================================================");
    console.log("User successfully created & ready to log in!");
    console.log(`Email:    ${email}`);
    console.log(`Role:     ${role}`);
    console.log(`Auth ID:  ${authUserId}`);
    console.log("==================================================\n");
  } catch (err) {
    console.error("Database operation failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
