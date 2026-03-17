import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const TOKEN_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

function getEncryptionKey(): Buffer {
    const key = process.env.QR_ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        throw new Error("QR_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
    }
    return Buffer.from(key, "hex");
}

export interface QRPayload {
    userId: string;
    familyBookId?: string;
    memberId?: string;
    timestamp: number;
    nonce: string;
}

/**
 * Encrypt a QR payload into a base64 string
 */
export function encryptQRToken(payload: QRPayload): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const data = JSON.stringify(payload);
    const encrypted = Buffer.concat([
        cipher.update(data, "utf8"),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Format: base64(iv + encrypted + tag)
    const combined = Buffer.concat([iv, encrypted, tag]);
    return combined.toString("base64url");
}

/**
 * Decrypt and validate a QR token
 * Returns the payload if valid, throws if invalid or expired
 */
export function decryptQRToken(token: string): QRPayload {
    const key = getEncryptionKey();
    const combined = Buffer.from(token, "base64url");

    if (combined.length < IV_LENGTH + TAG_LENGTH + 1) {
        throw new Error("رمز QR غير صالح");
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted: string;
    try {
        decrypted = decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
    } catch {
        throw new Error("رمز QR غير صالح أو تم التلاعب به");
    }

    const payload: QRPayload = JSON.parse(decrypted);

    // Check expiry
    const age = Date.now() - payload.timestamp;
    if (age > TOKEN_VALIDITY_MS) {
        throw new Error("انتهت صلاحية رمز QR. يرجى إنشاء رمز جديد");
    }

    if (age < 0) {
        throw new Error("رمز QR غير صالح - الطابع الزمني في المستقبل");
    }

    return payload;
}

/**
 * Generate a fresh QR payload for a user
 */
export function generateQRPayload(
    userId: string,
    familyBookId?: string,
    memberId?: string
): QRPayload {
    return {
        userId,
        familyBookId,
        memberId,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString("hex"),
    };
}
