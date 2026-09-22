/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const DatabaseURL = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: DatabaseURL!,
  },
  strict: true,
  verbose: true,
});
