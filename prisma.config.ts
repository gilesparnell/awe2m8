import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations (needs session-level features)
    // Falls back to DATABASE_URL if DIRECT_URL not set
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
