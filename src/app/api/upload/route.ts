import { NextResponse } from "next/server";
import { uploadToS3, getS3Url } from "@/lib/s3";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const folder = formData.get("folder") as string || "uploads";

        if (!file) {
            return NextResponse.json({ error: "لم يتم العثور على ملف" }, { status: 400 });
        }

        // Validate file type (images only)
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "يسمح برفع الصور فقط" }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Upload to S3
        const key = await uploadToS3(buffer, file.type, folder);
        
        // Return both the key and the full URL
        const url = getS3Url(key);

        return NextResponse.json({ key, url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء رفع الملف" }, { status: 500 });
    }
}
