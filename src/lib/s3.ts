import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "me-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET = process.env.AWS_S3_BUCKET || "dsit-tamween-files";

/**
 * Upload a file to S3
 */
export async function uploadToS3(
    file: Buffer,
    contentType: string,
    folder: string = "uploads"
): Promise<string> {
    const ext = contentType.split("/")[1] || "bin";
    const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

    await s3Client.send(
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
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        })
    );
}

/**
 * Get the full S3 URL for a key
 */
export function getS3Url(key: string): string {
    return `https://${BUCKET}.s3.${process.env.AWS_REGION || "me-south-1"}.amazonaws.com/${key}`;
}
