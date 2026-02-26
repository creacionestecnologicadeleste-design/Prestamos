import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { permissions } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
    try {
        const allPermissions = await db.query.permissions.findMany({
            orderBy: [asc(permissions.module), asc(permissions.name)],
        });

        return NextResponse.json(allPermissions);
    } catch (error) {
        console.error("[PERMISSIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
