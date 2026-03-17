import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// If AWS keys are not set, are empty strings, or are just the "placeholder", fallback to local uploads for testing
const useLocalFallback =
    !process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID === "placeholder" ||
    process.env.AWS_ACCESS_KEY_ID.trim() === "";

const BUCKET = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || "dsit-suwayda-storage";

const s3Client = useLocalFallback ? null : new S3Client({
    region: process.env.AWS_REGION || "me-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

/**
 * Upload a file to S3 (or locally if S3 is not configured)
 */
export async function uploadToS3(
    file: Buffer,
    contentType: string,
    folder: string = "uploads"
): Promise<string> {
    const ext = contentType.split("/")[1] || "bin";
    const fileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

    if (useLocalFallback) {
        console.warn("[Upload] Using local filesystem fallback because S3 keys are not configured.");
        const uploadDir = path.join(process.cwd(), "public", "local-uploads", folder);
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, file);

        // Return public relative path
        return `/local-uploads/${folder}/${fileName}`;
    }

    const key = `${folder}/${fileName}`;
    await s3Client!.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: file,
            ContentType: contentType,
        })
    );

    return key;
}

/**
 * Get a signed URL for reading a file (1 hour expiry)
 */
export async function getSignedReadUrl(key: string): Promise<string> {
    if (key.startsWith("/local-uploads")) return key; // Local files are public

    if (useLocalFallback || !s3Client) return key;

    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Delete a file from S3 (or locally)
 */
export async function deleteFromS3(key: string): Promise<void> {
    if (key.startsWith("/local-uploads")) {
        const filePath = path.join(process.cwd(), "public", key);
        try {
            await fs.unlink(filePath);
        } catch (e) {
            console.error("Failed to delete local file:", e);
        }
        return;
    }

    if (useLocalFallback || !s3Client) return;

    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        })
    );
}

/**
 * Get the full URL for a key (S3 URL or local path)
 */
export function getS3Url(key: string): string {
    if (key.startsWith("/local-uploads")) {
        return key;
    }
    return `https://${BUCKET}.s3.${process.env.AWS_REGION || "me-south-1"}.amazonaws.com/${key}`;
}
