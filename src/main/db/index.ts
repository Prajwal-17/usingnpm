// main/db/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import Database from 'better-sqlite3';

const sqlite = new Database('sqlite.db'); // You can change the path or use :memory:
export const db = drizzle(sqlite, { schema });

