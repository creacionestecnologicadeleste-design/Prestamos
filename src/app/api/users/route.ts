import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, roles } from "@/lib/db/schema";
import { createUserSchema } from "@/lib/validations/user.schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const allUsers = await db.query.users.findMany({
            with: {
                role: true,
            },
            orderBy: [desc(users.createdAt)],
        });

        return NextResponse.json(allUsers);
    } catch (error) {
        console.error("[USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const body = createUserSchema.parse(json);

        const { name, email, password, roleId } = body;

        // Check if user exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return new NextResponse("User already exists", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.insert(users).values({
            name,
            email,
            passwordHash: hashedPassword,
            roleId,
        }).returning();

        return NextResponse.json(newUser[0]);
    } catch (error) {
        console.error("[USERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
