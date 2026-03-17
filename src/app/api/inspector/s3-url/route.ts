import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "INSPECTOR") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { filename, contentType } = await request.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: "معلومات الملف مفقودة" }, { status: 400 });
        }

        // Validate content type (e.g. only images or PDFs)
        if (!contentType.startsWith("image/") && contentType !== "application/pdf") {
            return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 400 });
        }

        const s3 = new S3Client({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
        });

        // Add a timestamp and unique ID to prevent overwrites
        const uniqueFilename = `inspector-reports/${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME || "dsit-tamween",
            Key: uniqueFilename,
            ContentType: contentType,
        });

        // Presigned URL expires in 15 minutes
        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

        // The public URL assuming the bucket is public or reachable via a CloudFront domain
        // Use a generic S3 URL format if public, or a custom domain if configured
        const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFilename}`;

        return NextResponse.json({ uploadUrl, fileUrl: publicUrl });
    } catch (error) {
        console.error("Presigned URL generation error:", error);
        return NextResponse.json({ error: "فشل في تجهيز رابط الرفع" }, { status: 500 });
    }
}
