import { fcmAdmin } from "@/lib/firebase-admin";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
}

async function sendFCMMessage(tokens: string[], payload: NotificationPayload) {
    if (!fcmAdmin) {
        console.warn("[FCM] Firebase Admin not initialised. Skipping.");
        return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    if (tokens.length === 0) return { successCount: 0, failureCount: 0, invalidTokens: [] };

    const message = {
        tokens,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        webpush: {
            notification: {
                icon: payload.icon || "/logo.jpeg",
                dir: "rtl",
                lang: "ar",
                vibrate: [200, 100, 200],
            },
            fcmOptions: {
                link: payload.url || "/",
            },
        },
        data: {
            url: payload.url || "/",
        },
    };

    // FCM sendEachForMulticast for batches ≤500
    const invalidTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    const BATCH = 500;
    for (let i = 0; i < tokens.length; i += BATCH) {
        const batch = tokens.slice(i, i + BATCH);
        const batchMessage = { ...message, tokens: batch };
        const response = await fcmAdmin!.sendEachForMulticast(batchMessage as any);

        response.responses.forEach((r, idx) => {
            if (r.success) {
                successCount++;
            } else {
                failureCount++;
                const code = r.error?.code;
                if (
                    code === "messaging/registration-token-not-registered" ||
                    code === "messaging/invalid-registration-token"
                ) {
                    invalidTokens.push(batch[idx]);
                }
            }
        });
    }

    return { successCount, failureCount, invalidTokens };
}

async function cleanupInvalidTokens(invalidTokens: string[]) {
    if (invalidTokens.length > 0) {
        await prisma.pushSubscription.deleteMany({
            where: { fcmToken: { in: invalidTokens } },
        });
    }
}

/**
 * Send FCM notification to a specific user (all their devices)
 */
export async function sendPushToUser(userId: string, payload: NotificationPayload) {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    const tokens = subs.map((s) => s.fcmToken);
    const { invalidTokens } = await sendFCMMessage(tokens, payload);
    await cleanupInvalidTokens(invalidTokens);
}

/**
 * Send FCM notification to all users with a specific role
 */
export async function sendPushToRole(role: UserRole, payload: NotificationPayload) {
    const subs = await prisma.pushSubscription.findMany({
        where: { user: { role, status: "APPROVED" } },
    });
    const tokens = subs.map((s) => s.fcmToken);
    const { invalidTokens } = await sendFCMMessage(tokens, payload);
    await cleanupInvalidTokens(invalidTokens);
}

/**
 * Send FCM notification to all approved users
 */
export async function sendPushToAll(payload: NotificationPayload) {
    const subs = await prisma.pushSubscription.findMany({
        where: { user: { status: "APPROVED" } },
    });
    const tokens = subs.map((s) => s.fcmToken);
    const { invalidTokens } = await sendFCMMessage(tokens, payload);
    await cleanupInvalidTokens(invalidTokens);
}

