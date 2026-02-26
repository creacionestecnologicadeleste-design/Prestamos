import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const extension = file.name.split(".").pop();
        const filename = `${uuidv4()}.${extension}`;

        // Relative path for database and public access
        const relativePath = `/uploads/users/${filename}`;

        // Absolute path for saving
        const publicDir = join(process.cwd(), "public", "uploads", "users");
        const absolutePath = join(publicDir, filename);

        // Ensure directory exists (extra safety)
        await mkdir(publicDir, { recursive: true });

        await writeFile(absolutePath, buffer);

        return NextResponse.json({ url: relativePath });
    } catch (error) {
        console.error("[UPLOAD_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
