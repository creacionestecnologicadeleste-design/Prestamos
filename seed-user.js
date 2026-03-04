import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

config();

const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  roleId: uuid("role_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Seed: Creando usuario administrador...");

  try {
    const hashedPassword = bcrypt.hashSync("admin123", 10);

    await db
      .insert(users)
      .values({
        name: "Administrador",
        email: "admin@test.com",
        passwordHash: hashedPassword,
        roleId: "5fc456bd-67e5-497d-bee9-0c499503c1b8", // ID del rol Administrador
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash: hashedPassword,
          roleId: "5fc456bd-67e5-497d-bee9-0c499503c1b8",
        },
      });

    console.log("Seed exitoso: Usuario admin@test.com / admin123 actualizado con bcrypt.");
  } catch (error) {
    console.error("Error durante el seed:", error);
  }
}

main();
