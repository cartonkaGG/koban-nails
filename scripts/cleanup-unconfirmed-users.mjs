import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

let page = 1;
const perPage = 100;
const usersToDelete = [];

while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage,
  });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const users = data.users ?? [];
  usersToDelete.push(
    ...users.filter((user) => user.email && !user.email_confirmed_at),
  );

  if (users.length < perPage) {
    break;
  }

  page += 1;
}

for (const user of usersToDelete) {
  const { error } = await supabase.auth.admin.deleteUser(user.id);

  if (error) {
    console.error(`Failed to delete ${user.email}: ${error.message}`);
    process.exitCode = 1;
    continue;
  }

  console.log(`Deleted unconfirmed account: ${user.email}`);
}

console.log(`Done. Deleted ${usersToDelete.length} unconfirmed account(s).`);
