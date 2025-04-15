import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

// Create a Neon client
const sql = neon(process.env.DATABASE_URL);

// Create a Drizzle client
export const db = drizzle(sql, { schema });