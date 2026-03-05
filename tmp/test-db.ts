import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function test() {
    console.log("Testing DB connection...");
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL is missing");
        return;
    }
    const sql = neon(url);
    const db = drizzle(sql, { schema });

    try {
        console.log("Fetching account categories...");
        const categories = await db.query.accountCategories.findMany();
        console.log("Categories found:", categories.length);

        console.log("Fetching cajas with relations...");
        const cajas = await db.query.cajas.findMany({
            with: {
                category: true,
                sesiones: {
                    limit: 1
                }
            }
        });
        console.log("Cajas found:", cajas.length);

        console.log("Test completed successfully!");
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
