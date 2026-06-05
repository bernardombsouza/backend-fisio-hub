// Importa direto da pasta que você gerou no schema!
import { PrismaClient } from '../../generated/prisma/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import "dotenv/config";

const dbUrl = (process.env.DATABASE_URL as string) || "file:./prisma/dev.db";

const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const Prisma = new PrismaClient({ adapter });

export default Prisma;